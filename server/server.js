/**
 * JJU Compass - API Server
 *
 * 기능:
 * 1. Kakao Directions API 프록시
 * 2. 검색 결과 캐싱 (SQLite)
 * 3. 즐겨찾기 관리
 * 4. 검색 히스토리
 * 5. Rate Limiting (API 보호)
 */

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Rate Limiting 설정
// ============================================

// 일반 API용 Rate Limiter (분당 100회)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1분
    max: 100, // IP당 최대 100회 요청
    message: { 
        error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
        retryAfter: '1분' 
    },
    standardHeaders: true, // `RateLimit-*` 헤더 포함
    legacyHeaders: false, // `X-RateLimit-*` 헤더 비활성화
});

// 검색 API용 Rate Limiter (분당 30회 - 더 엄격)
const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1분
    max: 30, // IP당 최대 30회 검색
    message: { 
        error: '검색 요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
        retryAfter: '1분' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS 설정
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://jju-map.duckdns.org'],
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true
}));

app.use(express.json());

// 모든 API 경로에 기본 Rate Limiting 적용
app.use('/api/', apiLimiter);

// ============================================
// 미들웨어: 사용자 ID 처리
// ============================================
app.use((req, res, next) => {
    // X-User-Id 헤더 또는 쿼리 파라미터에서 사용자 ID 추출
    req.userId = req.headers['x-user-id'] || req.query.userId || 'anonymous';
    next();
});

// ============================================
// 검색 캐시 API
// ============================================

/**
 * 캐시된 검색 결과 조회
 * GET /api/cache/search?keyword=한식
 */
app.get('/api/cache/search', searchLimiter, async (req, res) => {
    try {
        const { keyword } = req.query;
        
        if (!keyword) {
            return res.status(400).json({ error: 'keyword 파라미터가 필요합니다' });
        }
        
        const cached = await db.getCachedSearch(keyword);
        
        if (cached) {
            console.log(`[Cache Hit] keyword: ${keyword}`);
            return res.json({
                cached: true,
                keyword,
                results: cached.results,
                resultCount: cached.results.length,
                cacheAge: cached.cacheAge
            });
        }
        
        return res.json({
            cached: false,
            keyword,
            results: null
        });
    } catch (error) {
        console.error('[Cache Error]', error);
        res.status(500).json({ error: '캐시 조회 실패', message: error.message });
    }
});

/**
 * 검색 결과 캐시 저장
 * POST /api/cache/search
 * Body: { keyword: string, results: array }
 */
app.post('/api/cache/search', searchLimiter, async (req, res) => {
    try {
        const { keyword, results } = req.body;
        
        if (!keyword || !Array.isArray(results)) {
            return res.status(400).json({ error: 'keyword와 results 배열이 필요합니다' });
        }
        
        const saved = await db.setCachedSearch(keyword, results);
        console.log(`[Cache Set] keyword: ${keyword}, results: ${results.length}`);
        
        // 검색 히스토리에도 추가
        await db.addSearchHistory(req.userId, keyword, results.length);
        
        res.json({
            success: true,
            ...saved
        });
    } catch (error) {
        console.error('[Cache Error]', error);
        res.status(500).json({ error: '캐시 저장 실패', message: error.message });
    }
});

/**
 * 캐시 통계
 * GET /api/cache/stats
 */
app.get('/api/cache/stats', async (req, res) => {
    try {
        const cacheStats = await db.getCacheStats();
        const dbStats = await db.getDatabaseStats();
        
        res.json({
            cache: cacheStats,
            database: dbStats
        });
    } catch (error) {
        res.status(500).json({ error: '통계 조회 실패', message: error.message });
    }
});

/**
 * 캐시 정리
 * DELETE /api/cache
 */
app.delete('/api/cache', async (req, res) => {
    try {
        const result = await db.cleanupDatabase();
        res.json({
            success: true,
            message: '캐시 정리 완료',
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: '캐시 정리 실패', message: error.message });
    }
});

// ============================================
// 즐겨찾기 API
// ============================================

/**
 * 즐겨찾기 목록 조회
 * GET /api/favorites
 */
app.get('/api/favorites', async (req, res) => {
    try {
        const favorites = await db.getFavorites(req.userId);
        res.json({
            userId: req.userId,
            count: favorites.length,
            favorites
        });
    } catch (error) {
        console.error('[Favorites Error]', error);
        res.status(500).json({ error: '즐겨찾기 조회 실패', message: error.message });
    }
});

/**
 * 즐겨찾기 추가
 * POST /api/favorites
 * Body: { place object from Kakao API }
 */
app.post('/api/favorites', async (req, res) => {
    try {
        const place = req.body;
        
        if (!place || (!place.id && !place.place_id)) {
            return res.status(400).json({ error: '장소 정보가 필요합니다' });
        }
        
        const result = await db.addFavorite(req.userId, place);
        console.log(`[Favorite Add] user: ${req.userId}, place: ${place.place_name}`);
        
        res.json(result);
    } catch (error) {
        console.error('[Favorites Error]', error);
        res.status(500).json({ error: '즐겨찾기 추가 실패', message: error.message });
    }
});

/**
 * 즐겨찾기 제거
 * DELETE /api/favorites/:placeId
 */
app.delete('/api/favorites/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        const result = await db.removeFavorite(req.userId, placeId);
        console.log(`[Favorite Remove] user: ${req.userId}, placeId: ${placeId}`);
        
        res.json(result);
    } catch (error) {
        console.error('[Favorites Error]', error);
        res.status(500).json({ error: '즐겨찾기 제거 실패', message: error.message });
    }
});

/**
 * 특정 장소 즐겨찾기 여부 확인
 * GET /api/favorites/check/:placeId
 */
app.get('/api/favorites/check/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        const isFavorite = await db.isFavorite(req.userId, placeId);
        
        res.json({ placeId, isFavorite });
    } catch (error) {
        res.status(500).json({ error: '확인 실패', message: error.message });
    }
});

/**
 * 여러 장소 즐겨찾기 상태 일괄 확인
 * POST /api/favorites/check
 * Body: { placeIds: string[] }
 */
app.post('/api/favorites/check', async (req, res) => {
    try {
        const { placeIds } = req.body;
        
        if (!Array.isArray(placeIds)) {
            return res.status(400).json({ error: 'placeIds 배열이 필요합니다' });
        }
        
        const result = await db.checkFavorites(req.userId, placeIds);
        res.json({ userId: req.userId, favorites: result });
    } catch (error) {
        res.status(500).json({ error: '확인 실패', message: error.message });
    }
});

// ============================================
// 검색 히스토리 API
// ============================================

/**
 * 검색 히스토리 조회
 * GET /api/history?limit=10
 */
app.get('/api/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const history = await db.getSearchHistory(req.userId, limit);
        
        res.json({
            userId: req.userId,
            count: history.length,
            history
        });
    } catch (error) {
        console.error('[History Error]', error);
        res.status(500).json({ error: '히스토리 조회 실패', message: error.message });
    }
});

/**
 * 인기 검색어 조회
 * GET /api/history/popular?limit=10
 */
app.get('/api/history/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const popular = await db.getPopularSearches(limit);
        
        res.json({
            count: popular.length,
            popular
        });
    } catch (error) {
        res.status(500).json({ error: '인기 검색어 조회 실패', message: error.message });
    }
});

/**
 * 검색 히스토리 삭제
 * DELETE /api/history
 */
app.delete('/api/history', async (req, res) => {
    try {
        const result = await db.clearSearchHistory(req.userId);
        res.json({
            success: true,
            message: '검색 기록이 삭제되었습니다',
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: '히스토리 삭제 실패', message: error.message });
    }
});

// ============================================
// 사용자 설정 API (홈 위치)
// ============================================

/**
 * 홈 위치 조회
 * GET /api/settings/home
 */
app.get('/api/settings/home', async (req, res) => {
    try {
        const home = await db.getHomeLocation(req.userId);
        
        if (home) {
            res.json({
                userId: req.userId,
                hasHome: true,
                ...home
            });
        } else {
            res.json({
                userId: req.userId,
                hasHome: false,
                lat: null,
                lng: null
            });
        }
    } catch (error) {
        console.error('[Settings Error]', error);
        res.status(500).json({ error: '홈 위치 조회 실패', message: error.message });
    }
});

/**
 * 홈 위치 저장
 * POST /api/settings/home
 * Body: { lat: number, lng: number }
 */
app.post('/api/settings/home', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({ error: 'lat과 lng가 필요합니다 (숫자)' });
        }
        
        const result = await db.setHomeLocation(req.userId, lat, lng);
        console.log(`[Home Set] user: ${req.userId}, lat: ${lat}, lng: ${lng}`);
        
        res.json(result);
    } catch (error) {
        console.error('[Settings Error]', error);
        res.status(500).json({ error: '홈 위치 저장 실패', message: error.message });
    }
});

/**
 * 홈 위치 삭제
 * DELETE /api/settings/home
 */
app.delete('/api/settings/home', async (req, res) => {
    try {
        const result = await db.clearHomeLocation(req.userId);
        console.log(`[Home Clear] user: ${req.userId}`);
        
        res.json(result);
    } catch (error) {
        console.error('[Settings Error]', error);
        res.status(500).json({ error: '홈 위치 삭제 실패', message: error.message });
    }
});

// ============================================
// 사용자 ID 생성 API
// ============================================

/**
 * 새 사용자 ID 생성
 * POST /api/user/create
 */
app.post('/api/user/create', (req, res) => {
    const userId = uuidv4();
    console.log(`[User Created] ${userId}`);
    res.json({ userId });
});

// ============================================
// Directions API (기존 기능)
// ============================================

// 인메모리 경로 캐시 (DB 캐시와 별도)
const routeCache = new Map();
const ROUTE_CACHE_TTL = 60 * 60 * 1000;

/**
 * 경로 찾기 엔드포인트
 * GET /api/directions?origin=lng,lat&destination=lng,lat&priority=RECOMMEND
 */
app.get('/api/directions', async (req, res) => {
    try {
        const { origin, destination, priority = 'RECOMMEND' } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({
                error: 'origin과 destination 파라미터가 필요합니다',
                example: '/api/directions?origin=127.092,35.814&destination=127.095,35.816'
            });
        }

        const cacheKey = `${origin}_${destination}_${priority}`;

        // 메모리 캐시 확인
        const cached = routeCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < ROUTE_CACHE_TTL)) {
            console.log(`[Route Cache Hit] ${cacheKey}`);
            return res.json({
                ...cached.data,
                cached: true,
                cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
            });
        }

        const apiKey = process.env.KAKAO_REST_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'KAKAO_REST_API_KEY가 설정되지 않았습니다',
                message: '.env 파일에 KAKAO_REST_API_KEY를 추가하세요'
            });
        }

        const kakaoUrl = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}&priority=${priority}`;
        console.log(`[Directions API Call] ${kakaoUrl}`);

        const response = await fetch(kakaoUrl, {
            method: 'GET',
            headers: {
                'Authorization': `KakaoAK ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Kakao API Error] ${response.status}: ${errorText}`);
            return res.status(response.status).json({
                error: '카카오 API 호출 실패',
                status: response.status,
                message: errorText
            });
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const sections = route.sections || [];

            const allRoads = [];
            sections.forEach(section => {
                if (section.roads) {
                    section.roads.forEach(road => {
                        if (road.vertexes && road.vertexes.length > 0) {
                            for (let i = 0; i < road.vertexes.length; i += 2) {
                                allRoads.push({
                                    lng: road.vertexes[i],
                                    lat: road.vertexes[i + 1]
                                });
                            }
                        }
                    });
                }
            });

            const result = {
                source: 'kakao_directions',
                path: allRoads,
                distance: route.summary?.distance || 0,
                duration: route.summary?.duration || 0,
                priority: priority,
                cached: false
            };

            routeCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            if (routeCache.size > 100) {
                const firstKey = routeCache.keys().next().value;
                routeCache.delete(firstKey);
            }

            console.log(`[Directions Success] 경로 길이: ${allRoads.length}개 점, 거리: ${result.distance}m`);
            return res.json(result);
        } else {
            return res.status(404).json({ error: '경로를 찾을 수 없습니다', data });
        }
    } catch (error) {
        console.error('[Server Error]', error);
        res.status(500).json({ error: '서버 오류', message: error.message });
    }
});

// ============================================
// 헬스체크 및 정보
// ============================================

/**
 * 헬스체크
 * GET /health
 */
app.get('/health', async (req, res) => {
    try {
        const stats = await db.getDatabaseStats();
        res.json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: stats
        });
    } catch (error) {
        res.json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: 'unavailable'
        });
    }
});

/**
 * API 정보
 * GET /api
 */
app.get('/api', (req, res) => {
    res.json({
        name: 'JJU Compass API',
        version: '2.0.0',
        endpoints: {
            cache: {
                'GET /api/cache/search': '캐시된 검색 결과 조회',
                'POST /api/cache/search': '검색 결과 캐시 저장',
                'GET /api/cache/stats': '캐시 통계',
                'DELETE /api/cache': '캐시 정리'
            },
            favorites: {
                'GET /api/favorites': '즐겨찾기 목록',
                'POST /api/favorites': '즐겨찾기 추가',
                'DELETE /api/favorites/:placeId': '즐겨찾기 제거',
                'GET /api/favorites/check/:placeId': '즐겨찾기 여부 확인',
                'POST /api/favorites/check': '여러 장소 즐겨찾기 확인'
            },
            history: {
                'GET /api/history': '검색 히스토리',
                'GET /api/history/popular': '인기 검색어',
                'DELETE /api/history': '히스토리 삭제'
            },
            settings: {
                'GET /api/settings/home': '홈 위치 조회',
                'POST /api/settings/home': '홈 위치 저장',
                'DELETE /api/settings/home': '홈 위치 삭제'
            },
            directions: {
                'GET /api/directions': '도보 경로 찾기'
            },
            user: {
                'POST /api/user/create': '사용자 ID 생성'
            }
        }
    });
});

// ============================================
// 서버 시작
// ============================================

async function startServer() {
    // 데이터베이스 초기화
    try {
        await db.initDatabase();
        console.log('[DB] Database ready');
    } catch (error) {
        console.error('[DB] Database initialization failed:', error.message);
    }
    
    app.listen(PORT, async () => {
        console.log(`
╔════════════════════════════════════════════╗
║      JJU Compass API Server v2.0           ║
╠════════════════════════════════════════════╣
║   Port: ${PORT}                               ║
║   Status: Running                          ║
║                                            ║
║   Endpoints:                               ║
║   - /api/cache/search   (검색 캐시)        ║
║   - /api/favorites      (즐겨찾기)         ║
║   - /api/history        (검색 기록)        ║
║   - /api/directions     (경로 찾기)        ║
╚════════════════════════════════════════════╝
        `);

        if (!process.env.KAKAO_REST_API_KEY) {
            console.warn('⚠️  경고: KAKAO_REST_API_KEY가 설정되지 않았습니다!');
        }
        
        // 데이터베이스 통계 출력
        try {
            const stats = await db.getDatabaseStats();
            console.log(`📊 Database Stats: Cache=${stats.cache}, Favorites=${stats.favorites}, History=${stats.history}`);
        } catch (error) {
            console.error('❌ Database stats failed:', error.message);
        }
    });
}

startServer();

// 에러 핸들링
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

/**
 * JJU Compass - Kakao Directions API Proxy Server
 *
 * 카카오 Directions API를 호출하는 프록시 서버
 * - API 키를 서버에 숨겨서 보안 강화
 * - 경로 결과 캐싱으로 API 호출 최소화
 * - CORS 문제 해결
 */

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://jju-map.duckdns.org'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// 간단한 인메모리 캐시
const routeCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

/**
 * 경로 찾기 엔드포인트
 * GET /api/directions?origin=lng,lat&destination=lng,lat&priority=RECOMMEND
 */
app.get('/api/directions', async (req, res) => {
    try {
        const { origin, destination, priority = 'RECOMMEND' } = req.query;

        // 파라미터 검증
        if (!origin || !destination) {
            return res.status(400).json({
                error: 'origin과 destination 파라미터가 필요합니다',
                example: '/api/directions?origin=127.092,35.814&destination=127.095,35.816'
            });
        }

        // 캐시 키 생성
        const cacheKey = `${origin}_${destination}_${priority}`;

        // 캐시 확인
        const cached = routeCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            console.log(`[Cache Hit] ${cacheKey}`);
            return res.json({
                ...cached.data,
                cached: true,
                cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
            });
        }

        // 카카오 API 키 확인
        const apiKey = process.env.KAKAO_REST_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'KAKAO_REST_API_KEY가 설정되지 않았습니다',
                message: '.env 파일에 KAKAO_REST_API_KEY를 추가하세요'
            });
        }

        // 카카오 Directions API 호출
        const kakaoUrl = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}&priority=${priority}`;

        console.log(`[API Call] ${kakaoUrl}`);

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

        // 경로 데이터 추출 및 변환
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const sections = route.sections || [];

            // 모든 섹션의 경로를 합침
            const allRoads = [];
            sections.forEach(section => {
                if (section.roads) {
                    section.roads.forEach(road => {
                        if (road.vertexes && road.vertexes.length > 0) {
                            // vertexes는 [lng, lat, lng, lat, ...] 형식
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
                distance: route.summary?.distance || 0,  // 미터
                duration: route.summary?.duration || 0,  // 초
                priority: priority,
                cached: false
            };

            // 캐시 저장
            routeCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            // 캐시 크기 제한 (최대 100개)
            if (routeCache.size > 100) {
                const firstKey = routeCache.keys().next().value;
                routeCache.delete(firstKey);
            }

            console.log(`[Success] 경로 길이: ${allRoads.length}개 점, 거리: ${result.distance}m`);

            return res.json(result);
        } else {
            return res.status(404).json({
                error: '경로를 찾을 수 없습니다',
                data
            });
        }

    } catch (error) {
        console.error('[Server Error]', error);
        res.status(500).json({
            error: '서버 오류',
            message: error.message
        });
    }
});

/**
 * 캐시 정보 확인
 * GET /api/cache/stats
 */
app.get('/api/cache/stats', (req, res) => {
    res.json({
        cacheSize: routeCache.size,
        cacheTTL: CACHE_TTL / 1000,
        entries: Array.from(routeCache.entries()).map(([key, value]) => ({
            key,
            age: Math.floor((Date.now() - value.timestamp) / 1000),
            distance: value.data.distance
        }))
    });
});

/**
 * 캐시 초기화
 * DELETE /api/cache
 */
app.delete('/api/cache', (req, res) => {
    const size = routeCache.size;
    routeCache.clear();
    res.json({
        message: '캐시가 초기화되었습니다',
        clearedItems: size
    });
});

/**
 * 헬스체크
 * GET /health
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   JJU Compass Directions Proxy Server     ║
╠════════════════════════════════════════════╣
║   포트: ${PORT}
║   상태: 실행 중                            ║
║   API: /api/directions                     ║
║   캐시: /api/cache/stats                   ║
╚════════════════════════════════════════════╝
    `);

    if (!process.env.KAKAO_REST_API_KEY) {
        console.warn('⚠️  경고: KAKAO_REST_API_KEY가 설정되지 않았습니다!');
        console.warn('   .env 파일에 KAKAO_REST_API_KEY=your-key를 추가하세요.');
    }
});

// 에러 핸들링
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

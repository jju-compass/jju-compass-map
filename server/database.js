/**
 * JJU Compass Map - SQLite Database Module
 * 
 * Uses sql.js (pure JavaScript SQLite - no native compilation required)
 * 
 * 테이블:
 * 1. search_cache - 검색 결과 캐싱
 * 2. favorites - 즐겨찾기
 * 3. search_history - 검색 히스토리
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 데이터베이스 파일 경로
const DB_PATH = path.join(__dirname, 'jju_compass.db');

// 캐시 TTL (1시간)
const CACHE_TTL_MS = 60 * 60 * 1000;

// 데이터베이스 인스턴스 (싱글톤)
let dbInstance = null;
let SQL = null;

/**
 * 데이터베이스 초기화 (비동기)
 */
async function initDatabase() {
    if (!SQL) {
        SQL = await initSqlJs();
    }
    
    let db;
    
    // 기존 DB 파일이 있으면 로드
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
        console.log('[DB] Loaded existing database from', DB_PATH);
    } else {
        db = new SQL.Database();
        console.log('[DB] Created new database');
    }
    
    // 테이블 생성
    db.run(`
        -- 검색 결과 캐시 테이블
        CREATE TABLE IF NOT EXISTS search_cache (
            keyword TEXT PRIMARY KEY,
            results_json TEXT NOT NULL,
            result_count INTEGER DEFAULT 0,
            cached_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );
    `);
    
    db.run(`
        -- 즐겨찾기 테이블
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            place_id TEXT NOT NULL,
            place_name TEXT NOT NULL,
            place_url TEXT,
            address TEXT,
            phone TEXT,
            category TEXT,
            lat REAL,
            lng REAL,
            added_at INTEGER NOT NULL,
            UNIQUE(user_id, place_id)
        );
    `);
    
    db.run(`
        -- 검색 히스토리 테이블
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            keyword TEXT NOT NULL,
            result_count INTEGER DEFAULT 0,
            searched_at INTEGER NOT NULL
        );
    `);
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_history_user ON search_history(user_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_history_keyword ON search_history(keyword);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_cache_expires ON search_cache(expires_at);`);
    
    // 초기 저장
    saveDatabase(db);
    
    console.log('[DB] Database initialized at', DB_PATH);
    return db;
}

/**
 * 데이터베이스를 파일에 저장
 */
function saveDatabase(db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

/**
 * DB 인스턴스 가져오기 (async)
 */
async function getDb() {
    if (!dbInstance) {
        dbInstance = await initDatabase();
    }
    return dbInstance;
}

/**
 * 쿼리 결과를 객체 배열로 변환
 */
function resultToObjects(result) {
    if (!result || result.length === 0) return [];
    const stmt = result[0];
    const columns = stmt.columns;
    const values = stmt.values;
    
    return values.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });
        return obj;
    });
}

// ============================================
// 검색 캐시 관련 함수
// ============================================

/**
 * 캐시된 검색 결과 조회
 */
async function getCachedSearch(keyword) {
    const db = await getDb();
    const now = Date.now();
    
    const result = db.exec(
        `SELECT results_json, cached_at FROM search_cache WHERE keyword = ? AND expires_at > ?`,
        [keyword, now]
    );
    
    const rows = resultToObjects(result);
    
    if (rows.length > 0) {
        const row = rows[0];
        return {
            results: JSON.parse(row.results_json),
            cachedAt: row.cached_at,
            cacheAge: Math.floor((now - row.cached_at) / 1000)
        };
    }
    return null;
}

/**
 * 검색 결과 캐시 저장
 */
async function setCachedSearch(keyword, results) {
    const db = await getDb();
    const now = Date.now();
    const expiresAt = now + CACHE_TTL_MS;
    
    db.run(
        `INSERT OR REPLACE INTO search_cache (keyword, results_json, result_count, cached_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [keyword, JSON.stringify(results), results.length, now, expiresAt]
    );
    
    saveDatabase(db);
    return { keyword, resultCount: results.length, expiresAt };
}

/**
 * 만료된 캐시 정리
 */
async function cleanExpiredCache() {
    const db = await getDb();
    const now = Date.now();
    
    db.run('DELETE FROM search_cache WHERE expires_at <= ?', [now]);
    saveDatabase(db);
    
    return db.getRowsModified();
}

/**
 * 캐시 통계
 */
async function getCacheStats() {
    const db = await getDb();
    const now = Date.now();
    
    const result = db.exec(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN expires_at > ${now} THEN 1 ELSE 0 END) as valid,
            SUM(result_count) as total_results
        FROM search_cache
    `);
    
    const rows = resultToObjects(result);
    return rows[0] || { total: 0, valid: 0, total_results: 0 };
}

// ============================================
// 즐겨찾기 관련 함수
// ============================================

/**
 * 즐겨찾기 추가
 */
async function addFavorite(userId, place) {
    const db = await getDb();
    const now = Date.now();
    
    try {
        db.run(
            `INSERT INTO favorites (user_id, place_id, place_name, place_url, address, phone, category, lat, lng, added_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                place.id || place.place_id,
                place.place_name,
                place.place_url || null,
                place.road_address_name || place.address_name || null,
                place.phone || null,
                place.category_name || null,
                parseFloat(place.y) || null,
                parseFloat(place.x) || null,
                now
            ]
        );
        saveDatabase(db);
        return { success: true, message: '즐겨찾기에 추가되었습니다' };
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return { success: false, message: '이미 즐겨찾기에 있습니다' };
        }
        throw err;
    }
}

/**
 * 즐겨찾기 제거
 */
async function removeFavorite(userId, placeId) {
    const db = await getDb();
    
    db.run(
        `DELETE FROM favorites WHERE user_id = ? AND place_id = ?`,
        [userId, placeId]
    );
    
    const changes = db.getRowsModified();
    saveDatabase(db);
    
    return { 
        success: changes > 0,
        message: changes > 0 ? '즐겨찾기에서 제거되었습니다' : '해당 항목을 찾을 수 없습니다'
    };
}

/**
 * 사용자의 즐겨찾기 목록 조회
 */
async function getFavorites(userId) {
    const db = await getDb();
    
    const result = db.exec(
        `SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC`,
        [userId]
    );
    
    return resultToObjects(result);
}

/**
 * 특정 장소가 즐겨찾기인지 확인
 */
async function isFavorite(userId, placeId) {
    const db = await getDb();
    
    const result = db.exec(
        `SELECT 1 FROM favorites WHERE user_id = ? AND place_id = ?`,
        [userId, placeId]
    );
    
    return resultToObjects(result).length > 0;
}

/**
 * 여러 장소의 즐겨찾기 상태 확인
 */
async function checkFavorites(userId, placeIds) {
    const db = await getDb();
    
    const placeholders = placeIds.map(() => '?').join(',');
    const result = db.exec(
        `SELECT place_id FROM favorites WHERE user_id = ? AND place_id IN (${placeholders})`,
        [userId, ...placeIds]
    );
    
    const rows = resultToObjects(result);
    const favoriteSet = new Set(rows.map(r => r.place_id));
    
    return placeIds.reduce((acc, id) => {
        acc[id] = favoriteSet.has(id);
        return acc;
    }, {});
}

// ============================================
// 검색 히스토리 관련 함수
// ============================================

/**
 * 검색 기록 추가
 */
async function addSearchHistory(userId, keyword, resultCount = 0) {
    const db = await getDb();
    const now = Date.now();
    
    db.run(
        `INSERT INTO search_history (user_id, keyword, result_count, searched_at)
         VALUES (?, ?, ?, ?)`,
        [userId, keyword, resultCount, now]
    );
    
    saveDatabase(db);
    return { success: true };
}

/**
 * 사용자의 최근 검색 기록 조회
 */
async function getSearchHistory(userId, limit = 10) {
    const db = await getDb();
    
    const result = db.exec(
        `SELECT keyword, MAX(searched_at) as last_searched, SUM(result_count) as total_results, COUNT(*) as search_count
         FROM search_history 
         WHERE user_id = ?
         GROUP BY keyword
         ORDER BY last_searched DESC
         LIMIT ?`,
        [userId, limit]
    );
    
    return resultToObjects(result);
}

/**
 * 인기 검색어 조회 (전체 사용자)
 */
async function getPopularSearches(limit = 10) {
    const db = await getDb();
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const result = db.exec(
        `SELECT keyword, COUNT(*) as search_count, AVG(result_count) as avg_results
         FROM search_history
         WHERE searched_at > ?
         GROUP BY keyword
         ORDER BY search_count DESC
         LIMIT ?`,
        [weekAgo, limit]
    );
    
    return resultToObjects(result);
}

/**
 * 검색 기록 삭제
 */
async function clearSearchHistory(userId) {
    const db = await getDb();
    
    db.run('DELETE FROM search_history WHERE user_id = ?', [userId]);
    const changes = db.getRowsModified();
    saveDatabase(db);
    
    return { deleted: changes };
}

// ============================================
// 유틸리티
// ============================================

/**
 * 데이터베이스 정리 (만료 캐시 삭제, 오래된 히스토리 정리)
 */
async function cleanupDatabase() {
    const db = await getDb();
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // 만료된 캐시 삭제
    db.run('DELETE FROM search_cache WHERE expires_at <= ?', [now]);
    const cacheDeleted = db.getRowsModified();
    
    // 30일 이상 된 히스토리 삭제
    db.run('DELETE FROM search_history WHERE searched_at < ?', [thirtyDaysAgo]);
    const historyDeleted = db.getRowsModified();
    
    saveDatabase(db);
    return { cacheDeleted, historyDeleted };
}

/**
 * 데이터베이스 통계
 */
async function getDatabaseStats() {
    const db = await getDb();
    
    const cacheResult = db.exec('SELECT COUNT(*) as count FROM search_cache');
    const favoritesResult = db.exec('SELECT COUNT(*) as count FROM favorites');
    const historyResult = db.exec('SELECT COUNT(*) as count FROM search_history');
    const usersResult = db.exec('SELECT COUNT(DISTINCT user_id) as count FROM favorites');
    
    const getCount = (result) => {
        const rows = resultToObjects(result);
        return rows.length > 0 ? rows[0].count : 0;
    };
    
    return {
        cache: getCount(cacheResult),
        favorites: getCount(favoritesResult),
        history: getCount(historyResult),
        uniqueUsers: getCount(usersResult)
    };
}

module.exports = {
    getDb,
    initDatabase,
    // 캐시
    getCachedSearch,
    setCachedSearch,
    cleanExpiredCache,
    getCacheStats,
    // 즐겨찾기
    addFavorite,
    removeFavorite,
    getFavorites,
    isFavorite,
    checkFavorites,
    // 히스토리
    addSearchHistory,
    getSearchHistory,
    getPopularSearches,
    clearSearchHistory,
    // 유틸리티
    cleanupDatabase,
    getDatabaseStats
};

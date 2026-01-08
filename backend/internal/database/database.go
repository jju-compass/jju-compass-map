package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

// DB holds the database connection
var DB *sql.DB

// Connect establishes a connection to the SQLite database
func Connect(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite", dbPath+"?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)")
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// Set connection pool settings
	DB.SetMaxOpenConns(10)
	DB.SetMaxIdleConns(5)

	log.Printf("Connected to database: %s", dbPath)
	return nil
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// InitSchema creates tables if they don't exist
func InitSchema() error {
	schema := `
	-- 검색 캐시 테이블
	CREATE TABLE IF NOT EXISTS search_cache (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		keyword TEXT NOT NULL UNIQUE,
		results_json TEXT NOT NULL,
		cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		expires_at DATETIME NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_search_cache_keyword ON search_cache(keyword);
	CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

	-- 즐겨찾기 테이블
	CREATE TABLE IF NOT EXISTS favorites (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id TEXT NOT NULL,
		place_id TEXT NOT NULL,
		place_name TEXT NOT NULL,
		address TEXT,
		road_address TEXT,
		lat REAL NOT NULL,
		lng REAL NOT NULL,
		phone TEXT,
		category TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id, place_id)
	);
	CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

	-- 검색 기록 테이블
	CREATE TABLE IF NOT EXISTS search_history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id TEXT NOT NULL,
		keyword TEXT NOT NULL,
		result_count INTEGER DEFAULT 0,
		searched_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_history_user ON search_history(user_id);
	CREATE INDEX IF NOT EXISTS idx_history_keyword ON search_history(keyword);

	-- 사용자 설정 테이블
	CREATE TABLE IF NOT EXISTS user_settings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id TEXT NOT NULL UNIQUE,
		home_lat REAL,
		home_lng REAL,
		home_name TEXT,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_settings_user ON user_settings(user_id);
	`

	_, err := DB.Exec(schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	log.Println("Database schema initialized")
	return nil
}

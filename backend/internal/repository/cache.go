package repository

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/jju-compass/jju-compass-map/internal/models"
)

// CacheRepository handles search cache operations
type CacheRepository struct {
	db *sql.DB
}

// NewCacheRepository creates a new cache repository
func NewCacheRepository(db *sql.DB) *CacheRepository {
	return &CacheRepository{db: db}
}

// Get retrieves cached search results by keyword
func (r *CacheRepository) Get(keyword string) (*models.SearchCache, error) {
	var cache models.SearchCache
	err := r.db.QueryRow(`
		SELECT id, keyword, results_json, cached_at, expires_at 
		FROM search_cache 
		WHERE keyword = ? AND expires_at > datetime('now')
	`, keyword).Scan(&cache.ID, &cache.Keyword, &cache.ResultsJSON, &cache.CachedAt, &cache.ExpiresAt)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &cache, nil
}

// Set stores search results in cache
func (r *CacheRepository) Set(keyword string, results []models.Place, ttl time.Duration) error {
	resultsJSON, err := json.Marshal(results)
	if err != nil {
		return err
	}

	expiresAt := time.Now().Add(ttl)
	_, err = r.db.Exec(`
		INSERT INTO search_cache (keyword, results_json, expires_at) 
		VALUES (?, ?, ?)
		ON CONFLICT(keyword) DO UPDATE SET 
			results_json = excluded.results_json,
			cached_at = CURRENT_TIMESTAMP,
			expires_at = excluded.expires_at
	`, keyword, string(resultsJSON), expiresAt)

	return err
}

// Delete removes a cache entry
func (r *CacheRepository) Delete(keyword string) error {
	_, err := r.db.Exec("DELETE FROM search_cache WHERE keyword = ?", keyword)
	return err
}

// DeleteExpired removes all expired cache entries
func (r *CacheRepository) DeleteExpired() (int64, error) {
	result, err := r.db.Exec("DELETE FROM search_cache WHERE expires_at <= datetime('now')")
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// GetStats returns cache statistics
func (r *CacheRepository) GetStats() (total int, valid int, err error) {
	err = r.db.QueryRow("SELECT COUNT(*) FROM search_cache").Scan(&total)
	if err != nil {
		return
	}
	err = r.db.QueryRow("SELECT COUNT(*) FROM search_cache WHERE expires_at > datetime('now')").Scan(&valid)
	return
}

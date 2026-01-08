package repository

import (
	"database/sql"

	"github.com/jju-compass/jju-compass-map/internal/models"
)

// HistoryRepository handles search history operations
type HistoryRepository struct {
	db *sql.DB
}

// NewHistoryRepository creates a new history repository
func NewHistoryRepository(db *sql.DB) *HistoryRepository {
	return &HistoryRepository{db: db}
}

// GetRecent retrieves recent search history for a user
func (r *HistoryRepository) GetRecent(userID string, limit int) ([]models.SearchHistory, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, keyword, result_count, searched_at
		FROM search_history
		WHERE user_id = ?
		ORDER BY searched_at DESC
		LIMIT ?
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []models.SearchHistory
	for rows.Next() {
		var h models.SearchHistory
		err := rows.Scan(&h.ID, &h.UserID, &h.Keyword, &h.ResultCount, &h.SearchedAt)
		if err != nil {
			return nil, err
		}
		history = append(history, h)
	}
	return history, rows.Err()
}

// Add adds a new search history entry
func (r *HistoryRepository) Add(userID, keyword string, resultCount int) error {
	_, err := r.db.Exec(`
		INSERT INTO search_history (user_id, keyword, result_count)
		VALUES (?, ?, ?)
	`, userID, keyword, resultCount)
	return err
}

// GetPopular retrieves most popular search keywords
func (r *HistoryRepository) GetPopular(limit int) ([]models.PopularKeyword, error) {
	rows, err := r.db.Query(`
		SELECT keyword, COUNT(*) as count
		FROM search_history
		GROUP BY keyword
		ORDER BY count DESC
		LIMIT ?
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var popular []models.PopularKeyword
	for rows.Next() {
		var p models.PopularKeyword
		err := rows.Scan(&p.Keyword, &p.Count)
		if err != nil {
			return nil, err
		}
		popular = append(popular, p)
	}
	return popular, rows.Err()
}

// DeleteAll removes all search history for a user
func (r *HistoryRepository) DeleteAll(userID string) error {
	_, err := r.db.Exec("DELETE FROM search_history WHERE user_id = ?", userID)
	return err
}

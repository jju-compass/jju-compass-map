package repository

import (
	"database/sql"

	"github.com/jju-compass/jju-compass-map/internal/models"
)

// FavoriteRepository handles favorite place operations
type FavoriteRepository struct {
	db *sql.DB
}

// NewFavoriteRepository creates a new favorite repository
func NewFavoriteRepository(db *sql.DB) *FavoriteRepository {
	return &FavoriteRepository{db: db}
}

// GetAll retrieves all favorites for a user
func (r *FavoriteRepository) GetAll(userID string) ([]models.Favorite, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, place_id, place_name, address, road_address, 
		       lat, lng, phone, category, created_at
		FROM favorites 
		WHERE user_id = ? 
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var favorites []models.Favorite
	for rows.Next() {
		var f models.Favorite
		var address, roadAddress, phone, category sql.NullString
		err := rows.Scan(&f.ID, &f.UserID, &f.PlaceID, &f.PlaceName,
			&address, &roadAddress, &f.Lat, &f.Lng, &phone, &category, &f.CreatedAt)
		if err != nil {
			return nil, err
		}
		f.Address = address.String
		f.RoadAddress = roadAddress.String
		f.Phone = phone.String
		f.Category = category.String
		favorites = append(favorites, f)
	}
	return favorites, rows.Err()
}

// Add adds a new favorite
func (r *FavoriteRepository) Add(f *models.Favorite) error {
	result, err := r.db.Exec(`
		INSERT INTO favorites (user_id, place_id, place_name, address, road_address, lat, lng, phone, category)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, f.UserID, f.PlaceID, f.PlaceName, f.Address, f.RoadAddress, f.Lat, f.Lng, f.Phone, f.Category)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	f.ID = id
	return nil
}

// Delete removes a favorite by user and place ID
func (r *FavoriteRepository) Delete(userID, placeID string) error {
	_, err := r.db.Exec("DELETE FROM favorites WHERE user_id = ? AND place_id = ?", userID, placeID)
	return err
}

// Exists checks if a place is in user's favorites
func (r *FavoriteRepository) Exists(userID, placeID string) (bool, error) {
	var count int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM favorites WHERE user_id = ? AND place_id = ?
	`, userID, placeID).Scan(&count)
	return count > 0, err
}

// DeleteAll removes all favorites for a user
func (r *FavoriteRepository) DeleteAll(userID string) error {
	_, err := r.db.Exec("DELETE FROM favorites WHERE user_id = ?", userID)
	return err
}

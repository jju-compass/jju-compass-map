package repository

import (
	"database/sql"

	"github.com/jju-compass/jju-compass-map/internal/models"
)

// SettingsRepository handles user settings operations
type SettingsRepository struct {
	db *sql.DB
}

// NewSettingsRepository creates a new settings repository
func NewSettingsRepository(db *sql.DB) *SettingsRepository {
	return &SettingsRepository{db: db}
}

// GetHome retrieves home location for a user
func (r *SettingsRepository) GetHome(userID string) (*models.UserSettings, error) {
	var s models.UserSettings
	var homeLat, homeLng sql.NullFloat64
	var homeName sql.NullString

	err := r.db.QueryRow(`
		SELECT id, user_id, home_lat, home_lng, home_name, updated_at
		FROM user_settings
		WHERE user_id = ?
	`, userID).Scan(&s.ID, &s.UserID, &homeLat, &homeLng, &homeName, &s.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if homeLat.Valid {
		s.HomeLat = &homeLat.Float64
	}
	if homeLng.Valid {
		s.HomeLng = &homeLng.Float64
	}
	s.HomeName = homeName.String

	return &s, nil
}

// SetHome saves home location for a user
func (r *SettingsRepository) SetHome(userID string, lat, lng float64, name string) error {
	_, err := r.db.Exec(`
		INSERT INTO user_settings (user_id, home_lat, home_lng, home_name)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			home_lat = excluded.home_lat,
			home_lng = excluded.home_lng,
			home_name = excluded.home_name,
			updated_at = CURRENT_TIMESTAMP
	`, userID, lat, lng, name)
	return err
}

// DeleteHome removes home location for a user
func (r *SettingsRepository) DeleteHome(userID string) error {
	_, err := r.db.Exec(`
		UPDATE user_settings 
		SET home_lat = NULL, home_lng = NULL, home_name = NULL, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = ?
	`, userID)
	return err
}

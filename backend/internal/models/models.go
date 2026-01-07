package models

import "time"

// SearchCache represents a cached search result
type SearchCache struct {
	ID          int64     `json:"id"`
	Keyword     string    `json:"keyword"`
	ResultsJSON string    `json:"results_json"`
	CachedAt    time.Time `json:"cached_at"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// Favorite represents a user's favorite place
type Favorite struct {
	ID          int64     `json:"id"`
	UserID      string    `json:"user_id"`
	PlaceID     string    `json:"place_id"`
	PlaceName   string    `json:"place_name"`
	Address     string    `json:"address,omitempty"`
	RoadAddress string    `json:"road_address,omitempty"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	Phone       string    `json:"phone,omitempty"`
	Category    string    `json:"category,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// SearchHistory represents a user's search history entry
type SearchHistory struct {
	ID          int64     `json:"id"`
	UserID      string    `json:"user_id"`
	Keyword     string    `json:"keyword"`
	ResultCount int       `json:"result_count"`
	SearchedAt  time.Time `json:"searched_at"`
}

// UserSettings represents user preferences
type UserSettings struct {
	ID        int64     `json:"id"`
	UserID    string    `json:"user_id"`
	HomeLat   *float64  `json:"home_lat,omitempty"`
	HomeLng   *float64  `json:"home_lng,omitempty"`
	HomeName  string    `json:"home_name,omitempty"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Place represents a Kakao place search result
type Place struct {
	ID                string `json:"id"`
	PlaceName         string `json:"place_name"`
	CategoryName      string `json:"category_name"`
	CategoryGroupCode string `json:"category_group_code"`
	CategoryGroupName string `json:"category_group_name"`
	Phone             string `json:"phone"`
	AddressName       string `json:"address_name"`
	RoadAddressName   string `json:"road_address_name"`
	X                 string `json:"x"` // longitude
	Y                 string `json:"y"` // latitude
	PlaceURL          string `json:"place_url"`
	Distance          string `json:"distance"`
}

// PopularKeyword represents a frequently searched keyword
type PopularKeyword struct {
	Keyword string `json:"keyword"`
	Count   int    `json:"count"`
}

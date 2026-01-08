package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/jju-compass/jju-compass-map/internal/models"
	"github.com/jju-compass/jju-compass-map/internal/repository"
)

// FavoriteHandler handles favorite-related requests
type FavoriteHandler struct {
	repo *repository.FavoriteRepository
}

// NewFavoriteHandler creates a new favorite handler
func NewFavoriteHandler(repo *repository.FavoriteRepository) *FavoriteHandler {
	return &FavoriteHandler{repo: repo}
}

// GetFavorites retrieves all favorites for a user
// GET /api/favorites
func (h *FavoriteHandler) GetFavorites(c *gin.Context) {
	userID := GetUserID(c)

	favorites, err := h.repo.GetAll(userID)
	if err != nil {
		InternalError(c, "즐겨찾기 조회 실패")
		return
	}

	if favorites == nil {
		favorites = []models.Favorite{}
	}

	Success(c, gin.H{
		"favorites": favorites,
		"count":     len(favorites),
	})
}

// AddFavorite adds a new favorite
// POST /api/favorites
func (h *FavoriteHandler) AddFavorite(c *gin.Context) {
	userID := GetUserID(c)

	var req struct {
		PlaceID     string  `json:"place_id" binding:"required"`
		PlaceName   string  `json:"place_name" binding:"required"`
		Address     string  `json:"address"`
		RoadAddress string  `json:"road_address"`
		Lat         float64 `json:"lat" binding:"required"`
		Lng         float64 `json:"lng" binding:"required"`
		Phone       string  `json:"phone"`
		Category    string  `json:"category"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid request body")
		return
	}

	// Check if already favorited
	exists, err := h.repo.Exists(userID, req.PlaceID)
	if err != nil {
		InternalError(c, "즐겨찾기 확인 실패")
		return
	}
	if exists {
		BadRequest(c, "이미 즐겨찾기에 추가된 장소입니다")
		return
	}

	favorite := &models.Favorite{
		UserID:      userID,
		PlaceID:     req.PlaceID,
		PlaceName:   req.PlaceName,
		Address:     req.Address,
		RoadAddress: req.RoadAddress,
		Lat:         req.Lat,
		Lng:         req.Lng,
		Phone:       req.Phone,
		Category:    req.Category,
	}

	if err := h.repo.Add(favorite); err != nil {
		InternalError(c, "즐겨찾기 추가 실패")
		return
	}

	Created(c, favorite)
}

// DeleteFavorite removes a favorite
// DELETE /api/favorites?place_id=xxx
func (h *FavoriteHandler) DeleteFavorite(c *gin.Context) {
	userID := GetUserID(c)
	placeID := c.Query("place_id")

	if placeID == "" {
		BadRequest(c, "place_id is required")
		return
	}

	if err := h.repo.Delete(userID, placeID); err != nil {
		InternalError(c, "즐겨찾기 삭제 실패")
		return
	}

	SuccessMessage(c, "즐겨찾기가 삭제되었습니다")
}

// CheckFavorite checks if a place is favorited
// GET /api/favorites/check?place_id=xxx
func (h *FavoriteHandler) CheckFavorite(c *gin.Context) {
	userID := GetUserID(c)
	placeID := c.Query("place_id")

	if placeID == "" {
		BadRequest(c, "place_id is required")
		return
	}

	exists, err := h.repo.Exists(userID, placeID)
	if err != nil {
		InternalError(c, "즐겨찾기 확인 실패")
		return
	}

	Success(c, gin.H{
		"place_id":    placeID,
		"is_favorite": exists,
	})
}

// ToggleFavorite toggles favorite status
// POST /api/favorites/check
func (h *FavoriteHandler) ToggleFavorite(c *gin.Context) {
	userID := GetUserID(c)

	var req struct {
		PlaceID     string  `json:"place_id" binding:"required"`
		PlaceName   string  `json:"place_name"`
		Address     string  `json:"address"`
		RoadAddress string  `json:"road_address"`
		Lat         float64 `json:"lat"`
		Lng         float64 `json:"lng"`
		Phone       string  `json:"phone"`
		Category    string  `json:"category"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid request body")
		return
	}

	exists, err := h.repo.Exists(userID, req.PlaceID)
	if err != nil {
		InternalError(c, "즐겨찾기 확인 실패")
		return
	}

	if exists {
		// Remove from favorites
		if err := h.repo.Delete(userID, req.PlaceID); err != nil {
			InternalError(c, "즐겨찾기 삭제 실패")
			return
		}
		Success(c, gin.H{
			"place_id":    req.PlaceID,
			"is_favorite": false,
			"action":      "removed",
		})
	} else {
		// Add to favorites
		favorite := &models.Favorite{
			UserID:      userID,
			PlaceID:     req.PlaceID,
			PlaceName:   req.PlaceName,
			Address:     req.Address,
			RoadAddress: req.RoadAddress,
			Lat:         req.Lat,
			Lng:         req.Lng,
			Phone:       req.Phone,
			Category:    req.Category,
		}
		if err := h.repo.Add(favorite); err != nil {
			InternalError(c, "즐겨찾기 추가 실패")
			return
		}
		Success(c, gin.H{
			"place_id":    req.PlaceID,
			"is_favorite": true,
			"action":      "added",
		})
	}
}

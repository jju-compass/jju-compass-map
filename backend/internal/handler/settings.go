package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/jju-compass/jju-compass-map/internal/repository"
)

// SettingsHandler handles user settings requests
type SettingsHandler struct {
	repo *repository.SettingsRepository
}

// NewSettingsHandler creates a new settings handler
func NewSettingsHandler(repo *repository.SettingsRepository) *SettingsHandler {
	return &SettingsHandler{repo: repo}
}

// GetHome retrieves home location for a user
// GET /api/settings/home
func (h *SettingsHandler) GetHome(c *gin.Context) {
	userID := GetUserID(c)

	settings, err := h.repo.GetHome(userID)
	if err != nil {
		InternalError(c, "홈 위치 조회 실패")
		return
	}

	if settings == nil || settings.HomeLat == nil || settings.HomeLng == nil {
		Success(c, gin.H{
			"has_home": false,
		})
		return
	}

	Success(c, gin.H{
		"has_home":  true,
		"home_lat":  *settings.HomeLat,
		"home_lng":  *settings.HomeLng,
		"home_name": settings.HomeName,
	})
}

// SetHome saves home location for a user
// POST /api/settings/home
func (h *SettingsHandler) SetHome(c *gin.Context) {
	userID := GetUserID(c)

	var req struct {
		Lat  float64 `json:"lat" binding:"required"`
		Lng  float64 `json:"lng" binding:"required"`
		Name string  `json:"name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid request body")
		return
	}

	// Validate coordinates (roughly Korean peninsula area)
	if req.Lat < 33 || req.Lat > 43 || req.Lng < 124 || req.Lng > 132 {
		BadRequest(c, "유효하지 않은 좌표입니다")
		return
	}

	if err := h.repo.SetHome(userID, req.Lat, req.Lng, req.Name); err != nil {
		InternalError(c, "홈 위치 저장 실패")
		return
	}

	Success(c, gin.H{
		"message":   "홈 위치가 저장되었습니다",
		"home_lat":  req.Lat,
		"home_lng":  req.Lng,
		"home_name": req.Name,
	})
}

// DeleteHome removes home location for a user
// DELETE /api/settings/home
func (h *SettingsHandler) DeleteHome(c *gin.Context) {
	userID := GetUserID(c)

	if err := h.repo.DeleteHome(userID); err != nil {
		InternalError(c, "홈 위치 삭제 실패")
		return
	}

	SuccessMessage(c, "홈 위치가 삭제되었습니다")
}

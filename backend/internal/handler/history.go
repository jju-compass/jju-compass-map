package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/jju-compass/jju-compass-map/internal/models"
	"github.com/jju-compass/jju-compass-map/internal/repository"
)

// HistoryHandler handles search history requests
type HistoryHandler struct {
	repo *repository.HistoryRepository
}

// NewHistoryHandler creates a new history handler
func NewHistoryHandler(repo *repository.HistoryRepository) *HistoryHandler {
	return &HistoryHandler{repo: repo}
}

// GetHistory retrieves recent search history
// GET /api/history?limit=20
func (h *HistoryHandler) GetHistory(c *gin.Context) {
	userID := GetUserID(c)

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	history, err := h.repo.GetRecent(userID, limit)
	if err != nil {
		InternalError(c, "검색 기록 조회 실패")
		return
	}

	if history == nil {
		history = []models.SearchHistory{}
	}

	Success(c, gin.H{
		"history": history,
		"count":   len(history),
	})
}

// GetPopular retrieves popular search keywords
// GET /api/history/popular?limit=10
func (h *HistoryHandler) GetPopular(c *gin.Context) {
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	popular, err := h.repo.GetPopular(limit)
	if err != nil {
		InternalError(c, "인기 검색어 조회 실패")
		return
	}

	if popular == nil {
		popular = []models.PopularKeyword{}
	}

	Success(c, gin.H{
		"keywords": popular,
		"count":    len(popular),
	})
}

// DeleteHistory clears search history for a user
// DELETE /api/history
func (h *HistoryHandler) DeleteHistory(c *gin.Context) {
	userID := GetUserID(c)

	if err := h.repo.DeleteAll(userID); err != nil {
		InternalError(c, "검색 기록 삭제 실패")
		return
	}

	SuccessMessage(c, "검색 기록이 삭제되었습니다")
}

// AddHistory adds a search to history (internal use)
func (h *HistoryHandler) AddHistory(userID, keyword string, resultCount int) error {
	return h.repo.Add(userID, keyword, resultCount)
}

// parseInt helper function
func parseInt(s string) (int, error) {
	var n int
	_, err := parseIntHelper(s, &n)
	return n, err
}

func parseIntHelper(s string, n *int) (int, error) {
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, &parseError{s}
		}
		*n = *n*10 + int(c-'0')
	}
	return *n, nil
}

type parseError struct {
	s string
}

func (e *parseError) Error() string {
	return "invalid number: " + e.s
}

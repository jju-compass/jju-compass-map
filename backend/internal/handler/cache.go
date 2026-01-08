package handler

import (
	"encoding/json"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jju-compass/jju-compass-map/internal/models"
	"github.com/jju-compass/jju-compass-map/internal/repository"
)

// CacheHandler handles cache-related requests
type CacheHandler struct {
	repo        *repository.CacheRepository
	historyRepo *repository.HistoryRepository
}

// NewCacheHandler creates a new cache handler
func NewCacheHandler(repo *repository.CacheRepository, historyRepo *repository.HistoryRepository) *CacheHandler {
	return &CacheHandler{repo: repo, historyRepo: historyRepo}
}

// GetSearchCache retrieves cached search results
// GET /api/cache/search?keyword=xxx
func (h *CacheHandler) GetSearchCache(c *gin.Context) {
	keyword := c.Query("keyword")
	if keyword == "" {
		BadRequest(c, "keyword is required")
		return
	}

	cache, err := h.repo.Get(keyword)
	if err != nil {
		InternalError(c, "캐시 조회 실패")
		return
	}

	if cache == nil {
		Success(c, gin.H{
			"cached":  false,
			"keyword": keyword,
		})
		return
	}

	// Parse cached results
	var results []models.Place
	if err := json.Unmarshal([]byte(cache.ResultsJSON), &results); err != nil {
		InternalError(c, "캐시 데이터 파싱 실패")
		return
	}

	Success(c, gin.H{
		"cached":    true,
		"keyword":   keyword,
		"results":   results,
		"cached_at": cache.CachedAt,
	})
}

// SetSearchCache stores search results in cache
// POST /api/cache/search
func (h *CacheHandler) SetSearchCache(c *gin.Context) {
	var req struct {
		Keyword string         `json:"keyword" binding:"required"`
		Results []models.Place `json:"results" binding:"required"`
		TTL     int            `json:"ttl"` // TTL in minutes, default 30
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid request body")
		return
	}

	ttl := time.Duration(req.TTL) * time.Minute
	if ttl == 0 {
		ttl = 30 * time.Minute // default 30 minutes
	}

	if err := h.repo.Set(req.Keyword, req.Results, ttl); err != nil {
		InternalError(c, "캐시 저장 실패")
		return
	}

	// 검색 히스토리에도 자동 추가
	if h.historyRepo != nil {
		userID := GetUserID(c)
		_ = h.historyRepo.Add(userID, req.Keyword, len(req.Results))
	}

	SuccessMessage(c, "캐시가 저장되었습니다")
}

// GetCacheStats returns cache statistics
// GET /api/cache/stats
func (h *CacheHandler) GetCacheStats(c *gin.Context) {
	total, valid, err := h.repo.GetStats()
	if err != nil {
		InternalError(c, "통계 조회 실패")
		return
	}

	Success(c, gin.H{
		"total_entries": total,
		"valid_entries": valid,
		"expired":       total - valid,
	})
}

// DeleteCache deletes cache entries
// DELETE /api/cache
func (h *CacheHandler) DeleteCache(c *gin.Context) {
	keyword := c.Query("keyword")

	if keyword != "" {
		// Delete specific keyword
		if err := h.repo.Delete(keyword); err != nil {
			InternalError(c, "캐시 삭제 실패")
			return
		}
		SuccessMessage(c, "캐시가 삭제되었습니다")
		return
	}

	// Delete all expired entries
	deleted, err := h.repo.DeleteExpired()
	if err != nil {
		InternalError(c, "만료된 캐시 삭제 실패")
		return
	}

	Success(c, gin.H{
		"deleted": deleted,
		"message": "만료된 캐시가 삭제되었습니다",
	})
}

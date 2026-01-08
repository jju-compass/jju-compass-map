package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jju-compass/jju-compass-map/internal/config"
	"github.com/jju-compass/jju-compass-map/internal/middleware"
)

// DirectionsHandler handles directions API requests
type DirectionsHandler struct {
	cfg        *config.KakaoConfig
	apiLimiter *middleware.DailyAPILimiter
	httpClient *http.Client
}

// NewDirectionsHandler creates a new directions handler
func NewDirectionsHandler(cfg *config.KakaoConfig, apiLimiter *middleware.DailyAPILimiter) *DirectionsHandler {
	return &DirectionsHandler{
		cfg:        cfg,
		apiLimiter: apiLimiter,
		httpClient: &http.Client{},
	}
}

// coordinate validation regex
var coordRegex = regexp.MustCompile(`^-?\d+(\.\d+)?$`)

// GetDirections proxies directions request to Kakao API
// GET /api/directions?origin=lng,lat&destination=lng,lat
func (h *DirectionsHandler) GetDirections(c *gin.Context) {
	origin := c.Query("origin")
	destination := c.Query("destination")

	if origin == "" || destination == "" {
		BadRequest(c, "origin and destination are required")
		return
	}

	// Validate coordinates format
	if !h.validateCoords(origin) || !h.validateCoords(destination) {
		BadRequest(c, "invalid coordinate format")
		return
	}

	// Check daily API limit
	if !h.apiLimiter.Allow() {
		Error(c, http.StatusTooManyRequests, "일일 API 호출 한도를 초과했습니다")
		return
	}

	// Check API key
	if h.cfg.APIKey == "" {
		InternalError(c, "Kakao API key not configured")
		return
	}

	// Build Kakao API URL
	url := fmt.Sprintf(
		"https://apis-navi.kakaomobility.com/v1/directions?origin=%s&destination=%s&priority=RECOMMEND",
		origin, destination,
	)

	// Create request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		InternalError(c, "요청 생성 실패")
		return
	}

	req.Header.Set("Authorization", "KakaoAK "+h.cfg.APIKey)
	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := h.httpClient.Do(req)
	if err != nil {
		InternalError(c, "Kakao API 요청 실패")
		return
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		InternalError(c, "응답 읽기 실패")
		return
	}

	// Check response status
	if resp.StatusCode != http.StatusOK {
		Error(c, resp.StatusCode, "Kakao API 오류")
		return
	}

	// Parse and forward response
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		InternalError(c, "응답 파싱 실패")
		return
	}

	Success(c, result)
}

// GetAPIUsage returns current API usage statistics
// GET /api/directions/usage
func (h *DirectionsHandler) GetAPIUsage(c *gin.Context) {
	count, limit := h.apiLimiter.GetUsage()
	Success(c, gin.H{
		"used":      count,
		"limit":     limit,
		"remaining": limit - count,
	})
}

// validateCoords validates coordinate format (lng,lat)
func (h *DirectionsHandler) validateCoords(coords string) bool {
	// Split by comma
	parts := splitCoords(coords)
	if len(parts) != 2 {
		return false
	}

	// Validate each part
	for _, part := range parts {
		if !coordRegex.MatchString(part) {
			return false
		}
		// Parse and validate range
		val, err := strconv.ParseFloat(part, 64)
		if err != nil {
			return false
		}
		// Basic sanity check for Korean coordinates
		if val < -180 || val > 180 {
			return false
		}
	}

	return true
}

// splitCoords splits coordinate string by comma
func splitCoords(s string) []string {
	var result []string
	var current string
	for _, c := range s {
		if c == ',' {
			result = append(result, current)
			current = ""
		} else {
			current += string(c)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

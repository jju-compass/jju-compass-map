package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter stores request counts per IP
type RateLimiter struct {
	requests map[string]*requestInfo
	mu       sync.RWMutex
	limit    int           // max requests per window
	window   time.Duration // time window
}

type requestInfo struct {
	count     int
	startTime time.Time
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string]*requestInfo),
		limit:    limit,
		window:   window,
	}

	// Start cleanup goroutine
	go rl.cleanup()

	return rl
}

// RateLimit returns a Gin middleware that limits requests per IP
func (rl *RateLimiter) RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		rl.mu.Lock()

		info, exists := rl.requests[ip]
		now := time.Now()

		if !exists || now.Sub(info.startTime) > rl.window {
			// New window
			rl.requests[ip] = &requestInfo{
				count:     1,
				startTime: now,
			}
			rl.mu.Unlock()
			c.Next()
			return
		}

		if info.count >= rl.limit {
			rl.mu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "rate limit exceeded",
				"message": "너무 많은 요청입니다. 잠시 후 다시 시도해주세요.",
			})
			c.Abort()
			return
		}

		info.count++
		rl.mu.Unlock()
		c.Next()
	}
}

// cleanup removes expired entries every minute
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, info := range rl.requests {
			if now.Sub(info.startTime) > rl.window {
				delete(rl.requests, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// DailyAPILimiter tracks daily API usage (for Kakao Directions API)
type DailyAPILimiter struct {
	count     int
	limit     int
	resetTime time.Time
	mu        sync.Mutex
}

// NewDailyAPILimiter creates a daily API limiter
func NewDailyAPILimiter(limit int) *DailyAPILimiter {
	return &DailyAPILimiter{
		count:     0,
		limit:     limit,
		resetTime: nextMidnight(),
	}
}

// Allow checks if API call is allowed and increments counter
func (d *DailyAPILimiter) Allow() bool {
	d.mu.Lock()
	defer d.mu.Unlock()

	now := time.Now()
	if now.After(d.resetTime) {
		d.count = 0
		d.resetTime = nextMidnight()
	}

	if d.count >= d.limit {
		return false
	}

	d.count++
	return true
}

// GetUsage returns current count and limit
func (d *DailyAPILimiter) GetUsage() (int, int) {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.count, d.limit
}

// nextMidnight returns the next midnight time
func nextMidnight() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
}

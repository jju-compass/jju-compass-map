package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jju-compass/jju-compass-map/internal/config"
)

// CORS returns a middleware that handles Cross-Origin Resource Sharing
func CORS(cfg *config.CORSConfig) gin.HandlerFunc {
	allowedOriginsMap := make(map[string]bool)
	for _, origin := range cfg.AllowedOrigins {
		allowedOriginsMap[origin] = true
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		if allowedOriginsMap[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400") // 24 hours

		// Handle preflight requests
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

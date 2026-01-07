package handler

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jju-compass/jju-compass-map/internal/config"
	"github.com/jju-compass/jju-compass-map/internal/middleware"
	"github.com/jju-compass/jju-compass-map/internal/repository"
)

// Handlers holds all handler instances
type Handlers struct {
	Cache      *CacheHandler
	Favorite   *FavoriteHandler
	History    *HistoryHandler
	Settings   *SettingsHandler
	Directions *DirectionsHandler
}

// NewHandlers creates all handlers with their dependencies
func NewHandlers(db *sql.DB, cfg *config.Config, apiLimiter *middleware.DailyAPILimiter) *Handlers {
	historyRepo := repository.NewHistoryRepository(db)
	return &Handlers{
		Cache:      NewCacheHandler(repository.NewCacheRepository(db), historyRepo),
		Favorite:   NewFavoriteHandler(repository.NewFavoriteRepository(db)),
		History:    NewHistoryHandler(historyRepo),
		Settings:   NewSettingsHandler(repository.NewSettingsRepository(db)),
		Directions: NewDirectionsHandler(&cfg.Kakao, apiLimiter),
	}
}

// RegisterRoutes registers all API routes
func (h *Handlers) RegisterRoutes(router *gin.Engine) {
	// Health check endpoints
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "JJU Compass Map API Server",
		})
	})

	router.GET("/api", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"version": "2.0.0",
			"message": "JJU Compass Map API",
		})
	})

	// API group
	api := router.Group("/api")
	{
		// Cache routes
		cache := api.Group("/cache")
		{
			cache.GET("/search", h.Cache.GetSearchCache)
			cache.POST("/search", h.Cache.SetSearchCache)
			cache.GET("/stats", h.Cache.GetCacheStats)
			cache.DELETE("", h.Cache.DeleteCache)
		}

		// Favorites routes
		favorites := api.Group("/favorites")
		{
			favorites.GET("", h.Favorite.GetFavorites)
			favorites.POST("", h.Favorite.AddFavorite)
			favorites.DELETE("", h.Favorite.DeleteFavorite)
			favorites.GET("/check", h.Favorite.CheckFavorite)
			favorites.POST("/check", h.Favorite.ToggleFavorite)
		}

		// History routes
		history := api.Group("/history")
		{
			history.GET("", h.History.GetHistory)
			history.GET("/popular", h.History.GetPopular)
			history.DELETE("", h.History.DeleteHistory)
		}

		// Settings routes
		settings := api.Group("/settings")
		{
			settings.GET("/home", h.Settings.GetHome)
			settings.POST("/home", h.Settings.SetHome)
			settings.DELETE("/home", h.Settings.DeleteHome)
		}

		// Directions routes
		api.GET("/directions", h.Directions.GetDirections)
		api.GET("/directions/usage", h.Directions.GetAPIUsage)
	}
}

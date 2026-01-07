package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jju-compass/jju-compass-map/internal/config"
	"github.com/jju-compass/jju-compass-map/internal/database"
	"github.com/jju-compass/jju-compass-map/internal/handler"
	"github.com/jju-compass/jju-compass-map/internal/middleware"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.Database.Path); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Initialize database schema
	if err := database.InitSchema(); err != nil {
		log.Fatalf("Failed to initialize database schema: %v", err)
	}

	// Set Gin mode
	gin.SetMode(cfg.Server.Mode)

	// Create router
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Apply middlewares
	router.Use(middleware.CORS(&cfg.CORS))
	rateLimiter := middleware.NewRateLimiter(100, time.Minute) // 100 requests per minute
	router.Use(rateLimiter.RateLimit())

	// Create daily API limiter for Kakao Directions
	apiLimiter := middleware.NewDailyAPILimiter(cfg.Kakao.DailyAPILimit)

	// Create handlers and register routes
	handlers := handler.NewHandlers(database.DB, cfg, apiLimiter)
	handlers.RegisterRoutes(router)

	// Create server with timeouts
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Close database connection
	if err := database.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	}

	// Give outstanding requests 5 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

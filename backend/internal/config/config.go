package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Kakao    KakaoConfig
	CORS     CORSConfig
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port         string
	Mode         string // "debug", "release", "test"
	ReadTimeout  int    // seconds
	WriteTimeout int    // seconds
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	Path string
}

// KakaoConfig holds Kakao API configuration
type KakaoConfig struct {
	APIKey        string
	DailyAPILimit int
}

// CORSConfig holds CORS-related configuration
type CORSConfig struct {
	AllowedOrigins []string
}

// Load reads configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         getEnv("SERVER_PORT", "8080"),
			Mode:         getEnv("GIN_MODE", "debug"),
			ReadTimeout:  getEnvAsInt("SERVER_READ_TIMEOUT", 10),
			WriteTimeout: getEnvAsInt("SERVER_WRITE_TIMEOUT", 10),
		},
		Database: DatabaseConfig{
			Path: getEnv("DB_PATH", "../database/jju_compass.db"),
		},
		Kakao: KakaoConfig{
			APIKey:        getEnv("KAKAO_API_KEY", ""),
			DailyAPILimit: getEnvAsInt("KAKAO_DAILY_LIMIT", 5000),
		},
		CORS: CORSConfig{
			AllowedOrigins: []string{
				"http://localhost:3000",
				"http://localhost:8080",
				"https://jju-map.duckdns.org",
			},
		},
	}
}

// getEnv returns environment variable or default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// getEnvAsInt returns environment variable as int or default value
func getEnvAsInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

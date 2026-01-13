package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response represents a standard API response
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Success returns a successful response with data
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    data,
	})
}

// SuccessMessage returns a successful response with message
func SuccessMessage(c *gin.Context, message string) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: message,
	})
}

// Created returns a 201 created response
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    data,
	})
}

// Error returns an error response with status code
func Error(c *gin.Context, status int, message string) {
	c.JSON(status, Response{
		Success: false,
		Error:   message,
	})
}

// BadRequest returns a 400 error
func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, message)
}

// InternalError returns a 500 error
func InternalError(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, message)
}

// GetUserID extracts user ID from request (cookie or header)
func GetUserID(c *gin.Context) string {
	// Try to get from cookie first
	if userID, err := c.Cookie("user_id"); err == nil && userID != "" {
		return userID
	}

	// Try header
	if userID := c.GetHeader("X-User-ID"); userID != "" {
		return userID
	}

	// Default user for anonymous users
	return "anonymous"
}

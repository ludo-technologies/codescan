package httpapi

import (
	"net/http"
	"strings"
)

// CORSMiddleware handles Cross-Origin Resource Sharing.
type CORSMiddleware struct {
	allowedOrigins map[string]struct{}
}

// NewCORSMiddleware creates a new CORS middleware with allowed origins.
func NewCORSMiddleware(origins []string) *CORSMiddleware {
	allowed := make(map[string]struct{}, len(origins))
	for _, o := range origins {
		allowed[strings.TrimSpace(o)] = struct{}{}
	}
	return &CORSMiddleware{allowedOrigins: allowed}
}

// Handler returns an http.Handler middleware that sets CORS headers.
func (c *CORSMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if _, ok := c.allowedOrigins[origin]; ok {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "3600")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

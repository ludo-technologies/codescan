package httpapi

import (
	"crypto/subtle"
	"net/http"
	"strings"
)

const bearerPrefix = "Bearer "

// BearerAuthMiddleware validates Authorization: Bearer <token> using a
// constant-time comparison against a configured API key.
type BearerAuthMiddleware struct {
	apiKey string
}

// NewBearerAuthMiddleware constructs a middleware bound to the given key.
// The key must be non-empty; callers should validate this at startup.
func NewBearerAuthMiddleware(apiKey string) *BearerAuthMiddleware {
	return &BearerAuthMiddleware{apiKey: apiKey}
}

// Handler returns an http.Handler middleware that rejects requests whose
// Authorization header does not match "Bearer <apiKey>".
func (b *BearerAuthMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if !strings.HasPrefix(auth, bearerPrefix) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		token := strings.TrimPrefix(auth, bearerPrefix)
		if subtle.ConstantTimeCompare([]byte(token), []byte(b.apiKey)) != 1 {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

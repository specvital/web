package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/auth/domain/entity"
	"github.com/specvital/web/src/backend/modules/auth/domain/port"
)

type contextKey string

const claimsKey contextKey = "claims"

func GetClaims(ctx context.Context) *entity.Claims {
	claims, _ := ctx.Value(claimsKey).(*entity.Claims)
	return claims
}

func GetUserID(ctx context.Context) string {
	claims := GetClaims(ctx)
	if claims == nil {
		return ""
	}
	return claims.UserID()
}

func WithClaims(ctx context.Context, claims *entity.Claims) context.Context {
	return context.WithValue(ctx, claimsKey, claims)
}

type AuthMiddleware struct {
	cookieName   string
	tokenManager port.TokenManager
}

func NewAuthMiddleware(tokenManager port.TokenManager, cookieName string) *AuthMiddleware {
	return &AuthMiddleware{
		cookieName:   cookieName,
		tokenManager: tokenManager,
	}
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, err := m.extractClaims(r)
		if err != nil {
			writeUnauthorized(w, "authentication required")
			return
		}

		ctx := WithClaims(r.Context(), claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (m *AuthMiddleware) OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip auth parsing for non-API routes (health, docs, etc.)
		if !isAPIRoute(r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}

		claims, err := m.extractClaims(r)
		if err == nil && claims != nil {
			r = r.WithContext(WithClaims(r.Context(), claims))
		}

		next.ServeHTTP(w, r)
	})
}

// isAPIRoute checks if the path should have authentication parsing.
// Currently uses simple prefix matching. If routing becomes more complex,
// consider using a route matcher or configuration-based approach.
func isAPIRoute(path string) bool {
	return strings.HasPrefix(path, "/api")
}

func (m *AuthMiddleware) extractClaims(r *http.Request) (*entity.Claims, error) {
	cookie, err := r.Cookie(m.cookieName)
	if err != nil {
		return nil, err
	}

	claims, err := m.tokenManager.Validate(cookie.Value)
	if err != nil {
		return nil, err
	}

	return claims, nil
}

func writeUnauthorized(w http.ResponseWriter, detail string) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(api.NewUnauthorized(detail))
}

package middleware

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/jwt"
)

type contextKey string

const claimsKey contextKey = "claims"

func GetClaims(ctx context.Context) *domain.Claims {
	claims, _ := ctx.Value(claimsKey).(*domain.Claims)
	return claims
}

func GetUserID(ctx context.Context) string {
	claims := GetClaims(ctx)
	if claims == nil {
		return ""
	}
	return claims.UserID()
}

func WithClaims(ctx context.Context, claims *domain.Claims) context.Context {
	return context.WithValue(ctx, claimsKey, claims)
}

type AuthMiddleware struct {
	cookieName string
	jwtManager *jwt.Manager
}

func NewAuthMiddleware(jwtManager *jwt.Manager, cookieName string) *AuthMiddleware {
	return &AuthMiddleware{
		cookieName: cookieName,
		jwtManager: jwtManager,
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
		claims, err := m.extractClaims(r)
		if err == nil && claims != nil {
			r = r.WithContext(WithClaims(r.Context(), claims))
		}

		next.ServeHTTP(w, r)
	})
}

func (m *AuthMiddleware) extractClaims(r *http.Request) (*domain.Claims, error) {
	cookie, err := r.Cookie(m.cookieName)
	if err != nil {
		return nil, err
	}

	claims, err := m.jwtManager.Validate(cookie.Value)
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

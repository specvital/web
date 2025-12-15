package jwt

import (
	"time"

	"github.com/cockroachdb/errors"
	"github.com/golang-jwt/jwt/v5"

	"github.com/specvital/web/src/backend/modules/auth/domain"
)

const (
	DefaultExpiry = 7 * 24 * time.Hour // 7 days
	Issuer        = "specvital"
)

type Manager struct {
	secret []byte
	expiry time.Duration
}

func NewManager(secret string) (*Manager, error) {
	if secret == "" {
		return nil, errors.New("jwt secret is required")
	}
	if len(secret) < 32 {
		return nil, errors.New("jwt secret must be at least 32 characters")
	}
	return &Manager{
		secret: []byte(secret),
		expiry: DefaultExpiry,
	}, nil
}

func (m *Manager) Generate(userID, login string) (string, error) {
	if userID == "" {
		return "", errors.New("user ID is required")
	}
	if login == "" {
		return "", errors.New("login is required")
	}

	now := time.Now()
	claims := domain.Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    Issuer,
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.expiry)),
		},
		Login: login,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func (m *Manager) Validate(tokenString string) (*domain.Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &domain.Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.Wrapf(domain.ErrInvalidToken, "unexpected signing method: %v", t.Header["alg"])
		}
		return m.secret, nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, domain.ErrTokenExpired
		}
		return nil, errors.Wrapf(domain.ErrInvalidToken, "token validation failed: %v", err)
	}

	claims, ok := token.Claims.(*domain.Claims)
	if !ok || !token.Valid {
		return nil, domain.ErrInvalidToken
	}

	// Validate issuer to prevent token confusion attacks
	if claims.Issuer != Issuer {
		return nil, errors.Wrapf(domain.ErrInvalidToken, "invalid issuer: expected %s", Issuer)
	}

	return claims, nil
}

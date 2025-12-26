package adapter

import (
	"time"

	"github.com/cockroachdb/errors"
	"github.com/golang-jwt/jwt/v5"

	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/domain/entity"
	"github.com/specvital/web/src/backend/modules/auth/domain/port"
)

const (
	DefaultExpiry = 7 * 24 * time.Hour // 7 days
	Issuer        = "specvital"
)

type JWTTokenManager struct {
	secret []byte
	expiry time.Duration
}

var _ port.TokenManager = (*JWTTokenManager)(nil)

func NewJWTTokenManager(secret string) (*JWTTokenManager, error) {
	if secret == "" {
		return nil, errors.New("jwt secret is required")
	}
	if len(secret) < 32 {
		return nil, errors.New("jwt secret must be at least 32 characters")
	}
	return &JWTTokenManager{
		secret: []byte(secret),
		expiry: DefaultExpiry,
	}, nil
}

func (m *JWTTokenManager) Generate(userID, login string) (string, error) {
	if userID == "" {
		return "", errors.New("user ID is required")
	}
	if login == "" {
		return "", errors.New("login is required")
	}

	now := time.Now()
	claims := jwtClaims{
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

func (m *JWTTokenManager) Validate(tokenString string) (*entity.Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwtClaims{}, func(t *jwt.Token) (interface{}, error) {
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

	claims, ok := token.Claims.(*jwtClaims)
	if !ok || !token.Valid {
		return nil, domain.ErrInvalidToken
	}

	if claims.Issuer != Issuer {
		return nil, errors.Wrapf(domain.ErrInvalidToken, "invalid issuer: expected %s", Issuer)
	}

	if claims.ExpiresAt == nil || claims.IssuedAt == nil {
		return nil, errors.Wrap(domain.ErrInvalidToken, "missing required time claims")
	}

	return &entity.Claims{
		ExpiresAt: claims.ExpiresAt.Time,
		IssuedAt:  claims.IssuedAt.Time,
		Issuer:    claims.Issuer,
		Login:     claims.Login,
		Subject:   claims.Subject,
	}, nil
}

type jwtClaims struct {
	jwt.RegisteredClaims
	Login string `json:"login"`
}

func (c *jwtClaims) UserID() string {
	return c.Subject
}

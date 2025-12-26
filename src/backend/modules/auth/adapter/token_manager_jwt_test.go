package adapter

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/specvital/web/src/backend/modules/auth/domain"
)

const testSecret = "test-secret-key-must-be-at-least-32-chars"

func TestNewJWTTokenManager(t *testing.T) {
	tests := []struct {
		name    string
		secret  string
		wantErr bool
	}{
		{
			name:    "valid secret",
			secret:  testSecret,
			wantErr: false,
		},
		{
			name:    "empty secret",
			secret:  "",
			wantErr: true,
		},
		{
			name:    "short secret",
			secret:  "short",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewJWTTokenManager(tt.secret)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewJWTTokenManager() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestJWTTokenManager_GenerateAndValidate(t *testing.T) {
	m, err := NewJWTTokenManager(testSecret)
	if err != nil {
		t.Fatalf("NewJWTTokenManager() error = %v", err)
	}

	userID := "user-123"
	login := "testuser"

	token, err := m.Generate(userID, login)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if token == "" {
		t.Error("Generate() returned empty token")
	}

	claims, err := m.Validate(token)
	if err != nil {
		t.Fatalf("Validate() error = %v", err)
	}

	if claims.UserID() != userID {
		t.Errorf("claims.UserID() = %v, want %v", claims.UserID(), userID)
	}
	if claims.Login != login {
		t.Errorf("claims.Login = %v, want %v", claims.Login, login)
	}
	if claims.Issuer != Issuer {
		t.Errorf("claims.Issuer = %v, want %v", claims.Issuer, Issuer)
	}
}

func TestJWTTokenManager_GenerateEmptyInputs(t *testing.T) {
	m, _ := NewJWTTokenManager(testSecret)

	tests := []struct {
		name   string
		userID string
		login  string
	}{
		{name: "empty userID", userID: "", login: "testuser"},
		{name: "empty login", userID: "user-123", login: ""},
		{name: "both empty", userID: "", login: ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := m.Generate(tt.userID, tt.login)
			if err == nil {
				t.Errorf("Generate() should return error for %s", tt.name)
			}
		})
	}
}

func TestJWTTokenManager_ValidateInvalidToken(t *testing.T) {
	m, _ := NewJWTTokenManager(testSecret)

	tests := []struct {
		name    string
		token   string
		wantErr error
	}{
		{
			name:    "invalid token format",
			token:   "invalid.token.here",
			wantErr: domain.ErrInvalidToken,
		},
		{
			name:    "empty token",
			token:   "",
			wantErr: domain.ErrInvalidToken,
		},
		{
			name:    "wrong signature",
			token:   generateTokenWithSecret("wrong-secret-key-must-be-32-chars-long"),
			wantErr: domain.ErrInvalidToken,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := m.Validate(tt.token)
			if err == nil {
				t.Error("Validate() expected error, got nil")
			}
		})
	}
}

func TestJWTTokenManager_ValidateExpiredToken(t *testing.T) {
	m, _ := NewJWTTokenManager(testSecret)

	claims := jwtClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    Issuer,
			Subject:   "user-123",
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
		},
		Login: "testuser",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(testSecret))

	_, err := m.Validate(tokenString)
	if err != domain.ErrTokenExpired {
		t.Errorf("Validate() error = %v, want %v", err, domain.ErrTokenExpired)
	}
}

func TestJWTTokenManager_ValidateInvalidIssuer(t *testing.T) {
	m, _ := NewJWTTokenManager(testSecret)

	claims := jwtClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "other-issuer",
			Subject:   "user-123",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
		Login: "testuser",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(testSecret))

	_, err := m.Validate(tokenString)
	if err == nil {
		t.Error("Validate() should reject token with invalid issuer")
	}
}

func generateTokenWithSecret(secret string) string {
	claims := jwtClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    Issuer,
			Subject:   "user-123",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
		Login: "testuser",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(secret))
	return tokenString
}

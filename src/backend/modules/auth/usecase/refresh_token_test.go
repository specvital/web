package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/cockroachdb/errors"

	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/domain/entity"
)

type mockRefreshTokenRepository struct {
	createFunc           func(ctx context.Context, token *entity.RefreshToken) (string, error)
	getByHashFunc        func(ctx context.Context, tokenHash string) (*entity.RefreshToken, error)
	revokeFunc           func(ctx context.Context, id string) error
	revokeFamilyFunc     func(ctx context.Context, familyID string) error
	revokeUserTokensFunc func(ctx context.Context, userID string) error
}

func (m *mockRefreshTokenRepository) Create(ctx context.Context, token *entity.RefreshToken) (string, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, token)
	}
	return "new-token-id", nil
}

func (m *mockRefreshTokenRepository) GetByHash(ctx context.Context, tokenHash string) (*entity.RefreshToken, error) {
	if m.getByHashFunc != nil {
		return m.getByHashFunc(ctx, tokenHash)
	}
	return nil, domain.ErrRefreshTokenNotFound
}

func (m *mockRefreshTokenRepository) Revoke(ctx context.Context, id string) error {
	if m.revokeFunc != nil {
		return m.revokeFunc(ctx, id)
	}
	return nil
}

func (m *mockRefreshTokenRepository) RevokeFamily(ctx context.Context, familyID string) error {
	if m.revokeFamilyFunc != nil {
		return m.revokeFamilyFunc(ctx, familyID)
	}
	return nil
}

func (m *mockRefreshTokenRepository) RevokeUserTokens(ctx context.Context, userID string) error {
	if m.revokeUserTokensFunc != nil {
		return m.revokeUserTokensFunc(ctx, userID)
	}
	return nil
}

func TestRefreshTokenUseCase_Execute(t *testing.T) {
	now := time.Now()
	validToken := &entity.RefreshToken{
		CreatedAt: now.Add(-time.Hour),
		ExpiresAt: now.Add(6 * 24 * time.Hour),
		FamilyID:  "family-123",
		ID:        "token-123",
		TokenHash: "hashed-valid-refresh-token",
		UserID:    "user-123",
	}

	tests := []struct {
		name             string
		input            RefreshTokenInput
		refreshTokenRepo *mockRefreshTokenRepository
		repository       *mockRepository
		tokenManager     *mockTokenManager
		wantErr          error
	}{
		{
			name:  "should refresh token successfully",
			input: RefreshTokenInput{RefreshToken: "valid-refresh-token"},
			refreshTokenRepo: &mockRefreshTokenRepository{
				getByHashFunc: func(_ context.Context, tokenHash string) (*entity.RefreshToken, error) {
					if tokenHash == "hashed-valid-refresh-token" {
						return validToken, nil
					}
					return nil, domain.ErrRefreshTokenNotFound
				},
			},
			repository: &mockRepository{
				getUserByIDFunc: func(_ context.Context, id string) (*entity.User, error) {
					if id == "user-123" {
						return &entity.User{
							ID:       "user-123",
							Username: "testuser",
						}, nil
					}
					return nil, domain.ErrUserNotFound
				},
			},
			tokenManager: &mockTokenManager{
				hashTokenFunc: func(token string) string {
					return "hashed-" + token
				},
			},
			wantErr: nil,
		},
		{
			name:             "should return error for empty token",
			input:            RefreshTokenInput{RefreshToken: ""},
			refreshTokenRepo: &mockRefreshTokenRepository{},
			repository:       &mockRepository{},
			tokenManager:     &mockTokenManager{},
			wantErr:          domain.ErrRefreshTokenNotFound,
		},
		{
			name:  "should return error when token not found",
			input: RefreshTokenInput{RefreshToken: "unknown-token"},
			refreshTokenRepo: &mockRefreshTokenRepository{
				getByHashFunc: func(_ context.Context, _ string) (*entity.RefreshToken, error) {
					return nil, domain.ErrRefreshTokenNotFound
				},
			},
			repository:   &mockRepository{},
			tokenManager: &mockTokenManager{},
			wantErr:      domain.ErrRefreshTokenNotFound,
		},
		{
			name:  "should detect reuse and revoke family",
			input: RefreshTokenInput{RefreshToken: "revoked-token"},
			refreshTokenRepo: &mockRefreshTokenRepository{
				getByHashFunc: func(_ context.Context, _ string) (*entity.RefreshToken, error) {
					revokedAt := now.Add(-time.Hour)
					return &entity.RefreshToken{
						CreatedAt: now.Add(-2 * time.Hour),
						ExpiresAt: now.Add(6 * 24 * time.Hour),
						FamilyID:  "family-123",
						ID:        "revoked-token-id",
						RevokedAt: &revokedAt,
						TokenHash: "hashed-revoked-token",
						UserID:    "user-123",
					}, nil
				},
				revokeFamilyFunc: func(_ context.Context, familyID string) error {
					if familyID != "family-123" {
						t.Errorf("expected familyID family-123, got %s", familyID)
					}
					return nil
				},
			},
			repository:   &mockRepository{},
			tokenManager: &mockTokenManager{},
			wantErr:      domain.ErrTokenReuseDetected,
		},
		{
			name:  "should return error for expired token",
			input: RefreshTokenInput{RefreshToken: "expired-token"},
			refreshTokenRepo: &mockRefreshTokenRepository{
				getByHashFunc: func(_ context.Context, _ string) (*entity.RefreshToken, error) {
					return &entity.RefreshToken{
						CreatedAt: now.Add(-8 * 24 * time.Hour),
						ExpiresAt: now.Add(-24 * time.Hour),
						FamilyID:  "family-123",
						ID:        "expired-token-id",
						TokenHash: "hashed-expired-token",
						UserID:    "user-123",
					}, nil
				},
			},
			repository:   &mockRepository{},
			tokenManager: &mockTokenManager{},
			wantErr:      domain.ErrRefreshTokenExpired,
		},
		{
			name:  "should return error when user not found",
			input: RefreshTokenInput{RefreshToken: "valid-refresh-token"},
			refreshTokenRepo: &mockRefreshTokenRepository{
				getByHashFunc: func(_ context.Context, tokenHash string) (*entity.RefreshToken, error) {
					if tokenHash == "hashed-valid-refresh-token" {
						return validToken, nil
					}
					return nil, domain.ErrRefreshTokenNotFound
				},
			},
			repository: &mockRepository{
				getUserByIDFunc: func(_ context.Context, _ string) (*entity.User, error) {
					return nil, domain.ErrUserNotFound
				},
			},
			tokenManager: &mockTokenManager{
				hashTokenFunc: func(token string) string {
					return "hashed-" + token
				},
			},
			wantErr: domain.ErrUserNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uc := NewRefreshTokenUseCase(tt.refreshTokenRepo, tt.repository, tt.tokenManager)

			output, err := uc.Execute(context.Background(), tt.input)

			if tt.wantErr != nil {
				if err == nil {
					t.Errorf("expected error %v, got nil", tt.wantErr)
					return
				}
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected error %v, got %v", tt.wantErr, err)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if output.AccessToken == "" {
				t.Error("expected access token, got empty")
			}
			if output.RefreshToken == "" {
				t.Error("expected refresh token, got empty")
			}
		})
	}
}

func TestRefreshTokenUseCase_CreateInitialToken(t *testing.T) {
	tests := []struct {
		name             string
		input            CreateRefreshTokenInput
		refreshTokenRepo *mockRefreshTokenRepository
		tokenManager     *mockTokenManager
		wantErr          bool
	}{
		{
			name:  "should create initial token successfully",
			input: CreateRefreshTokenInput{UserID: "user-123"},
			refreshTokenRepo: &mockRefreshTokenRepository{
				createFunc: func(_ context.Context, token *entity.RefreshToken) (string, error) {
					if token.UserID != "user-123" {
						t.Errorf("expected userID user-123, got %s", token.UserID)
					}
					if token.FamilyID == "" {
						t.Error("expected familyID to be generated")
					}
					return "new-token-id", nil
				},
			},
			tokenManager: &mockTokenManager{},
			wantErr:      false,
		},
		{
			name:  "should use provided familyID",
			input: CreateRefreshTokenInput{UserID: "user-123", FamilyID: "custom-family"},
			refreshTokenRepo: &mockRefreshTokenRepository{
				createFunc: func(_ context.Context, token *entity.RefreshToken) (string, error) {
					if token.FamilyID != "custom-family" {
						t.Errorf("expected familyID custom-family, got %s", token.FamilyID)
					}
					return "new-token-id", nil
				},
			},
			tokenManager: &mockTokenManager{},
			wantErr:      false,
		},
		{
			name:             "should return error for empty userID",
			input:            CreateRefreshTokenInput{UserID: ""},
			refreshTokenRepo: &mockRefreshTokenRepository{},
			tokenManager:     &mockTokenManager{},
			wantErr:          true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uc := NewRefreshTokenUseCase(tt.refreshTokenRepo, &mockRepository{}, tt.tokenManager)

			output, err := uc.CreateInitialToken(context.Background(), tt.input)

			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if output.RefreshToken == "" {
				t.Error("expected refresh token, got empty")
			}
		})
	}
}

func TestRefreshTokenUseCase_TokenRotation(t *testing.T) {
	now := time.Now()
	originalToken := &entity.RefreshToken{
		CreatedAt: now.Add(-time.Hour),
		ExpiresAt: now.Add(6 * 24 * time.Hour),
		FamilyID:  "family-123",
		ID:        "original-token-id",
		TokenHash: "hashed-original-token",
		UserID:    "user-123",
	}

	var revokedID string
	var createdToken *entity.RefreshToken

	refreshTokenRepo := &mockRefreshTokenRepository{
		getByHashFunc: func(_ context.Context, _ string) (*entity.RefreshToken, error) {
			return originalToken, nil
		},
		revokeFunc: func(_ context.Context, id string) error {
			revokedID = id
			return nil
		},
		createFunc: func(_ context.Context, token *entity.RefreshToken) (string, error) {
			createdToken = token
			return "new-token-id", nil
		},
	}

	repository := &mockRepository{
		getUserByIDFunc: func(_ context.Context, _ string) (*entity.User, error) {
			return &entity.User{ID: "user-123", Username: "testuser"}, nil
		},
	}

	tokenManager := &mockTokenManager{}

	uc := NewRefreshTokenUseCase(refreshTokenRepo, repository, tokenManager)

	_, err := uc.Execute(context.Background(), RefreshTokenInput{RefreshToken: "original-token"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if revokedID != "original-token-id" {
		t.Errorf("expected original token to be revoked, got %s", revokedID)
	}

	if createdToken == nil {
		t.Fatal("expected new token to be created")
	}

	if createdToken.FamilyID != "family-123" {
		t.Errorf("expected same familyID, got %s", createdToken.FamilyID)
	}

	if createdToken.Replaces == nil || *createdToken.Replaces != "original-token-id" {
		t.Error("expected new token to reference original token")
	}
}

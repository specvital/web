package usecase

import (
	"context"
	"errors"
	"testing"

	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/domain/entity"
	"github.com/specvital/web/src/backend/modules/auth/domain/port"
)

type mockTokenManager struct {
	generateAccessTokenFunc  func(userID, login string) (string, error)
	generateRefreshTokenFunc func() (*port.RefreshTokenResult, error)
	hashTokenFunc            func(token string) string
	validateAccessTokenFunc  func(tokenString string) (*entity.Claims, error)
}

func (m *mockTokenManager) GenerateAccessToken(userID, login string) (string, error) {
	if m.generateAccessTokenFunc != nil {
		return m.generateAccessTokenFunc(userID, login)
	}
	return "mock-access-token", nil
}

func (m *mockTokenManager) GenerateRefreshToken() (*port.RefreshTokenResult, error) {
	if m.generateRefreshTokenFunc != nil {
		return m.generateRefreshTokenFunc()
	}
	return &port.RefreshTokenResult{
		Token:     "mock-refresh-token",
		TokenHash: "mock-token-hash",
	}, nil
}

func (m *mockTokenManager) HashToken(token string) string {
	if m.hashTokenFunc != nil {
		return m.hashTokenFunc(token)
	}
	return "hashed-" + token
}

func (m *mockTokenManager) ValidateAccessToken(tokenString string) (*entity.Claims, error) {
	if m.validateAccessTokenFunc != nil {
		return m.validateAccessTokenFunc(tokenString)
	}
	return nil, nil
}

func TestHandleOAuthCallbackUseCase_Execute(t *testing.T) {
	tests := []struct {
		name            string
		input           HandleOAuthCallbackInput
		setupEncryptor  func() *mockEncryptor
		setupOAuth      func() *mockOAuthClient
		setupRepo       func() *mockRepository
		setupStateStore func() *mockStateStore
		setupToken      func() *mockTokenManager
		wantErr         error
		wantToken       string
	}{
		{
			name: "should handle callback for new user",
			input: HandleOAuthCallbackInput{
				Code:  "valid-code",
				State: "valid-state",
			},
			setupEncryptor: func() *mockEncryptor {
				return &mockEncryptor{
					encryptFunc: func(plaintext string) (string, error) {
						return "encrypted-" + plaintext, nil
					},
				}
			},
			setupOAuth: func() *mockOAuthClient {
				return &mockOAuthClient{
					exchangeCodeFunc: func(_ context.Context, code string) (string, error) {
						if code == "valid-code" {
							return "access-token", nil
						}
						return "", errors.New("invalid code")
					},
					getUserInfoFunc: func(_ context.Context, _ string) (*entity.OAuthUserInfo, error) {
						return &entity.OAuthUserInfo{
							ExternalID: "12345",
							Username:   "testuser",
							AvatarURL:  "https://github.com/avatar",
						}, nil
					},
				}
			},
			setupRepo: func() *mockRepository {
				return &mockRepository{
					getOAuthAccountByProviderFunc: func(_ context.Context, _, _ string) (*entity.OAuthAccount, error) {
						return nil, domain.ErrUserNotFound
					},
					createUserFunc: func(_ context.Context, _ *entity.User) (string, error) {
						return "new-user-id", nil
					},
					upsertOAuthAccountFunc: func(_ context.Context, _ *entity.OAuthAccount) (string, error) {
						return "oauth-id", nil
					},
					updateLastLoginFunc: func(_ context.Context, _ string) error {
						return nil
					},
				}
			},
			setupStateStore: func() *mockStateStore {
				return &mockStateStore{
					validateFunc: func(_ context.Context, state string) error {
						if state == "valid-state" {
							return nil
						}
						return domain.ErrInvalidState
					},
				}
			},
			setupToken: func() *mockTokenManager {
				return &mockTokenManager{
					generateAccessTokenFunc: func(userID, login string) (string, error) {
						return "jwt-token-" + userID, nil
					},
				}
			},
			wantErr:   nil,
			wantToken: "jwt-token-new-user-id",
		},
		{
			name: "should handle callback for existing user",
			input: HandleOAuthCallbackInput{
				Code:  "valid-code",
				State: "valid-state",
			},
			setupEncryptor: func() *mockEncryptor {
				return &mockEncryptor{
					encryptFunc: func(plaintext string) (string, error) {
						return "encrypted-" + plaintext, nil
					},
				}
			},
			setupOAuth: func() *mockOAuthClient {
				return &mockOAuthClient{
					exchangeCodeFunc: func(_ context.Context, _ string) (string, error) {
						return "access-token", nil
					},
					getUserInfoFunc: func(_ context.Context, _ string) (*entity.OAuthUserInfo, error) {
						return &entity.OAuthUserInfo{
							ExternalID: "12345",
							Username:   "existinguser",
							AvatarURL:  "https://github.com/avatar",
						}, nil
					},
				}
			},
			setupRepo: func() *mockRepository {
				token := "old-token"
				return &mockRepository{
					getOAuthAccountByProviderFunc: func(_ context.Context, _, _ string) (*entity.OAuthAccount, error) {
						return &entity.OAuthAccount{
							ID:          "oauth-id",
							UserID:      "existing-user-id",
							AccessToken: &token,
						}, nil
					},
					getUserByIDFunc: func(_ context.Context, id string) (*entity.User, error) {
						if id == "existing-user-id" {
							return &entity.User{
								ID:       "existing-user-id",
								Username: "existinguser",
							}, nil
						}
						return nil, domain.ErrUserNotFound
					},
					upsertOAuthAccountFunc: func(_ context.Context, _ *entity.OAuthAccount) (string, error) {
						return "oauth-id", nil
					},
					updateLastLoginFunc: func(_ context.Context, _ string) error {
						return nil
					},
				}
			},
			setupStateStore: func() *mockStateStore {
				return &mockStateStore{
					validateFunc: func(_ context.Context, _ string) error {
						return nil
					},
				}
			},
			setupToken: func() *mockTokenManager {
				return &mockTokenManager{
					generateAccessTokenFunc: func(userID, _ string) (string, error) {
						return "jwt-token-" + userID, nil
					},
				}
			},
			wantErr:   nil,
			wantToken: "jwt-token-existing-user-id",
		},
		{
			name: "should return error for invalid state",
			input: HandleOAuthCallbackInput{
				Code:  "valid-code",
				State: "invalid-state",
			},
			setupEncryptor: func() *mockEncryptor {
				return &mockEncryptor{}
			},
			setupOAuth: func() *mockOAuthClient {
				return &mockOAuthClient{}
			},
			setupRepo: func() *mockRepository {
				return &mockRepository{}
			},
			setupStateStore: func() *mockStateStore {
				return &mockStateStore{
					validateFunc: func(_ context.Context, _ string) error {
						return domain.ErrInvalidState
					},
				}
			},
			setupToken: func() *mockTokenManager {
				return &mockTokenManager{}
			},
			wantErr:   domain.ErrInvalidState,
			wantToken: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			enc := tt.setupEncryptor()
			oauth := tt.setupOAuth()
			repo := tt.setupRepo()
			stateStore := tt.setupStateStore()
			tokenMgr := tt.setupToken()

			uc := NewHandleOAuthCallbackUseCase(enc, oauth, repo, stateStore, tokenMgr)

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

			if output.Token != tt.wantToken {
				t.Errorf("expected token %q, got %q", tt.wantToken, output.Token)
			}

			if output.User == nil {
				t.Error("expected user, got nil")
			}
		})
	}
}

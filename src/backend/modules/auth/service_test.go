package auth

import (
	"context"
	"testing"
	"time"

	"github.com/specvital/web/src/backend/common/crypto"
	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/github"
	"github.com/specvital/web/src/backend/modules/auth/jwt"
)

type mockRepository struct {
	users         map[string]*domain.User
	oauthAccounts map[string]*domain.OAuthAccount
}

func newMockRepository() *mockRepository {
	return &mockRepository{
		users:         make(map[string]*domain.User),
		oauthAccounts: make(map[string]*domain.OAuthAccount),
	}
}

func (m *mockRepository) CreateUser(_ context.Context, user *domain.User) (string, error) {
	id := "user-" + user.Username
	user.ID = id
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	m.users[id] = user
	return id, nil
}

func (m *mockRepository) GetOAuthAccountByProvider(_ context.Context, provider, providerUserID string) (*domain.OAuthAccount, error) {
	key := provider + ":" + providerUserID
	if account, ok := m.oauthAccounts[key]; ok {
		return account, nil
	}
	return nil, domain.ErrUserNotFound
}

func (m *mockRepository) GetOAuthAccountByUserID(_ context.Context, userID, provider string) (*domain.OAuthAccount, error) {
	for _, account := range m.oauthAccounts {
		if account.UserID == userID && account.Provider == provider {
			return account, nil
		}
	}
	return nil, domain.ErrUserNotFound
}

func (m *mockRepository) GetUserByID(_ context.Context, id string) (*domain.User, error) {
	if user, ok := m.users[id]; ok {
		return user, nil
	}
	return nil, domain.ErrUserNotFound
}

func (m *mockRepository) UpdateLastLogin(_ context.Context, userID string) error {
	if user, ok := m.users[userID]; ok {
		now := time.Now()
		user.LastLoginAt = &now
		user.UpdatedAt = now
		return nil
	}
	return domain.ErrUserNotFound
}

func (m *mockRepository) UpsertOAuthAccount(_ context.Context, account *domain.OAuthAccount) (string, error) {
	key := account.Provider + ":" + account.ProviderUserID
	if account.ID == "" {
		account.ID = "oauth-" + account.ProviderUserID
	}
	account.CreatedAt = time.Now()
	account.UpdatedAt = time.Now()
	m.oauthAccounts[key] = account
	return account.ID, nil
}

type mockGitHubClient struct {
	authURL     string
	exchangeErr error
	getUserErr  error
	token       string
	user        *github.GitHubUser
}

func (m *mockGitHubClient) ExchangeCode(_ context.Context, code string) (string, error) {
	if m.exchangeErr != nil {
		return "", m.exchangeErr
	}
	if code == "" {
		return "", github.ErrInvalidCode
	}
	return m.token, nil
}

func (m *mockGitHubClient) GenerateAuthURL(state string) (string, error) {
	return m.authURL + "?state=" + state, nil
}

func (m *mockGitHubClient) GetUserInfo(_ context.Context, _ string) (*github.GitHubUser, error) {
	if m.getUserErr != nil {
		return nil, m.getUserErr
	}
	return m.user, nil
}

type mockStateStore struct {
	states    map[string]bool
	shouldErr error
}

func newMockStateStore() *mockStateStore {
	return &mockStateStore{
		states: make(map[string]bool),
	}
}

func (m *mockStateStore) Create(_ context.Context) (string, error) {
	if m.shouldErr != nil {
		return "", m.shouldErr
	}
	state := "test-state"
	m.states[state] = true
	return state, nil
}

func (m *mockStateStore) Validate(_ context.Context, state string) error {
	if m.shouldErr != nil {
		return m.shouldErr
	}
	if !m.states[state] {
		return domain.ErrInvalidState
	}
	delete(m.states, state)
	return nil
}

func (m *mockStateStore) Close() error {
	return nil
}

func TestService_InitiateOAuth(t *testing.T) {
	jwtManager, _ := jwt.NewManager("test-secret-key-at-least-32-chars")
	encryptor, _ := crypto.NewEncryptor("test-encryption-key-32-bytes!!!!")
	stateStore := newMockStateStore()
	githubClient := &mockGitHubClient{
		authURL: "https://github.com/login/oauth/authorize",
	}

	svc := NewService(&ServiceConfig{
		Encryptor:    encryptor,
		GitHubClient: githubClient,
		JWTManager:   jwtManager,
		Repository:   newMockRepository(),
		StateStore:   stateStore,
	})

	url, err := svc.InitiateOAuth(context.Background())
	if err != nil {
		t.Fatalf("InitiateOAuth() error = %v", err)
	}

	if url == "" {
		t.Error("InitiateOAuth() returned empty URL")
	}

	expected := "https://github.com/login/oauth/authorize?state=test-state"
	if url != expected {
		t.Errorf("InitiateOAuth() = %v, want %v", url, expected)
	}
}

func TestService_HandleOAuthCallback_NewUser(t *testing.T) {
	jwtManager, _ := jwt.NewManager("test-secret-key-at-least-32-chars")
	encryptor, _ := crypto.NewEncryptor("test-encryption-key-32-bytes!!!!")
	stateStore := newMockStateStore()
	stateStore.states["valid-state"] = true
	repo := newMockRepository()

	email := "test@example.com"
	githubClient := &mockGitHubClient{
		token: "github-access-token",
		user: &github.GitHubUser{
			ID:        12345,
			Login:     "testuser",
			Email:     &email,
			AvatarURL: "https://avatars.githubusercontent.com/u/12345",
		},
	}

	svc := NewService(&ServiceConfig{
		Encryptor:    encryptor,
		GitHubClient: githubClient,
		JWTManager:   jwtManager,
		Repository:   repo,
		StateStore:   stateStore,
	})

	result, err := svc.HandleOAuthCallback(context.Background(), "valid-code", "valid-state")
	if err != nil {
		t.Fatalf("HandleOAuthCallback() error = %v", err)
	}

	if result.Token == "" {
		t.Error("HandleOAuthCallback() returned empty token")
	}

	if result.User == nil {
		t.Fatal("HandleOAuthCallback() returned nil user")
	}

	if result.User.Username != "testuser" {
		t.Errorf("User.Username = %v, want %v", result.User.Username, "testuser")
	}

	if result.User.Email == nil || *result.User.Email != email {
		t.Errorf("User.Email = %v, want %v", result.User.Email, &email)
	}
}

func TestService_HandleOAuthCallback_ExistingUser(t *testing.T) {
	jwtManager, _ := jwt.NewManager("test-secret-key-at-least-32-chars")
	encryptor, _ := crypto.NewEncryptor("test-encryption-key-32-bytes!!!!")
	stateStore := newMockStateStore()
	stateStore.states["valid-state"] = true
	repo := newMockRepository()

	existingUser := &domain.User{
		ID:        "existing-user-id",
		Username:  "existinguser",
		AvatarURL: "https://old-avatar.com",
	}
	repo.users[existingUser.ID] = existingUser

	oldToken := "old-encrypted-token"
	repo.oauthAccounts["github:12345"] = &domain.OAuthAccount{
		ID:             "oauth-12345",
		UserID:         existingUser.ID,
		Provider:       domain.ProviderGitHub,
		ProviderUserID: "12345",
		AccessToken:    &oldToken,
	}

	githubClient := &mockGitHubClient{
		token: "new-github-access-token",
		user: &github.GitHubUser{
			ID:        12345,
			Login:     "existinguser",
			AvatarURL: "https://new-avatar.com",
		},
	}

	svc := NewService(&ServiceConfig{
		Encryptor:    encryptor,
		GitHubClient: githubClient,
		JWTManager:   jwtManager,
		Repository:   repo,
		StateStore:   stateStore,
	})

	result, err := svc.HandleOAuthCallback(context.Background(), "valid-code", "valid-state")
	if err != nil {
		t.Fatalf("HandleOAuthCallback() error = %v", err)
	}

	if result.User.ID != existingUser.ID {
		t.Errorf("User.ID = %v, want %v", result.User.ID, existingUser.ID)
	}

	account := repo.oauthAccounts["github:12345"]
	if account.AccessToken == nil || *account.AccessToken == oldToken {
		t.Error("OAuth account token was not updated")
	}
}

func TestService_HandleOAuthCallback_InvalidState(t *testing.T) {
	jwtManager, _ := jwt.NewManager("test-secret-key-at-least-32-chars")
	encryptor, _ := crypto.NewEncryptor("test-encryption-key-32-bytes!!!!")
	stateStore := newMockStateStore()
	repo := newMockRepository()

	svc := NewService(&ServiceConfig{
		Encryptor:    encryptor,
		GitHubClient: &mockGitHubClient{},
		JWTManager:   jwtManager,
		Repository:   repo,
		StateStore:   stateStore,
	})

	_, err := svc.HandleOAuthCallback(context.Background(), "code", "invalid-state")
	if err != domain.ErrInvalidState {
		t.Errorf("HandleOAuthCallback() error = %v, want %v", err, domain.ErrInvalidState)
	}
}

func TestService_HandleOAuthCallback_InvalidCode(t *testing.T) {
	jwtManager, _ := jwt.NewManager("test-secret-key-at-least-32-chars")
	encryptor, _ := crypto.NewEncryptor("test-encryption-key-32-bytes!!!!")
	stateStore := newMockStateStore()
	stateStore.states["valid-state"] = true

	githubClient := &mockGitHubClient{
		exchangeErr: github.ErrInvalidCode,
	}

	svc := NewService(&ServiceConfig{
		Encryptor:    encryptor,
		GitHubClient: githubClient,
		JWTManager:   jwtManager,
		Repository:   newMockRepository(),
		StateStore:   stateStore,
	})

	_, err := svc.HandleOAuthCallback(context.Background(), "invalid-code", "valid-state")
	if err != domain.ErrInvalidOAuthCode {
		t.Errorf("HandleOAuthCallback() error = %v, want %v", err, domain.ErrInvalidOAuthCode)
	}
}

func TestService_GetCurrentUser(t *testing.T) {
	jwtManager, _ := jwt.NewManager("test-secret-key-at-least-32-chars")
	encryptor, _ := crypto.NewEncryptor("test-encryption-key-32-bytes!!!!")
	repo := newMockRepository()

	user := &domain.User{
		ID:        "user-123",
		Username:  "testuser",
		AvatarURL: "https://avatar.com",
	}
	repo.users[user.ID] = user

	svc := NewService(&ServiceConfig{
		Encryptor:    encryptor,
		GitHubClient: &mockGitHubClient{},
		JWTManager:   jwtManager,
		Repository:   repo,
		StateStore:   newMockStateStore(),
	})

	result, err := svc.GetCurrentUser(context.Background(), "user-123")
	if err != nil {
		t.Fatalf("GetCurrentUser() error = %v", err)
	}

	if result.Username != "testuser" {
		t.Errorf("GetCurrentUser().Username = %v, want %v", result.Username, "testuser")
	}
}

func TestService_GetCurrentUser_NotFound(t *testing.T) {
	jwtManager, _ := jwt.NewManager("test-secret-key-at-least-32-chars")
	encryptor, _ := crypto.NewEncryptor("test-encryption-key-32-bytes!!!!")

	svc := NewService(&ServiceConfig{
		Encryptor:    encryptor,
		GitHubClient: &mockGitHubClient{},
		JWTManager:   jwtManager,
		Repository:   newMockRepository(),
		StateStore:   newMockStateStore(),
	})

	_, err := svc.GetCurrentUser(context.Background(), "nonexistent")
	if err != domain.ErrUserNotFound {
		t.Errorf("GetCurrentUser() error = %v, want %v", err, domain.ErrUserNotFound)
	}
}

func TestService_GetUserGitHubToken(t *testing.T) {
	jwtManager, _ := jwt.NewManager("test-secret-key-at-least-32-chars")
	encryptor, _ := crypto.NewEncryptor("test-encryption-key-32-bytes!!!!")
	repo := newMockRepository()

	encryptedToken, _ := encryptor.Encrypt("github-token")
	repo.oauthAccounts["github:12345"] = &domain.OAuthAccount{
		ID:             "oauth-12345",
		UserID:         "user-123",
		Provider:       domain.ProviderGitHub,
		ProviderUserID: "12345",
		AccessToken:    &encryptedToken,
	}

	svc := NewService(&ServiceConfig{
		Encryptor:    encryptor,
		GitHubClient: &mockGitHubClient{},
		JWTManager:   jwtManager,
		Repository:   repo,
		StateStore:   newMockStateStore(),
	})

	token, err := svc.GetUserGitHubToken(context.Background(), "user-123")
	if err != nil {
		t.Fatalf("GetUserGitHubToken() error = %v", err)
	}

	if token != "github-token" {
		t.Errorf("GetUserGitHubToken() = %v, want %v", token, "github-token")
	}
}

func TestService_GetUserGitHubToken_NotFound(t *testing.T) {
	jwtManager, _ := jwt.NewManager("test-secret-key-at-least-32-chars")
	encryptor, _ := crypto.NewEncryptor("test-encryption-key-32-bytes!!!!")

	svc := NewService(&ServiceConfig{
		Encryptor:    encryptor,
		GitHubClient: &mockGitHubClient{},
		JWTManager:   jwtManager,
		Repository:   newMockRepository(),
		StateStore:   newMockStateStore(),
	})

	_, err := svc.GetUserGitHubToken(context.Background(), "nonexistent")
	if err != domain.ErrUserNotFound {
		t.Errorf("GetUserGitHubToken() error = %v, want %v", err, domain.ErrUserNotFound)
	}
}

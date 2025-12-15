package mapper

import (
	"testing"

	pkgerrors "github.com/cockroachdb/errors"

	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/github"
)

func TestGitHubUserToNewUser(t *testing.T) {
	email := "test@example.com"
	ghUser := &github.GitHubUser{
		AvatarURL: "https://avatars.githubusercontent.com/u/12345",
		Email:     &email,
		ID:        12345,
		Login:     "testuser",
	}

	user, err := GitHubUserToNewUser(ghUser)
	if err != nil {
		t.Fatalf("GitHubUserToNewUser() error = %v", err)
	}

	if user.ID == "" {
		t.Error("User ID should be generated")
	}
	if user.Username != "testuser" {
		t.Errorf("Username = %v, want testuser", user.Username)
	}
	if user.AvatarURL != ghUser.AvatarURL {
		t.Errorf("AvatarURL = %v, want %v", user.AvatarURL, ghUser.AvatarURL)
	}
	if user.Email == nil || *user.Email != email {
		t.Errorf("Email = %v, want %v", user.Email, email)
	}
	if user.CreatedAt.IsZero() {
		t.Error("CreatedAt should be set")
	}
	if user.UpdatedAt.IsZero() {
		t.Error("UpdatedAt should be set")
	}
}

func TestGitHubUserToNewUser_NilEmail(t *testing.T) {
	ghUser := &github.GitHubUser{
		AvatarURL: "https://avatars.githubusercontent.com/u/12345",
		Email:     nil,
		ID:        12345,
		Login:     "testuser",
	}

	user, err := GitHubUserToNewUser(ghUser)
	if err != nil {
		t.Fatalf("GitHubUserToNewUser() error = %v", err)
	}

	if user.Email != nil {
		t.Errorf("Email should be nil, got %v", *user.Email)
	}
}

func TestGitHubUserToNewUser_InvalidInput(t *testing.T) {
	tests := []struct {
		name    string
		ghUser  *github.GitHubUser
		wantErr error
	}{
		{
			name:    "nil user",
			ghUser:  nil,
			wantErr: ErrNilGitHubUser,
		},
		{
			name: "empty login",
			ghUser: &github.GitHubUser{
				ID:    12345,
				Login: "",
			},
			wantErr: ErrEmptyLogin,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := GitHubUserToNewUser(tt.ghUser)
			if !pkgerrors.Is(err, tt.wantErr) {
				t.Errorf("GitHubUserToNewUser() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestGitHubUserToOAuthAccount(t *testing.T) {
	email := "test@example.com"
	ghUser := &github.GitHubUser{
		AvatarURL: "https://avatars.githubusercontent.com/u/12345",
		Email:     &email,
		ID:        12345,
		Login:     "testuser",
	}
	userID := "user-uuid-123"
	accessToken := "encrypted-token"
	scope := "user:email"

	account, err := GitHubUserToOAuthAccount(ghUser, userID, &accessToken, &scope)
	if err != nil {
		t.Fatalf("GitHubUserToOAuthAccount() error = %v", err)
	}

	if account.ID == "" {
		t.Error("Account ID should be generated")
	}
	if account.UserID != userID {
		t.Errorf("UserID = %v, want %v", account.UserID, userID)
	}
	if account.Provider != domain.ProviderGitHub {
		t.Errorf("Provider = %v, want %v", account.Provider, domain.ProviderGitHub)
	}
	if account.ProviderUserID != "12345" {
		t.Errorf("ProviderUserID = %v, want 12345", account.ProviderUserID)
	}
	if account.ProviderUsername == nil || *account.ProviderUsername != "testuser" {
		t.Errorf("ProviderUsername = %v, want testuser", account.ProviderUsername)
	}
	if account.AccessToken == nil || *account.AccessToken != accessToken {
		t.Errorf("AccessToken = %v, want %v", account.AccessToken, accessToken)
	}
	if account.Scope == nil || *account.Scope != scope {
		t.Errorf("Scope = %v, want %v", account.Scope, scope)
	}
}

func TestGitHubUserToOAuthAccount_NilOptionals(t *testing.T) {
	ghUser := &github.GitHubUser{
		AvatarURL: "https://avatars.githubusercontent.com/u/12345",
		Email:     nil,
		ID:        12345,
		Login:     "testuser",
	}
	userID := "user-uuid-123"

	account, err := GitHubUserToOAuthAccount(ghUser, userID, nil, nil)
	if err != nil {
		t.Fatalf("GitHubUserToOAuthAccount() error = %v", err)
	}

	if account.AccessToken != nil {
		t.Errorf("AccessToken should be nil, got %v", *account.AccessToken)
	}
	if account.Scope != nil {
		t.Errorf("Scope should be nil, got %v", *account.Scope)
	}
}

func TestGitHubUserToOAuthAccount_InvalidInput(t *testing.T) {
	validGhUser := &github.GitHubUser{
		ID:    12345,
		Login: "testuser",
	}

	tests := []struct {
		name    string
		ghUser  *github.GitHubUser
		userID  string
		wantErr error
	}{
		{
			name:    "nil user",
			ghUser:  nil,
			userID:  "user-123",
			wantErr: ErrNilGitHubUser,
		},
		{
			name:    "empty userID",
			ghUser:  validGhUser,
			userID:  "",
			wantErr: ErrEmptyUserID,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := GitHubUserToOAuthAccount(tt.ghUser, tt.userID, nil, nil)
			if !pkgerrors.Is(err, tt.wantErr) {
				t.Errorf("GitHubUserToOAuthAccount() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

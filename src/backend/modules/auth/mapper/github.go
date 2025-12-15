package mapper

import (
	"strconv"
	"time"

	"github.com/cockroachdb/errors"
	"github.com/google/uuid"

	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/github"
)

var (
	ErrNilGitHubUser = errors.New("github user cannot be nil")
	ErrEmptyLogin    = errors.New("github login is required")
	ErrEmptyUserID   = errors.New("user ID is required")
)

func GitHubUserToNewUser(ghUser *github.GitHubUser) (*domain.User, error) {
	if ghUser == nil {
		return nil, ErrNilGitHubUser
	}
	if ghUser.Login == "" {
		return nil, ErrEmptyLogin
	}

	now := time.Now()
	return &domain.User{
		AvatarURL: ghUser.AvatarURL,
		CreatedAt: now,
		Email:     ghUser.Email,
		ID:        uuid.New().String(),
		UpdatedAt: now,
		Username:  ghUser.Login,
	}, nil
}

func GitHubUserToOAuthAccount(
	ghUser *github.GitHubUser,
	userID string,
	accessToken *string,
	scope *string,
) (*domain.OAuthAccount, error) {
	if ghUser == nil {
		return nil, ErrNilGitHubUser
	}
	if userID == "" {
		return nil, ErrEmptyUserID
	}

	now := time.Now()
	providerUsername := ghUser.Login

	return &domain.OAuthAccount{
		AccessToken:      accessToken,
		CreatedAt:        now,
		ID:               uuid.New().String(),
		Provider:         domain.ProviderGitHub,
		ProviderUserID:   strconv.FormatInt(ghUser.ID, 10),
		ProviderUsername: &providerUsername,
		Scope:            scope,
		UpdatedAt:        now,
		UserID:           userID,
	}, nil
}

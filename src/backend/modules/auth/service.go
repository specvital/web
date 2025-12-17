package auth

import (
	"context"
	"fmt"
	"strconv"

	"github.com/cockroachdb/errors"

	"github.com/specvital/core/pkg/crypto"
	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/github"
	"github.com/specvital/web/src/backend/modules/auth/jwt"
)

type AuthResult struct {
	Token string
	User  *domain.User
}

type Service interface {
	GetCurrentUser(ctx context.Context, userID string) (*domain.User, error)
	GetUserGitHubToken(ctx context.Context, userID string) (string, error)
	HandleOAuthCallback(ctx context.Context, code, state string) (*AuthResult, error)
	InitiateOAuth(ctx context.Context) (string, error)
}

type serviceImpl struct {
	encryptor    crypto.Encryptor
	githubClient github.Client
	jwtManager   *jwt.Manager
	repo         Repository
	stateStore   StateStore
}

type ServiceConfig struct {
	Encryptor    crypto.Encryptor
	GitHubClient github.Client
	JWTManager   *jwt.Manager
	Repository   Repository
	StateStore   StateStore
}

func NewService(cfg *ServiceConfig) Service {
	return &serviceImpl{
		encryptor:    cfg.Encryptor,
		githubClient: cfg.GitHubClient,
		jwtManager:   cfg.JWTManager,
		repo:         cfg.Repository,
		stateStore:   cfg.StateStore,
	}
}

func (s *serviceImpl) GetCurrentUser(ctx context.Context, userID string) (*domain.User, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, domain.ErrUserNotFound
		}
		return nil, fmt.Errorf("get user: %w", err)
	}
	return user, nil
}

func (s *serviceImpl) GetUserGitHubToken(ctx context.Context, userID string) (string, error) {
	account, err := s.repo.GetOAuthAccountByUserID(ctx, userID, domain.ProviderGitHub)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return "", domain.ErrUserNotFound
		}
		return "", fmt.Errorf("get oauth account: %w", err)
	}

	if account.AccessToken == nil {
		return "", domain.ErrNoGitHubToken
	}

	decrypted, err := s.encryptor.Decrypt(*account.AccessToken)
	if err != nil {
		return "", fmt.Errorf("decrypt token: %w", err)
	}

	return decrypted, nil
}

func (s *serviceImpl) HandleOAuthCallback(ctx context.Context, code, state string) (*AuthResult, error) {
	if err := s.stateStore.Validate(ctx, state); err != nil {
		return nil, domain.ErrInvalidState
	}

	accessToken, err := s.githubClient.ExchangeCode(ctx, code)
	if err != nil {
		if errors.Is(err, github.ErrInvalidCode) {
			return nil, domain.ErrInvalidOAuthCode
		}
		return nil, fmt.Errorf("exchange code: %w", err)
	}

	githubUser, err := s.githubClient.GetUserInfo(ctx, accessToken)
	if err != nil {
		return nil, fmt.Errorf("get github user: %w", err)
	}

	encryptedToken, err := s.encryptor.Encrypt(accessToken)
	if err != nil {
		return nil, fmt.Errorf("encrypt token: %w", err)
	}

	providerUserID := strconv.FormatInt(githubUser.ID, 10)
	user, err := s.findOrCreateUser(ctx, githubUser, providerUserID, encryptedToken)
	if err != nil {
		return nil, fmt.Errorf("find or create user: %w", err)
	}

	if err := s.repo.UpdateLastLogin(ctx, user.ID); err != nil {
		return nil, fmt.Errorf("update last login: %w", err)
	}

	jwtToken, err := s.jwtManager.Generate(user.ID, user.Username)
	if err != nil {
		return nil, fmt.Errorf("generate jwt: %w", err)
	}

	return &AuthResult{
		Token: jwtToken,
		User:  user,
	}, nil
}

func (s *serviceImpl) InitiateOAuth(ctx context.Context) (string, error) {
	state, err := s.stateStore.Create(ctx)
	if err != nil {
		return "", fmt.Errorf("create state: %w", err)
	}

	authURL, err := s.githubClient.GenerateAuthURL(state)
	if err != nil {
		return "", fmt.Errorf("generate auth url: %w", err)
	}

	return authURL, nil
}

func (s *serviceImpl) findOrCreateUser(ctx context.Context, githubUser *github.GitHubUser, providerUserID, encryptedToken string) (*domain.User, error) {
	account, err := s.repo.GetOAuthAccountByProvider(ctx, domain.ProviderGitHub, providerUserID)
	if err == nil {
		if err := s.updateOAuthAccount(ctx, account, githubUser, encryptedToken); err != nil {
			return nil, err
		}
		return s.repo.GetUserByID(ctx, account.UserID)
	}

	if !errors.Is(err, domain.ErrUserNotFound) {
		return nil, fmt.Errorf("get oauth account: %w", err)
	}

	return s.createNewUser(ctx, githubUser, providerUserID, encryptedToken)
}

func (s *serviceImpl) updateOAuthAccount(ctx context.Context, account *domain.OAuthAccount, githubUser *github.GitHubUser, encryptedToken string) error {
	account.AccessToken = &encryptedToken
	account.ProviderUsername = &githubUser.Login

	if _, err := s.repo.UpsertOAuthAccount(ctx, account); err != nil {
		return fmt.Errorf("update oauth account: %w", err)
	}
	return nil
}

func (s *serviceImpl) createNewUser(ctx context.Context, githubUser *github.GitHubUser, providerUserID, encryptedToken string) (*domain.User, error) {
	newUser := &domain.User{
		AvatarURL: githubUser.AvatarURL,
		Email:     githubUser.Email,
		Username:  githubUser.Login,
	}

	userID, err := s.repo.CreateUser(ctx, newUser)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	oauthAccount := &domain.OAuthAccount{
		AccessToken:      &encryptedToken,
		Provider:         domain.ProviderGitHub,
		ProviderUserID:   providerUserID,
		ProviderUsername: &githubUser.Login,
		UserID:           userID,
	}

	if _, err := s.repo.UpsertOAuthAccount(ctx, oauthAccount); err != nil {
		return nil, fmt.Errorf("create oauth account: %w", err)
	}

	newUser.ID = userID
	return newUser, nil
}

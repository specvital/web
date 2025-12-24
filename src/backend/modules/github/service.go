package github

import (
	"context"
	"fmt"

	"github.com/cockroachdb/errors"
	"golang.org/x/sync/singleflight"

	"github.com/specvital/web/src/backend/internal/client"
	authdomain "github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/github/domain"
)

const maxReposPerFetch = 1000

type TokenProvider interface {
	GetUserGitHubToken(ctx context.Context, userID string) (string, error)
}

type Service interface {
	ListOrganizationRepositories(ctx context.Context, userID, org string, refresh bool) ([]domain.Repository, error)
	ListUserOrganizations(ctx context.Context, userID string, refresh bool) ([]domain.Organization, error)
	ListUserRepositories(ctx context.Context, userID string, refresh bool) ([]domain.Repository, error)
}

type serviceImpl struct {
	clientFactory client.GitHubClientFactory
	group         singleflight.Group
	repo          Repository
	tokenProvider TokenProvider
}

func NewService(tokenProvider TokenProvider, repo Repository, clientFactory client.GitHubClientFactory) Service {
	return &serviceImpl{
		clientFactory: clientFactory,
		repo:          repo,
		tokenProvider: tokenProvider,
	}
}

func (s *serviceImpl) ListUserRepositories(ctx context.Context, userID string, refresh bool) ([]domain.Repository, error) {
	key := fmt.Sprintf("user-repos:%s:refresh=%t", userID, refresh)

	result, err, _ := s.group.Do(key, func() (any, error) {
		if refresh {
			if err := s.repo.DeleteUserRepositories(ctx, userID); err != nil {
				return nil, fmt.Errorf("delete cached repositories: %w", err)
			}
		}

		hasData, err := s.repo.HasUserRepositories(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("check cached repositories: %w", err)
		}

		if hasData {
			return s.repo.GetUserRepositories(ctx, userID)
		}

		repos, err := s.fetchUserRepositoriesFromGitHub(ctx, userID)
		if err != nil {
			return nil, err
		}

		if err := s.repo.UpsertUserRepositories(ctx, userID, repos); err != nil {
			return nil, fmt.Errorf("save repositories: %w", err)
		}

		return repos, nil
	})

	if err != nil {
		return nil, err
	}

	repos, ok := result.([]domain.Repository)
	if !ok {
		return nil, fmt.Errorf("unexpected result type: %T", result)
	}
	return repos, nil
}

func (s *serviceImpl) ListUserOrganizations(ctx context.Context, userID string, refresh bool) ([]domain.Organization, error) {
	key := fmt.Sprintf("user-orgs:%s:refresh=%t", userID, refresh)

	result, err, _ := s.group.Do(key, func() (any, error) {
		if refresh {
			if err := s.repo.DeleteUserOrganizations(ctx, userID); err != nil {
				return nil, fmt.Errorf("delete cached organizations: %w", err)
			}
		}

		hasData, err := s.repo.HasUserOrganizations(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("check cached organizations: %w", err)
		}

		if hasData {
			return s.repo.GetUserOrganizations(ctx, userID)
		}

		orgs, err := s.fetchUserOrganizationsFromGitHub(ctx, userID)
		if err != nil {
			return nil, err
		}

		if err := s.repo.UpsertUserOrganizations(ctx, userID, orgs); err != nil {
			return nil, fmt.Errorf("save organizations: %w", err)
		}

		return orgs, nil
	})

	if err != nil {
		return nil, err
	}

	orgs, ok := result.([]domain.Organization)
	if !ok {
		return nil, fmt.Errorf("unexpected result type: %T", result)
	}
	return orgs, nil
}

func (s *serviceImpl) ListOrganizationRepositories(ctx context.Context, userID, orgLogin string, refresh bool) ([]domain.Repository, error) {
	key := fmt.Sprintf("org-repos:%s:%s:refresh=%t", userID, orgLogin, refresh)

	result, err, _ := s.group.Do(key, func() (any, error) {
		orgID, err := s.repo.GetOrgIDByLogin(ctx, orgLogin)
		if err != nil {
			return s.fetchAndCacheOrgRepos(ctx, userID, orgLogin)
		}

		if refresh {
			if err := s.repo.DeleteOrgRepositories(ctx, userID, orgID); err != nil {
				return nil, fmt.Errorf("delete cached org repositories: %w", err)
			}
		}

		hasData, err := s.repo.HasOrgRepositories(ctx, userID, orgID)
		if err != nil {
			return nil, fmt.Errorf("check cached org repositories: %w", err)
		}

		if hasData {
			return s.repo.GetOrgRepositories(ctx, userID, orgID)
		}

		return s.fetchAndCacheOrgRepos(ctx, userID, orgLogin)
	})

	if err != nil {
		return nil, err
	}

	repos, ok := result.([]domain.Repository)
	if !ok {
		return nil, fmt.Errorf("unexpected result type: %T", result)
	}
	return repos, nil
}

func (s *serviceImpl) fetchAndCacheOrgRepos(ctx context.Context, userID, orgLogin string) ([]domain.Repository, error) {
	ghClient, err := s.getClient(ctx, userID)
	if err != nil {
		return nil, err
	}

	ghOrg, err := ghClient.GetOrganization(ctx, orgLogin)
	if err != nil {
		return nil, s.mapClientError(err)
	}

	org := mapClientOrganization(ghOrg)
	if err := s.repo.UpsertUserOrganizations(ctx, userID, []domain.Organization{org}); err != nil {
		return nil, fmt.Errorf("save organization: %w", err)
	}

	orgID, err := s.repo.GetOrgIDByLogin(ctx, orgLogin)
	if err != nil {
		return nil, fmt.Errorf("get org id: %w", err)
	}

	ghRepos, err := ghClient.ListOrgRepositories(ctx, orgLogin, maxReposPerFetch)
	if err != nil {
		return nil, s.mapClientError(err)
	}

	repos := mapClientRepositories(ghRepos)
	if err := s.repo.UpsertOrgRepositories(ctx, userID, orgID, repos); err != nil {
		return nil, fmt.Errorf("save org repositories: %w", err)
	}

	return repos, nil
}

func (s *serviceImpl) fetchUserRepositoriesFromGitHub(ctx context.Context, userID string) ([]domain.Repository, error) {
	ghClient, err := s.getClient(ctx, userID)
	if err != nil {
		return nil, err
	}

	ghRepos, err := ghClient.ListUserRepositories(ctx, maxReposPerFetch)
	if err != nil {
		return nil, s.mapClientError(err)
	}

	return mapClientRepositories(ghRepos), nil
}

func (s *serviceImpl) fetchUserOrganizationsFromGitHub(ctx context.Context, userID string) ([]domain.Organization, error) {
	ghClient, err := s.getClient(ctx, userID)
	if err != nil {
		return nil, err
	}

	ghOrgs, err := ghClient.ListUserOrganizations(ctx)
	if err != nil {
		return nil, s.mapClientError(err)
	}

	return mapClientOrganizations(ghOrgs), nil
}

func (s *serviceImpl) getClient(ctx context.Context, userID string) (client.GitHubClient, error) {
	token, err := s.tokenProvider.GetUserGitHubToken(ctx, userID)
	if err != nil {
		if errors.Is(err, authdomain.ErrUserNotFound) || errors.Is(err, authdomain.ErrNoGitHubToken) {
			return nil, domain.ErrNoGitHubToken
		}
		return nil, fmt.Errorf("get github token: %w", err)
	}

	return s.clientFactory(token), nil
}

func (s *serviceImpl) mapClientError(err error) error {
	switch {
	case errors.Is(err, client.ErrGitHubUnauthorized):
		return domain.ErrUnauthorized
	case errors.Is(err, client.ErrGitHubInsufficientScope):
		return domain.ErrInsufficientScope
	case errors.Is(err, client.ErrGitHubNotFound):
		return domain.ErrOrganizationNotFound
	case client.IsRateLimitError(err):
		var rateLimitErr *client.RateLimitError
		if errors.As(err, &rateLimitErr) {
			return &domain.RateLimitError{
				Limit:     rateLimitErr.Limit,
				Remaining: rateLimitErr.Remaining,
				ResetAt:   rateLimitErr.ResetAt,
			}
		}
		return &domain.RateLimitError{}
	default:
		return err
	}
}

func mapClientRepositories(repos []client.GitHubRepository) []domain.Repository {
	result := make([]domain.Repository, len(repos))
	for i, r := range repos {
		result[i] = domain.Repository{
			Archived:      r.Archived,
			DefaultBranch: r.DefaultBranch,
			Description:   r.Description,
			Disabled:      r.Disabled,
			Fork:          r.Fork,
			FullName:      r.FullName,
			HTMLURL:       r.HTMLURL,
			ID:            r.ID,
			Language:      r.Language,
			Name:          r.Name,
			Owner:         r.Owner,
			Private:       r.Private,
			PushedAt:      r.PushedAt,
			StarCount:     r.StarCount,
			Visibility:    r.Visibility,
		}
	}
	return result
}

func mapClientOrganization(org *client.GitHubOrganization) domain.Organization {
	return domain.Organization{
		AvatarURL:   org.AvatarURL,
		Description: org.Description,
		HTMLURL:     org.HTMLURL,
		ID:          org.ID,
		Login:       org.Login,
	}
}

func mapClientOrganizations(orgs []client.GitHubOrganization) []domain.Organization {
	result := make([]domain.Organization, len(orgs))
	for i, o := range orgs {
		result[i] = domain.Organization{
			AvatarURL:   o.AvatarURL,
			Description: o.Description,
			HTMLURL:     o.HTMLURL,
			ID:          o.ID,
			Login:       o.Login,
		}
	}
	return result
}

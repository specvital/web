package github

import (
	"context"
	"testing"

	"github.com/cockroachdb/errors"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/specvital/web/src/backend/internal/client"
	authdomain "github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/github/domain"
)

type mockTokenProvider struct {
	token string
	err   error
}

func (m *mockTokenProvider) GetUserGitHubToken(_ context.Context, _ string) (string, error) {
	if m.err != nil {
		return "", m.err
	}
	return m.token, nil
}

type mockGitHubClient struct {
	repos    []client.GitHubRepository
	orgs     []client.GitHubOrganization
	org      *client.GitHubOrganization
	reposErr error
	orgsErr  error
	orgErr   error
}

func (m *mockGitHubClient) GetOrganization(_ context.Context, _ string) (*client.GitHubOrganization, error) {
	if m.orgErr != nil {
		return nil, m.orgErr
	}
	return m.org, nil
}

func (m *mockGitHubClient) ListOrgRepositories(_ context.Context, _ string, _ int) ([]client.GitHubRepository, error) {
	if m.reposErr != nil {
		return nil, m.reposErr
	}
	return m.repos, nil
}

func (m *mockGitHubClient) ListUserOrganizations(_ context.Context) ([]client.GitHubOrganization, error) {
	if m.orgsErr != nil {
		return nil, m.orgsErr
	}
	return m.orgs, nil
}

func (m *mockGitHubClient) ListUserRepositories(_ context.Context, _ int) ([]client.GitHubRepository, error) {
	if m.reposErr != nil {
		return nil, m.reposErr
	}
	return m.repos, nil
}

func mockClientFactory(c client.GitHubClient) client.GitHubClientFactory {
	return func(_ string) client.GitHubClient {
		return c
	}
}

type mockRepository struct {
	repos       []domain.Repository
	orgs        []domain.Organization
	orgRepos    []domain.Repository
	hasRepos    bool
	hasOrgs     bool
	hasOrgRepos bool
	orgID       pgtype.UUID
	orgIDErr    error
	err         error
}

func (m *mockRepository) DeleteUserOrganizations(_ context.Context, _ string) error {
	return m.err
}

func (m *mockRepository) DeleteUserRepositories(_ context.Context, _ string) error {
	return m.err
}

func (m *mockRepository) GetUserOrganizations(_ context.Context, _ string) ([]domain.Organization, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.orgs, nil
}

func (m *mockRepository) GetUserRepositories(_ context.Context, _ string) ([]domain.Repository, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.repos, nil
}

func (m *mockRepository) HasUserOrganizations(_ context.Context, _ string) (bool, error) {
	return m.hasOrgs, m.err
}

func (m *mockRepository) HasUserRepositories(_ context.Context, _ string) (bool, error) {
	return m.hasRepos, m.err
}

func (m *mockRepository) UpsertUserOrganizations(_ context.Context, _ string, _ []domain.Organization) error {
	return m.err
}

func (m *mockRepository) UpsertUserRepositories(_ context.Context, _ string, _ []domain.Repository) error {
	return m.err
}

func (m *mockRepository) DeleteOrgRepositories(_ context.Context, _ string, _ pgtype.UUID) error {
	return m.err
}

func (m *mockRepository) GetOrgRepositories(_ context.Context, _ string, _ pgtype.UUID) ([]domain.Repository, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.orgRepos, nil
}

func (m *mockRepository) HasOrgRepositories(_ context.Context, _ string, _ pgtype.UUID) (bool, error) {
	return m.hasOrgRepos, m.err
}

func (m *mockRepository) UpsertOrgRepositories(_ context.Context, _ string, _ pgtype.UUID, _ []domain.Repository) error {
	return m.err
}

func (m *mockRepository) GetOrgIDByLogin(_ context.Context, _ string) (pgtype.UUID, error) {
	if m.orgIDErr != nil {
		return pgtype.UUID{}, m.orgIDErr
	}
	return m.orgID, nil
}

func TestService_ListUserRepositories_FromCache(t *testing.T) {
	repo := &mockRepository{
		hasRepos: true,
		repos:    []domain.Repository{{ID: 1, Name: "repo1"}},
	}
	provider := &mockTokenProvider{token: "test-token"}
	ghClient := &mockGitHubClient{}
	svc := NewService(provider, repo, mockClientFactory(ghClient))

	repos, err := svc.ListUserRepositories(context.Background(), "user-123", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(repos) != 1 {
		t.Errorf("expected 1 repo, got %d", len(repos))
	}
}

func TestService_ListUserRepositories_FromGitHub(t *testing.T) {
	repo := &mockRepository{
		hasRepos: false,
	}
	provider := &mockTokenProvider{token: "test-token"}
	ghClient := &mockGitHubClient{
		repos: []client.GitHubRepository{
			{ID: 1, Name: "repo1", FullName: "user/repo1"},
			{ID: 2, Name: "repo2", FullName: "user/repo2"},
		},
	}
	svc := NewService(provider, repo, mockClientFactory(ghClient))

	repos, err := svc.ListUserRepositories(context.Background(), "user-123", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(repos) != 2 {
		t.Errorf("expected 2 repos, got %d", len(repos))
	}
}

func TestService_ListUserOrganizations_FromCache(t *testing.T) {
	repo := &mockRepository{
		hasOrgs: true,
		orgs:    []domain.Organization{{ID: 1, Login: "org1"}},
	}
	provider := &mockTokenProvider{token: "test-token"}
	ghClient := &mockGitHubClient{}
	svc := NewService(provider, repo, mockClientFactory(ghClient))

	orgs, err := svc.ListUserOrganizations(context.Background(), "user-123", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(orgs) != 1 {
		t.Errorf("expected 1 org, got %d", len(orgs))
	}
}

func TestService_ListOrganizationRepositories_NoToken(t *testing.T) {
	repo := &mockRepository{}
	provider := &mockTokenProvider{err: authdomain.ErrNoGitHubToken}
	ghClient := &mockGitHubClient{}
	svc := NewService(provider, repo, mockClientFactory(ghClient))

	_, err := svc.ListOrganizationRepositories(context.Background(), "user-123", "org", false)
	if !errors.Is(err, domain.ErrNoGitHubToken) {
		t.Errorf("expected ErrNoGitHubToken, got %v", err)
	}
}

func TestService_ListUserRepositories_RateLimited(t *testing.T) {
	repo := &mockRepository{hasRepos: false}
	provider := &mockTokenProvider{token: "test-token"}
	ghClient := &mockGitHubClient{
		reposErr: &client.RateLimitError{Limit: 5000, Remaining: 0},
	}
	svc := NewService(provider, repo, mockClientFactory(ghClient))

	_, err := svc.ListUserRepositories(context.Background(), "user-123", false)
	if !domain.IsRateLimitError(err) {
		t.Errorf("expected RateLimitError, got %v", err)
	}
}

func TestService_ListUserRepositories_Unauthorized(t *testing.T) {
	repo := &mockRepository{hasRepos: false}
	provider := &mockTokenProvider{token: "test-token"}
	ghClient := &mockGitHubClient{
		reposErr: client.ErrGitHubUnauthorized,
	}
	svc := NewService(provider, repo, mockClientFactory(ghClient))

	_, err := svc.ListUserRepositories(context.Background(), "user-123", false)
	if !errors.Is(err, domain.ErrUnauthorized) {
		t.Errorf("expected ErrUnauthorized, got %v", err)
	}
}

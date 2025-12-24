package github

import (
	"context"
	"testing"

	"github.com/golang-jwt/jwt/v5"

	"github.com/specvital/web/src/backend/common/logger"
	"github.com/specvital/web/src/backend/common/middleware"
	"github.com/specvital/web/src/backend/internal/api"
	authdomain "github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/github/domain"
)

func contextWithUserID(userID string) context.Context {
	claims := &authdomain.Claims{
		RegisteredClaims: jwt.RegisteredClaims{Subject: userID},
	}
	return middleware.WithClaims(context.Background(), claims)
}

type mockService struct {
	repos []domain.Repository
	orgs  []domain.Organization
	err   error
}

func (m *mockService) ListUserRepositories(_ context.Context, _ string, _ bool) ([]domain.Repository, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.repos, nil
}

func (m *mockService) ListUserOrganizations(_ context.Context, _ string, _ bool) ([]domain.Organization, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.orgs, nil
}

func (m *mockService) ListOrganizationRepositories(_ context.Context, _, _ string, _ bool) ([]domain.Repository, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.repos, nil
}

func TestHandler_GetUserGitHubRepositories_Unauthorized(t *testing.T) {
	h, _ := NewHandler(&HandlerConfig{
		Logger:  logger.New(),
		Service: &mockService{},
	})

	resp, err := h.GetUserGitHubRepositories(context.Background(), api.GetUserGitHubRepositoriesRequestObject{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := resp.(api.GetUserGitHubRepositories401ApplicationProblemPlusJSONResponse); !ok {
		t.Errorf("expected 401 response, got %T", resp)
	}
}

func TestHandler_GetUserGitHubRepositories_Success(t *testing.T) {
	svc := &mockService{
		repos: []domain.Repository{
			{ID: 1, Name: "repo1", FullName: "user/repo1", Owner: "user"},
		},
	}
	h, _ := NewHandler(&HandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})

	ctx := contextWithUserID("user-123")
	resp, err := h.GetUserGitHubRepositories(ctx, api.GetUserGitHubRepositoriesRequestObject{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	successResp, ok := resp.(api.GetUserGitHubRepositories200JSONResponse)
	if !ok {
		t.Errorf("expected 200 response, got %T", resp)
	}

	if len(successResp.Data) != 1 {
		t.Errorf("expected 1 repository, got %d", len(successResp.Data))
	}
}

func TestHandler_GetUserGitHubRepositories_NoToken(t *testing.T) {
	svc := &mockService{err: domain.ErrNoGitHubToken}
	h, _ := NewHandler(&HandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})

	ctx := contextWithUserID("user-123")
	resp, err := h.GetUserGitHubRepositories(ctx, api.GetUserGitHubRepositoriesRequestObject{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := resp.(api.GetUserGitHubRepositories401ApplicationProblemPlusJSONResponse); !ok {
		t.Errorf("expected 401 response, got %T", resp)
	}
}

func TestHandler_GetUserGitHubRepositories_RateLimited(t *testing.T) {
	svc := &mockService{err: &domain.RateLimitError{Limit: 5000, Remaining: 0}}
	h, _ := NewHandler(&HandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})

	ctx := contextWithUserID("user-123")
	resp, err := h.GetUserGitHubRepositories(ctx, api.GetUserGitHubRepositoriesRequestObject{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := resp.(api.GetUserGitHubRepositories429ApplicationProblemPlusJSONResponse); !ok {
		t.Errorf("expected 429 response, got %T", resp)
	}
}

func TestHandler_GetUserGitHubOrganizations_Success(t *testing.T) {
	svc := &mockService{
		orgs: []domain.Organization{
			{ID: 1, Login: "org1"},
		},
	}
	h, _ := NewHandler(&HandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})

	ctx := contextWithUserID("user-123")
	resp, err := h.GetUserGitHubOrganizations(ctx, api.GetUserGitHubOrganizationsRequestObject{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	successResp, ok := resp.(api.GetUserGitHubOrganizations200JSONResponse)
	if !ok {
		t.Errorf("expected 200 response, got %T", resp)
	}

	if len(successResp.Data) != 1 {
		t.Errorf("expected 1 organization, got %d", len(successResp.Data))
	}
}

func TestHandler_GetOrganizationRepositories_Success(t *testing.T) {
	svc := &mockService{
		repos: []domain.Repository{
			{ID: 1, Name: "repo1", FullName: "org/repo1", Owner: "org"},
		},
	}
	h, _ := NewHandler(&HandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})

	ctx := contextWithUserID("user-123")
	resp, err := h.GetOrganizationRepositories(ctx, api.GetOrganizationRepositoriesRequestObject{Org: "org"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	successResp, ok := resp.(api.GetOrganizationRepositories200JSONResponse)
	if !ok {
		t.Errorf("expected 200 response, got %T", resp)
	}

	if len(successResp.Data) != 1 {
		t.Errorf("expected 1 repository, got %d", len(successResp.Data))
	}
}

func TestHandler_GetOrganizationRepositories_NotFound(t *testing.T) {
	svc := &mockService{err: domain.ErrOrganizationNotFound}
	h, _ := NewHandler(&HandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})

	ctx := contextWithUserID("user-123")
	resp, err := h.GetOrganizationRepositories(ctx, api.GetOrganizationRepositoriesRequestObject{Org: "unknown"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := resp.(api.GetOrganizationRepositories404ApplicationProblemPlusJSONResponse); !ok {
		t.Errorf("expected 404 response, got %T", resp)
	}
}

func TestNewHandler_Validation(t *testing.T) {
	tests := []struct {
		name    string
		cfg     *HandlerConfig
		wantErr bool
	}{
		{"nil config", nil, true},
		{"nil logger", &HandlerConfig{Service: &mockService{}}, true},
		{"nil service", &HandlerConfig{Logger: logger.New()}, true},
		{"valid", &HandlerConfig{Logger: logger.New(), Service: &mockService{}}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewHandler(tt.cfg)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewHandler() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

package user

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"

	"github.com/specvital/web/src/backend/common/logger"
	"github.com/specvital/web/src/backend/common/middleware"
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/auth"
	authdomain "github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/user/domain"
)

func withTestUserContext(ctx context.Context, userID string) context.Context {
	claims := &authdomain.Claims{
		RegisteredClaims: jwt.RegisteredClaims{Subject: userID},
		Login:            "testuser",
	}
	return middleware.WithClaims(ctx, claims)
}

type mockAnalysisHistoryService struct {
	result *domain.AnalyzedReposResult
	err    error
}

func (m *mockAnalysisHistoryService) GetUserAnalyzedRepositories(_ context.Context, _ string, _ domain.AnalyzedReposParams) (*domain.AnalyzedReposResult, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.result, nil
}

func setupAnalysisHistoryTestRouter(handler *AnalysisHistoryHandler) *chi.Mux {
	r := chi.NewRouter()
	apiHandlers := api.NewAPIHandlers(
		&mockAnalyzerHandler{},
		handler,
		auth.NewMockHandler(),
		auth.NewMockBookmarkHandler(),
		&mockGitHubHandler{},
		&mockRepositoryHandler{},
	)
	strictHandler := api.NewStrictHandler(apiHandlers, nil)
	api.HandlerFromMux(strictHandler, r)
	return r
}

type mockAnalyzerHandler struct{}

func (m *mockAnalyzerHandler) AnalyzeRepository(_ context.Context, _ api.AnalyzeRepositoryRequestObject) (api.AnalyzeRepositoryResponseObject, error) {
	return nil, nil
}

func (m *mockAnalyzerHandler) GetAnalysisStatus(_ context.Context, _ api.GetAnalysisStatusRequestObject) (api.GetAnalysisStatusResponseObject, error) {
	return nil, nil
}

type mockRepositoryHandler struct{}

func (m *mockRepositoryHandler) GetRecentRepositories(_ context.Context, _ api.GetRecentRepositoriesRequestObject) (api.GetRecentRepositoriesResponseObject, error) {
	return nil, nil
}

func (m *mockRepositoryHandler) GetRepositoryStats(_ context.Context, _ api.GetRepositoryStatsRequestObject) (api.GetRepositoryStatsResponseObject, error) {
	return nil, nil
}

func (m *mockRepositoryHandler) GetUpdateStatus(_ context.Context, _ api.GetUpdateStatusRequestObject) (api.GetUpdateStatusResponseObject, error) {
	return nil, nil
}

func (m *mockRepositoryHandler) ReanalyzeRepository(_ context.Context, _ api.ReanalyzeRepositoryRequestObject) (api.ReanalyzeRepositoryResponseObject, error) {
	return nil, nil
}

type mockGitHubHandler struct{}

func (m *mockGitHubHandler) GetOrganizationRepositories(_ context.Context, _ api.GetOrganizationRepositoriesRequestObject) (api.GetOrganizationRepositoriesResponseObject, error) {
	return nil, nil
}

func (m *mockGitHubHandler) GetUserGitHubOrganizations(_ context.Context, _ api.GetUserGitHubOrganizationsRequestObject) (api.GetUserGitHubOrganizationsResponseObject, error) {
	return nil, nil
}

func (m *mockGitHubHandler) GetUserGitHubRepositories(_ context.Context, _ api.GetUserGitHubRepositoriesRequestObject) (api.GetUserGitHubRepositoriesResponseObject, error) {
	return nil, nil
}

func TestGetUserAnalyzedRepositories_Unauthorized(t *testing.T) {
	svc := &mockAnalysisHistoryService{
		result: &domain.AnalyzedReposResult{Data: []*domain.AnalyzedRepository{}, HasNext: false},
	}
	handler, err := NewAnalysisHistoryHandler(&AnalysisHistoryHandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})
	if err != nil {
		t.Fatalf("failed to create handler: %v", err)
	}
	router := setupAnalysisHistoryTestRouter(handler)

	req := httptest.NewRequest(http.MethodGet, "/api/user/analyzed-repositories", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", rec.Code)
	}
}

func TestGetUserAnalyzedRepositories_Success(t *testing.T) {
	now := time.Now()
	svc := &mockAnalysisHistoryService{
		result: &domain.AnalyzedReposResult{
			Data: []*domain.AnalyzedRepository{
				{
					CodebaseID:  "codebase-1",
					CommitSHA:   "abc123",
					CompletedAt: now,
					HistoryID:   "history-1",
					Name:        "repo1",
					Owner:       "user1",
					TotalTests:  100,
					UpdatedAt:   now,
				},
			},
			HasNext:    false,
			NextCursor: nil,
		},
	}
	handler, err := NewAnalysisHistoryHandler(&AnalysisHistoryHandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})
	if err != nil {
		t.Fatalf("failed to create handler: %v", err)
	}
	router := setupAnalysisHistoryTestRouter(handler)

	req := httptest.NewRequest(http.MethodGet, "/api/user/analyzed-repositories", nil)
	req = req.WithContext(withTestUserContext(req.Context(), "test-user-id"))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", ct)
	}
}

func TestGetUserAnalyzedRepositories_WithPagination(t *testing.T) {
	now := time.Now()
	nextCursor := now.Add(-time.Hour).Format(time.RFC3339Nano)
	svc := &mockAnalysisHistoryService{
		result: &domain.AnalyzedReposResult{
			Data: []*domain.AnalyzedRepository{
				{
					CodebaseID:  "codebase-1",
					CommitSHA:   "abc123",
					CompletedAt: now,
					HistoryID:   "history-1",
					Name:        "repo1",
					Owner:       "user1",
					TotalTests:  100,
					UpdatedAt:   now,
				},
			},
			HasNext:    true,
			NextCursor: &nextCursor,
		},
	}
	handler, err := NewAnalysisHistoryHandler(&AnalysisHistoryHandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})
	if err != nil {
		t.Fatalf("failed to create handler: %v", err)
	}
	router := setupAnalysisHistoryTestRouter(handler)

	req := httptest.NewRequest(http.MethodGet, "/api/user/analyzed-repositories?limit=1", nil)
	req = req.WithContext(withTestUserContext(req.Context(), "test-user-id"))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}
}

func TestGetUserAnalyzedRepositories_InvalidCursor(t *testing.T) {
	svc := &mockAnalysisHistoryService{
		err: domain.ErrInvalidCursor,
	}
	handler, err := NewAnalysisHistoryHandler(&AnalysisHistoryHandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})
	if err != nil {
		t.Fatalf("failed to create handler: %v", err)
	}
	router := setupAnalysisHistoryTestRouter(handler)

	req := httptest.NewRequest(http.MethodGet, "/api/user/analyzed-repositories?cursor=invalid-cursor", nil)
	req = req.WithContext(withTestUserContext(req.Context(), "test-user-id"))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rec.Code)
	}
}

func TestGetUserAnalyzedRepositories_WithOwnershipFilter(t *testing.T) {
	svc := &mockAnalysisHistoryService{
		result: &domain.AnalyzedReposResult{Data: []*domain.AnalyzedRepository{}, HasNext: false},
	}
	handler, err := NewAnalysisHistoryHandler(&AnalysisHistoryHandlerConfig{
		Logger:  logger.New(),
		Service: svc,
	})
	if err != nil {
		t.Fatalf("failed to create handler: %v", err)
	}
	router := setupAnalysisHistoryTestRouter(handler)

	tests := []struct {
		name       string
		queryParam string
	}{
		{"all ownership", "?ownership=all"},
		{"mine ownership", "?ownership=mine"},
		{"organization ownership", "?ownership=organization"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/user/analyzed-repositories"+tt.queryParam, nil)
			req = req.WithContext(withTestUserContext(req.Context(), "test-user-id"))
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Errorf("expected status 200, got %d", rec.Code)
			}
		})
	}
}

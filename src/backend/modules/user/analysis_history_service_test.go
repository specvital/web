package user

import (
	"context"
	"strconv"
	"testing"
	"time"

	"github.com/specvital/web/src/backend/modules/user/domain"
)

type mockAnalysisHistoryRepository struct {
	repos []*domain.AnalyzedRepository
	err   error
}

func (m *mockAnalysisHistoryRepository) GetUserAnalyzedRepositories(_ context.Context, _ string, _ domain.AnalyzedReposParams) ([]*domain.AnalyzedRepository, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.repos, nil
}

func TestAnalysisHistoryService_GetUserAnalyzedRepositories_Empty(t *testing.T) {
	repo := &mockAnalysisHistoryRepository{repos: []*domain.AnalyzedRepository{}}
	svc := NewAnalysisHistoryService(repo)

	result, err := svc.GetUserAnalyzedRepositories(context.Background(), "user-id", domain.AnalyzedReposParams{
		Limit:     20,
		Ownership: domain.OwnershipAll,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.HasNext {
		t.Error("expected HasNext to be false")
	}
	if result.NextCursor != nil {
		t.Error("expected NextCursor to be nil")
	}
	if len(result.Data) != 0 {
		t.Errorf("expected 0 items, got %d", len(result.Data))
	}
}

func TestAnalysisHistoryService_GetUserAnalyzedRepositories_WithPagination(t *testing.T) {
	now := time.Now()
	repos := make([]*domain.AnalyzedRepository, 21)
	for i := 0; i < 21; i++ {
		repos[i] = &domain.AnalyzedRepository{
			CodebaseID:  "codebase-" + strconv.Itoa(i),
			CommitSHA:   "sha-" + strconv.Itoa(i),
			CompletedAt: now,
			HistoryID:   "history-" + strconv.Itoa(i),
			Name:        "repo",
			Owner:       "owner",
			TotalTests:  100,
			UpdatedAt:   now.Add(-time.Duration(i) * time.Hour),
		}
	}

	repo := &mockAnalysisHistoryRepository{repos: repos}
	svc := NewAnalysisHistoryService(repo)

	result, err := svc.GetUserAnalyzedRepositories(context.Background(), "user-id", domain.AnalyzedReposParams{
		Limit:     20,
		Ownership: domain.OwnershipAll,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !result.HasNext {
		t.Error("expected HasNext to be true")
	}
	if result.NextCursor == nil {
		t.Error("expected NextCursor to be set")
	}
	if len(result.Data) != 20 {
		t.Errorf("expected 20 items, got %d", len(result.Data))
	}
}

func TestAnalysisHistoryService_GetUserAnalyzedRepositories_ExactLimit(t *testing.T) {
	now := time.Now()
	repos := make([]*domain.AnalyzedRepository, 20)
	for i := 0; i < 20; i++ {
		repos[i] = &domain.AnalyzedRepository{
			CodebaseID:  "codebase-" + strconv.Itoa(i),
			CommitSHA:   "sha-" + strconv.Itoa(i),
			CompletedAt: now,
			HistoryID:   "history-" + strconv.Itoa(i),
			Name:        "repo",
			Owner:       "owner",
			TotalTests:  100,
			UpdatedAt:   now.Add(-time.Duration(i) * time.Hour),
		}
	}

	repo := &mockAnalysisHistoryRepository{repos: repos}
	svc := NewAnalysisHistoryService(repo)

	result, err := svc.GetUserAnalyzedRepositories(context.Background(), "user-id", domain.AnalyzedReposParams{
		Limit:     20,
		Ownership: domain.OwnershipAll,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.HasNext {
		t.Error("expected HasNext to be false")
	}
	if result.NextCursor != nil {
		t.Error("expected NextCursor to be nil")
	}
	if len(result.Data) != 20 {
		t.Errorf("expected 20 items, got %d", len(result.Data))
	}
}

func TestParseOwnershipFilter(t *testing.T) {
	tests := []struct {
		input    string
		expected domain.OwnershipFilter
	}{
		{"all", domain.OwnershipAll},
		{"mine", domain.OwnershipMine},
		{"organization", domain.OwnershipOrganization},
		{"", domain.OwnershipAll},
		{"invalid", domain.OwnershipAll},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := domain.ParseOwnershipFilter(tt.input)
			if result != tt.expected {
				t.Errorf("expected %s, got %s", tt.expected, result)
			}
		})
	}
}

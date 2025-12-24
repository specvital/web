package user

import (
	"context"

	"github.com/specvital/web/src/backend/internal/api"
)

// MockAnalysisHistoryHandler is a test double for analysis history endpoints.
type MockAnalysisHistoryHandler struct{}

var _ api.AnalysisHistoryHandlers = (*MockAnalysisHistoryHandler)(nil)

func NewMockAnalysisHistoryHandler() *MockAnalysisHistoryHandler {
	return &MockAnalysisHistoryHandler{}
}

func (h *MockAnalysisHistoryHandler) GetUserAnalyzedRepositories(_ context.Context, _ api.GetUserAnalyzedRepositoriesRequestObject) (api.GetUserAnalyzedRepositoriesResponseObject, error) {
	return api.GetUserAnalyzedRepositories200JSONResponse{Data: []api.RepositoryCard{}, HasNext: false}, nil
}

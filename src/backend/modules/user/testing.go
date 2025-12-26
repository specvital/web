package user

import (
	"context"

	"github.com/specvital/web/src/backend/internal/api"
)

type MockHandler struct{}

var _ api.AnalysisHistoryHandlers = (*MockHandler)(nil)
var _ api.BookmarkHandlers = (*MockHandler)(nil)

func NewMockHandler() *MockHandler {
	return &MockHandler{}
}

func (h *MockHandler) AddBookmark(_ context.Context, _ api.AddBookmarkRequestObject) (api.AddBookmarkResponseObject, error) {
	return api.AddBookmark200JSONResponse{IsBookmarked: true, Success: true}, nil
}

func (h *MockHandler) GetUserBookmarks(_ context.Context, _ api.GetUserBookmarksRequestObject) (api.GetUserBookmarksResponseObject, error) {
	return api.GetUserBookmarks200JSONResponse{Data: []api.RepositoryCard{}}, nil
}

func (h *MockHandler) RemoveBookmark(_ context.Context, _ api.RemoveBookmarkRequestObject) (api.RemoveBookmarkResponseObject, error) {
	return api.RemoveBookmark200JSONResponse{IsBookmarked: false, Success: true}, nil
}

func (h *MockHandler) GetUserAnalyzedRepositories(_ context.Context, _ api.GetUserAnalyzedRepositoriesRequestObject) (api.GetUserAnalyzedRepositoriesResponseObject, error) {
	return api.GetUserAnalyzedRepositories200JSONResponse{Data: []api.RepositoryCard{}, HasNext: false}, nil
}

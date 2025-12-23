package api

import "context"

type AnalyzerHandlers interface {
	AnalyzeRepository(ctx context.Context, request AnalyzeRepositoryRequestObject) (AnalyzeRepositoryResponseObject, error)
	GetAnalysisStatus(ctx context.Context, request GetAnalysisStatusRequestObject) (GetAnalysisStatusResponseObject, error)
}

type AuthHandlers interface {
	AuthCallback(ctx context.Context, request AuthCallbackRequestObject) (AuthCallbackResponseObject, error)
	AuthLogin(ctx context.Context, request AuthLoginRequestObject) (AuthLoginResponseObject, error)
	AuthLogout(ctx context.Context, request AuthLogoutRequestObject) (AuthLogoutResponseObject, error)
	AuthMe(ctx context.Context, request AuthMeRequestObject) (AuthMeResponseObject, error)
}

type APIHandlers struct {
	analyzer AnalyzerHandlers
	auth     AuthHandlers
}

var _ StrictServerInterface = (*APIHandlers)(nil)

func NewAPIHandlers(analyzer AnalyzerHandlers, auth AuthHandlers) *APIHandlers {
	return &APIHandlers{
		analyzer: analyzer,
		auth:     auth,
	}
}

func (h *APIHandlers) AnalyzeRepository(ctx context.Context, request AnalyzeRepositoryRequestObject) (AnalyzeRepositoryResponseObject, error) {
	return h.analyzer.AnalyzeRepository(ctx, request)
}

func (h *APIHandlers) GetAnalysisStatus(ctx context.Context, request GetAnalysisStatusRequestObject) (GetAnalysisStatusResponseObject, error) {
	return h.analyzer.GetAnalysisStatus(ctx, request)
}

func (h *APIHandlers) AuthCallback(ctx context.Context, request AuthCallbackRequestObject) (AuthCallbackResponseObject, error) {
	return h.auth.AuthCallback(ctx, request)
}

func (h *APIHandlers) AuthLogin(ctx context.Context, request AuthLoginRequestObject) (AuthLoginResponseObject, error) {
	return h.auth.AuthLogin(ctx, request)
}

func (h *APIHandlers) AuthLogout(ctx context.Context, request AuthLogoutRequestObject) (AuthLogoutResponseObject, error) {
	return h.auth.AuthLogout(ctx, request)
}

func (h *APIHandlers) AuthMe(ctx context.Context, request AuthMeRequestObject) (AuthMeResponseObject, error) {
	return h.auth.AuthMe(ctx, request)
}

// Stub implementations - actual handlers will be added to auth/analyzer modules

func (h *APIHandlers) AddBookmark(_ context.Context, _ AddBookmarkRequestObject) (AddBookmarkResponseObject, error) {
	return AddBookmark500ApplicationProblemPlusJSONResponse{
		InternalErrorApplicationProblemPlusJSONResponse: NewInternalError("Bookmark feature not yet implemented"),
	}, nil
}

func (h *APIHandlers) GetRecentRepositories(_ context.Context, _ GetRecentRepositoriesRequestObject) (GetRecentRepositoriesResponseObject, error) {
	return GetRecentRepositories500ApplicationProblemPlusJSONResponse{
		InternalErrorApplicationProblemPlusJSONResponse: NewInternalError("Recent repositories feature not yet implemented"),
	}, nil
}

func (h *APIHandlers) GetRepositoryStats(_ context.Context, _ GetRepositoryStatsRequestObject) (GetRepositoryStatsResponseObject, error) {
	return GetRepositoryStats500ApplicationProblemPlusJSONResponse{
		InternalErrorApplicationProblemPlusJSONResponse: NewInternalError("Repository stats feature not yet implemented"),
	}, nil
}

func (h *APIHandlers) GetUpdateStatus(_ context.Context, _ GetUpdateStatusRequestObject) (GetUpdateStatusResponseObject, error) {
	return GetUpdateStatus500ApplicationProblemPlusJSONResponse{
		InternalErrorApplicationProblemPlusJSONResponse: NewInternalError("Update status feature not yet implemented"),
	}, nil
}

func (h *APIHandlers) ReanalyzeRepository(_ context.Context, _ ReanalyzeRepositoryRequestObject) (ReanalyzeRepositoryResponseObject, error) {
	return ReanalyzeRepository500ApplicationProblemPlusJSONResponse{
		InternalErrorApplicationProblemPlusJSONResponse: NewInternalError("Reanalyze feature not yet implemented"),
	}, nil
}

func (h *APIHandlers) GetUserBookmarks(_ context.Context, _ GetUserBookmarksRequestObject) (GetUserBookmarksResponseObject, error) {
	return GetUserBookmarks500ApplicationProblemPlusJSONResponse{
		InternalErrorApplicationProblemPlusJSONResponse: NewInternalError("Bookmarks feature not yet implemented"),
	}, nil
}

func (h *APIHandlers) RemoveBookmark(_ context.Context, _ RemoveBookmarkRequestObject) (RemoveBookmarkResponseObject, error) {
	return RemoveBookmark500ApplicationProblemPlusJSONResponse{
		InternalErrorApplicationProblemPlusJSONResponse: NewInternalError("Bookmark feature not yet implemented"),
	}, nil
}

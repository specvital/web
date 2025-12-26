package handler

import (
	"context"

	"github.com/cockroachdb/errors"

	"github.com/specvital/web/src/backend/common/logger"
	"github.com/specvital/web/src/backend/common/middleware"
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/user/adapter/mapper"
	"github.com/specvital/web/src/backend/modules/user/domain"
	"github.com/specvital/web/src/backend/modules/user/domain/entity"
	bookmarkuc "github.com/specvital/web/src/backend/modules/user/usecase/bookmark"
	historyuc "github.com/specvital/web/src/backend/modules/user/usecase/history"
)

const (
	defaultPageLimit = 20
	maxPageLimit     = 100
)

type Handler struct {
	addBookmark      *bookmarkuc.AddBookmarkUseCase
	getAnalyzedRepos *historyuc.GetAnalyzedReposUseCase
	getBookmarks     *bookmarkuc.GetBookmarksUseCase
	logger           *logger.Logger
	removeBookmark   *bookmarkuc.RemoveBookmarkUseCase
}

type HandlerConfig struct {
	AddBookmark      *bookmarkuc.AddBookmarkUseCase
	GetAnalyzedRepos *historyuc.GetAnalyzedReposUseCase
	GetBookmarks     *bookmarkuc.GetBookmarksUseCase
	Logger           *logger.Logger
	RemoveBookmark   *bookmarkuc.RemoveBookmarkUseCase
}

var _ api.BookmarkHandlers = (*Handler)(nil)
var _ api.AnalysisHistoryHandlers = (*Handler)(nil)

func NewHandler(cfg *HandlerConfig) (*Handler, error) {
	if cfg == nil {
		return nil, errors.New("handler config is required")
	}
	if cfg.Logger == nil {
		return nil, errors.New("logger is required")
	}
	if cfg.AddBookmark == nil {
		return nil, errors.New("addBookmark usecase is required")
	}
	if cfg.GetBookmarks == nil {
		return nil, errors.New("getBookmarks usecase is required")
	}
	if cfg.RemoveBookmark == nil {
		return nil, errors.New("removeBookmark usecase is required")
	}
	if cfg.GetAnalyzedRepos == nil {
		return nil, errors.New("getAnalyzedRepos usecase is required")
	}
	return &Handler{
		addBookmark:      cfg.AddBookmark,
		getAnalyzedRepos: cfg.GetAnalyzedRepos,
		getBookmarks:     cfg.GetBookmarks,
		logger:           cfg.Logger,
		removeBookmark:   cfg.RemoveBookmark,
	}, nil
}

func (h *Handler) AddBookmark(ctx context.Context, request api.AddBookmarkRequestObject) (api.AddBookmarkResponseObject, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return api.AddBookmark401ApplicationProblemPlusJSONResponse{
			UnauthorizedApplicationProblemPlusJSONResponse: api.NewUnauthorized("authentication required"),
		}, nil
	}

	output, err := h.addBookmark.Execute(ctx, bookmarkuc.AddBookmarkInput{
		Owner:  request.Owner,
		Repo:   request.Repo,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, domain.ErrCodebaseNotFound) {
			return api.AddBookmark404ApplicationProblemPlusJSONResponse{
				NotFoundApplicationProblemPlusJSONResponse: api.NewNotFound("repository not found"),
			}, nil
		}

		h.logger.Error(ctx, "failed to add bookmark", "error", err, "owner", request.Owner, "repo", request.Repo)
		return api.AddBookmark500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to add bookmark"),
		}, nil
	}

	return api.AddBookmark200JSONResponse(mapper.ToBookmarkResponse(output.IsBookmarked)), nil
}

func (h *Handler) GetUserBookmarks(ctx context.Context, _ api.GetUserBookmarksRequestObject) (api.GetUserBookmarksResponseObject, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return api.GetUserBookmarks401ApplicationProblemPlusJSONResponse{
			UnauthorizedApplicationProblemPlusJSONResponse: api.NewUnauthorized("authentication required"),
		}, nil
	}

	repos, err := h.getBookmarks.Execute(ctx, bookmarkuc.GetBookmarksInput{
		UserID: userID,
	})
	if err != nil {
		h.logger.Error(ctx, "failed to get bookmarks", "error", err, "userID", userID)
		return api.GetUserBookmarks500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to get bookmarks"),
		}, nil
	}

	return api.GetUserBookmarks200JSONResponse(mapper.ToBookmarkedRepositoriesResponse(repos)), nil
}

func (h *Handler) RemoveBookmark(ctx context.Context, request api.RemoveBookmarkRequestObject) (api.RemoveBookmarkResponseObject, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return api.RemoveBookmark401ApplicationProblemPlusJSONResponse{
			UnauthorizedApplicationProblemPlusJSONResponse: api.NewUnauthorized("authentication required"),
		}, nil
	}

	output, err := h.removeBookmark.Execute(ctx, bookmarkuc.RemoveBookmarkInput{
		Owner:  request.Owner,
		Repo:   request.Repo,
		UserID: userID,
	})
	if err != nil {
		if errors.Is(err, domain.ErrCodebaseNotFound) {
			return api.RemoveBookmark404ApplicationProblemPlusJSONResponse{
				NotFoundApplicationProblemPlusJSONResponse: api.NewNotFound("repository not found"),
			}, nil
		}

		h.logger.Error(ctx, "failed to remove bookmark", "error", err, "owner", request.Owner, "repo", request.Repo)
		return api.RemoveBookmark500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to remove bookmark"),
		}, nil
	}

	return api.RemoveBookmark200JSONResponse(mapper.ToBookmarkResponse(output.IsBookmarked)), nil
}

func (h *Handler) GetUserAnalyzedRepositories(
	ctx context.Context,
	request api.GetUserAnalyzedRepositoriesRequestObject,
) (api.GetUserAnalyzedRepositoriesResponseObject, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return api.GetUserAnalyzedRepositories401ApplicationProblemPlusJSONResponse{
			UnauthorizedApplicationProblemPlusJSONResponse: api.NewUnauthorized("authentication required"),
		}, nil
	}

	limit := defaultPageLimit
	if request.Params.Limit != nil && *request.Params.Limit > 0 && *request.Params.Limit <= maxPageLimit {
		limit = *request.Params.Limit
	}

	ownership := entity.OwnershipAll
	if request.Params.Ownership != nil {
		ownership = entity.ParseOwnershipFilter(string(*request.Params.Ownership))
	}

	result, err := h.getAnalyzedRepos.Execute(ctx, historyuc.GetAnalyzedReposInput{
		Cursor:    request.Params.Cursor,
		Limit:     limit,
		Ownership: ownership,
		UserID:    userID,
	})
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCursor) {
			return api.GetUserAnalyzedRepositories400ApplicationProblemPlusJSONResponse{
				BadRequestApplicationProblemPlusJSONResponse: api.NewBadRequest("invalid cursor format"),
			}, nil
		}
		h.logger.Error(ctx, "failed to get analyzed repositories", "error", err, "userID", userID)
		return api.GetUserAnalyzedRepositories500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to retrieve analyzed repositories"),
		}, nil
	}

	return api.GetUserAnalyzedRepositories200JSONResponse(mapper.ToUserAnalyzedRepositoriesResponse(result)), nil
}

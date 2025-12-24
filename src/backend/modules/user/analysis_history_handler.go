package user

import (
	"context"
	"errors"

	cerrors "github.com/cockroachdb/errors"

	"github.com/specvital/web/src/backend/common/logger"
	"github.com/specvital/web/src/backend/common/middleware"
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/user/domain"
	"github.com/specvital/web/src/backend/modules/user/mapper"
)

const (
	defaultPageLimit = 20
	maxPageLimit     = 100
)

type AnalysisHistoryHandler struct {
	logger  *logger.Logger
	service AnalysisHistoryService
}

type AnalysisHistoryHandlerConfig struct {
	Logger  *logger.Logger
	Service AnalysisHistoryService
}

func NewAnalysisHistoryHandler(cfg *AnalysisHistoryHandlerConfig) (*AnalysisHistoryHandler, error) {
	if cfg == nil {
		return nil, cerrors.New("analysis history handler config is required")
	}
	if cfg.Logger == nil {
		return nil, cerrors.New("logger is required")
	}
	if cfg.Service == nil {
		return nil, cerrors.New("service is required")
	}
	return &AnalysisHistoryHandler{
		logger:  cfg.Logger,
		service: cfg.Service,
	}, nil
}

func (h *AnalysisHistoryHandler) GetUserAnalyzedRepositories(
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

	ownership := domain.OwnershipAll
	if request.Params.Ownership != nil {
		ownership = domain.ParseOwnershipFilter(string(*request.Params.Ownership))
	}

	params := domain.AnalyzedReposParams{
		Cursor:    request.Params.Cursor,
		Limit:     limit,
		Ownership: ownership,
	}

	result, err := h.service.GetUserAnalyzedRepositories(ctx, userID, params)
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

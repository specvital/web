package handler

import (
	"context"

	"github.com/cockroachdb/errors"

	"github.com/specvital/web/src/backend/common/logger"
	"github.com/specvital/web/src/backend/common/middleware"
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/subscription/adapter/mapper"
	"github.com/specvital/web/src/backend/modules/subscription/domain"
	"github.com/specvital/web/src/backend/modules/subscription/usecase"
)

type Handler struct {
	getUserSubscription *usecase.GetUserSubscriptionUseCase
	logger              *logger.Logger
}

var _ api.SubscriptionHandlers = (*Handler)(nil)

type HandlerConfig struct {
	GetUserSubscription *usecase.GetUserSubscriptionUseCase
	Logger              *logger.Logger
}

func NewHandler(cfg *HandlerConfig) (*Handler, error) {
	if cfg.GetUserSubscription == nil {
		return nil, errors.New("GetUserSubscription usecase is required")
	}
	if cfg.Logger == nil {
		return nil, errors.New("Logger is required")
	}

	return &Handler{
		getUserSubscription: cfg.GetUserSubscription,
		logger:              cfg.Logger,
	}, nil
}

func (h *Handler) GetUserSubscription(ctx context.Context, _ api.GetUserSubscriptionRequestObject) (api.GetUserSubscriptionResponseObject, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return api.GetUserSubscription401ApplicationProblemPlusJSONResponse{
			UnauthorizedApplicationProblemPlusJSONResponse: api.NewUnauthorized("authentication required"),
		}, nil
	}

	sub, err := h.getUserSubscription.Execute(ctx, userID)
	if err != nil {
		if errors.Is(err, domain.ErrNoActiveSubscription) {
			return api.GetUserSubscription404ApplicationProblemPlusJSONResponse{
				NotFoundApplicationProblemPlusJSONResponse: api.NewNotFound("no active subscription found"),
			}, nil
		}
		h.logger.Error(ctx, "failed to get user subscription", "error", err)
		return api.GetUserSubscription500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to get subscription"),
		}, nil
	}

	return api.GetUserSubscription200JSONResponse(mapper.ToUserSubscriptionResponse(sub)), nil
}

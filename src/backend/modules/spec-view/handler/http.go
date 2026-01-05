package handler

import (
	"context"
	"regexp"

	"github.com/cockroachdb/errors"

	"github.com/specvital/web/src/backend/common/logger"
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/spec-view/adapter/mapper"
	"github.com/specvital/web/src/backend/modules/spec-view/domain"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/entity"
	"github.com/specvital/web/src/backend/modules/spec-view/usecase"
)

var validNamePattern = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)
var validCommitSHAPattern = regexp.MustCompile(`^[a-fA-F0-9]{7,40}$`)

type ConvertSpecViewExecutor interface {
	Execute(ctx context.Context, input usecase.ConvertSpecViewInput) (*usecase.ConvertSpecViewOutput, error)
}

type Handler struct {
	convertSpecView ConvertSpecViewExecutor
	logger          *logger.Logger
}

var _ api.SpecViewHandlers = (*Handler)(nil)

type HandlerConfig struct {
	ConvertSpecView ConvertSpecViewExecutor
	Logger          *logger.Logger
}

func NewHandler(cfg *HandlerConfig) (*Handler, error) {
	if cfg == nil {
		return nil, errors.New("handler config is required")
	}
	if cfg.ConvertSpecView == nil {
		return nil, errors.New("convert spec view usecase is required")
	}
	if cfg.Logger == nil {
		return nil, errors.New("logger is required")
	}

	return &Handler{
		convertSpecView: cfg.ConvertSpecView,
		logger:          cfg.Logger,
	}, nil
}

func (h *Handler) ConvertSpecView(ctx context.Context, request api.ConvertSpecViewRequestObject) (api.ConvertSpecViewResponseObject, error) {
	owner, repo, commitSHA := request.Owner, request.Repo, request.CommitSHA
	log := h.logger.With("owner", owner, "repo", repo, "commitSHA", commitSHA)

	if err := validateOwnerRepo(owner, repo); err != nil {
		return api.ConvertSpecView400ApplicationProblemPlusJSONResponse{
			BadRequestApplicationProblemPlusJSONResponse: api.NewBadRequest(err.Error()),
		}, nil
	}

	if commitSHA == "" || !validCommitSHAPattern.MatchString(commitSHA) {
		return api.ConvertSpecView400ApplicationProblemPlusJSONResponse{
			BadRequestApplicationProblemPlusJSONResponse: api.NewBadRequest("invalid commitSHA format"),
		}, nil
	}

	input := usecase.ConvertSpecViewInput{
		CommitSHA: commitSHA,
		Language:  entity.LanguageEn,
		Owner:     owner,
		Repo:      repo,
	}

	if request.Body != nil {
		if request.Body.Language != nil {
			input.Language = entity.Language(*request.Body.Language)
		}
		if request.Body.IsForceRefresh != nil {
			input.IsForceRefresh = *request.Body.IsForceRefresh
		}
	}

	result, err := h.convertSpecView.Execute(ctx, input)
	if err != nil {
		return h.handleError(ctx, log, err)
	}

	return api.ConvertSpecView200JSONResponse(mapper.ToConvertSpecViewResponse(result)), nil
}

func (h *Handler) handleError(ctx context.Context, log *logger.Logger, err error) (api.ConvertSpecViewResponseObject, error) {
	switch {
	case errors.Is(err, domain.ErrInvalidLanguage):
		return api.ConvertSpecView400ApplicationProblemPlusJSONResponse{
			BadRequestApplicationProblemPlusJSONResponse: api.NewBadRequest("invalid language"),
		}, nil

	case errors.Is(err, domain.ErrAnalysisNotFound):
		return api.ConvertSpecView404ApplicationProblemPlusJSONResponse{
			NotFoundApplicationProblemPlusJSONResponse: api.NewNotFound("analysis not found"),
		}, nil

	case errors.Is(err, domain.ErrCommitMismatch):
		return api.ConvertSpecView404ApplicationProblemPlusJSONResponse{
			NotFoundApplicationProblemPlusJSONResponse: api.NewNotFound("commit SHA mismatch - analysis may have been updated"),
		}, nil

	case errors.Is(err, domain.ErrRateLimited):
		return api.ConvertSpecView429ApplicationProblemPlusJSONResponse{
			TooManyRequestsApplicationProblemPlusJSONResponse: api.NewTooManyRequests("rate limit exceeded"),
		}, nil

	case errors.Is(err, domain.ErrAIProviderUnavailable):
		log.Error(ctx, "AI provider unavailable", "error", err)
		return api.ConvertSpecView500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("AI service temporarily unavailable"),
		}, nil

	case errors.Is(err, domain.ErrConversionFailed):
		log.Error(ctx, "conversion failed", "error", err)
		return api.ConvertSpecView500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("conversion failed"),
		}, nil

	default:
		log.Error(ctx, "unexpected error in ConvertSpecView", "error", err)
		return api.ConvertSpecView500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("internal server error"),
		}, nil
	}
}

func validateOwnerRepo(owner, repo string) error {
	if owner == "" || repo == "" {
		return errors.New("owner and repo are required")
	}
	if !validNamePattern.MatchString(owner) {
		return errors.New("invalid owner format")
	}
	if !validNamePattern.MatchString(repo) {
		return errors.New("invalid repo format")
	}
	return nil
}

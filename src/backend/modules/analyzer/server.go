package analyzer

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"regexp"

	"github.com/cockroachdb/errors"
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/analyzer/domain"
)

var validNamePattern = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

type AnalyzerServer struct {
	service AnalyzerService
}

var _ api.StrictServerInterface = (*AnalyzerServer)(nil)

func NewAnalyzerServer(service AnalyzerService) *AnalyzerServer {
	return &AnalyzerServer{service: service}
}

func (s *AnalyzerServer) AnalyzeRepository(ctx context.Context, request api.AnalyzeRepositoryRequestObject) (api.AnalyzeRepositoryResponseObject, error) {
	owner, repo := request.Owner, request.Repo

	if err := validateOwnerRepo(owner, repo); err != nil {
		return api.AnalyzeRepository400ApplicationProblemPlusJSONResponse{
			BadRequestApplicationProblemPlusJSONResponse: api.NewBadRequest(err.Error()),
		}, nil
	}

	response, statusCode, err := s.service.AnalyzeRepository(ctx, owner, repo)
	if err != nil {
		slog.Error("service error in AnalyzeRepository", "owner", owner, "repo", repo, "error", err)
		return api.AnalyzeRepository500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to process analysis request"),
		}, nil
	}

	switch statusCode {
	case http.StatusOK:
		completed, err := response.AsCompletedResponse()
		if err != nil {
			slog.Error("failed to unmarshal completed response", "owner", owner, "repo", repo, "error", err)
			return api.AnalyzeRepository500ApplicationProblemPlusJSONResponse{
				InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to process response"),
			}, nil
		}
		return api.AnalyzeRepository200JSONResponse(completed), nil

	case http.StatusAccepted:
		return newAnalyze202Response(response)

	default:
		return api.AnalyzeRepository500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("unexpected status code from service"),
		}, nil
	}
}

func (s *AnalyzerServer) GetAnalysisStatus(ctx context.Context, request api.GetAnalysisStatusRequestObject) (api.GetAnalysisStatusResponseObject, error) {
	owner, repo := request.Owner, request.Repo

	if err := validateOwnerRepo(owner, repo); err != nil {
		return api.GetAnalysisStatus400ApplicationProblemPlusJSONResponse{
			BadRequestApplicationProblemPlusJSONResponse: api.NewBadRequest(err.Error()),
		}, nil
	}

	response, statusCode, err := s.service.GetAnalysisStatus(ctx, owner, repo)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return api.GetAnalysisStatus404ApplicationProblemPlusJSONResponse{
				NotFoundApplicationProblemPlusJSONResponse: api.NewNotFound("analysis not found"),
			}, nil
		}
		slog.Error("service error in GetAnalysisStatus", "owner", owner, "repo", repo, "error", err)
		return api.GetAnalysisStatus500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to get analysis status"),
		}, nil
	}

	switch statusCode {
	case http.StatusOK, http.StatusAccepted:
		return newStatus200Response(response)

	default:
		return api.GetAnalysisStatus500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("unexpected status code from service"),
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

// Union response helpers for discriminated union handling.
// The generated StrictServerInterface doesn't directly support union types,
// so we marshal to raw JSON and write using the Visitor pattern.

type analyze202Response struct {
	union json.RawMessage
}

func newAnalyze202Response(response api.AnalysisResponse) (api.AnalyzeRepositoryResponseObject, error) {
	data, err := json.Marshal(response)
	if err != nil {
		return nil, err
	}
	return analyze202Response{union: data}, nil
}

func (r analyze202Response) VisitAnalyzeRepositoryResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_, err := w.Write(r.union)
	return err
}

type status200Response struct {
	union json.RawMessage
}

func newStatus200Response(response api.AnalysisResponse) (api.GetAnalysisStatusResponseObject, error) {
	data, err := json.Marshal(response)
	if err != nil {
		return nil, err
	}
	return status200Response{union: data}, nil
}

func (r status200Response) VisitGetAnalysisStatusResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, err := w.Write(r.union)
	return err
}

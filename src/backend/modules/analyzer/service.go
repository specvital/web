package analyzer

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"sort"
	"time"

	"github.com/cockroachdb/errors"
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/analyzer/domain"
)

const dbTimeout = 5 * time.Second

type AnalyzerService interface {
	AnalyzeRepository(ctx context.Context, owner, repo string) (api.AnalysisResponse, int, error)
	GetAnalysisStatus(ctx context.Context, owner, repo string) (api.AnalysisResponse, int, error)
}

type analyzerService struct {
	queue QueueService
	repo  Repository
}

func NewAnalyzerService(repo Repository, queue QueueService) AnalyzerService {
	return &analyzerService{
		queue: queue,
		repo:  repo,
	}
}

func (s *analyzerService) AnalyzeRepository(ctx context.Context, owner, repo string) (api.AnalysisResponse, int, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	analysis, err := s.repo.GetLatestCompletedAnalysis(ctx, owner, repo)
	if err == nil {
		response, buildErr := s.buildCompletedResponse(ctx, analysis)
		if buildErr != nil {
			slog.Error("failed to build analysis result", "owner", owner, "repo", repo, "error", buildErr)
			return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to build analysis result: %w", buildErr)
		}
		return response, http.StatusOK, nil
	}

	if !errors.Is(err, domain.ErrNotFound) {
		slog.Error("failed to get analysis", "owner", owner, "repo", repo, "error", err)
		return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to get analysis: %w", err)
	}

	status, err := s.repo.GetAnalysisStatus(ctx, owner, repo)
	if err == nil {
		response, buildErr := s.buildStatusResponse(status)
		if buildErr != nil {
			slog.Error("failed to build status response", "owner", owner, "repo", repo, "error", buildErr)
			return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to build status response: %w", buildErr)
		}
		return response, http.StatusAccepted, nil
	}

	if !errors.Is(err, domain.ErrNotFound) {
		slog.Error("failed to get status", "owner", owner, "repo", repo, "error", err)
		return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to get status: %w", err)
	}

	analysisID, err := s.repo.CreatePendingAnalysis(ctx, owner, repo)
	if err != nil {
		slog.Error("failed to create analysis", "owner", owner, "repo", repo, "error", err)
		return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to create analysis: %w", err)
	}

	if err := s.queue.Enqueue(ctx, analysisID, owner, repo); err != nil {
		slog.Error("failed to enqueue", "owner", owner, "repo", repo, "analysisId", analysisID, "error", err)
		if cleanupErr := s.repo.MarkAnalysisFailed(ctx, analysisID, "queue registration failed"); cleanupErr != nil {
			slog.Error("failed to cleanup after enqueue error", "analysisId", analysisID, "error", cleanupErr)
		}
		return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to queue analysis: %w", err)
	}

	var response api.AnalysisResponse
	if err := response.FromQueuedResponse(api.QueuedResponse{}); err != nil {
		slog.Error("failed to marshal queued response", "owner", owner, "repo", repo, "error", err)
		return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to marshal response: %w", err)
	}
	return response, http.StatusAccepted, nil
}

func (s *analyzerService) GetAnalysisStatus(ctx context.Context, owner, repo string) (api.AnalysisResponse, int, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeout)
	defer cancel()

	analysis, err := s.repo.GetLatestCompletedAnalysis(ctx, owner, repo)
	if err == nil {
		response, buildErr := s.buildCompletedResponse(ctx, analysis)
		if buildErr != nil {
			slog.Error("failed to build analysis result", "owner", owner, "repo", repo, "error", buildErr)
			return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to build analysis result: %w", buildErr)
		}
		return response, http.StatusOK, nil
	}

	if !errors.Is(err, domain.ErrNotFound) {
		slog.Error("failed to get analysis", "owner", owner, "repo", repo, "error", err)
		return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to get analysis: %w", err)
	}

	status, err := s.repo.GetAnalysisStatus(ctx, owner, repo)
	if err == nil {
		httpStatus := http.StatusOK
		if status.Status != "completed" {
			httpStatus = http.StatusAccepted
		}
		response, buildErr := s.buildStatusResponse(status)
		if buildErr != nil {
			slog.Error("failed to build status response", "owner", owner, "repo", repo, "error", buildErr)
			return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to build status response: %w", buildErr)
		}
		return response, httpStatus, nil
	}

	if errors.Is(err, domain.ErrNotFound) {
		return api.AnalysisResponse{}, http.StatusNotFound, domain.ErrNotFound
	}

	slog.Error("failed to get status", "owner", owner, "repo", repo, "error", err)
	return api.AnalysisResponse{}, http.StatusInternalServerError, fmt.Errorf("failed to get status: %w", err)
}

func (s *analyzerService) buildCompletedResponse(ctx context.Context, analysis *CompletedAnalysis) (api.AnalysisResponse, error) {
	suitesWithCases, err := s.repo.GetTestSuitesWithCases(ctx, analysis.ID)
	if err != nil {
		return api.AnalysisResponse{}, fmt.Errorf("get test suites: %w", err)
	}

	suites := make([]api.TestSuite, len(suitesWithCases))
	frameworkStats := make(map[string]*api.FrameworkSummary)

	for i, suite := range suitesWithCases {
		tests := make([]api.TestCase, len(suite.Tests))
		for j, t := range suite.Tests {
			tests[j] = api.TestCase{
				FilePath:  suite.FilePath,
				Framework: suite.Framework,
				Line:      t.Line,
				Name:      t.Name,
				Status:    mapToAPITestStatus(t.Status),
			}

			if _, ok := frameworkStats[suite.Framework]; !ok {
				frameworkStats[suite.Framework] = &api.FrameworkSummary{
					Framework: suite.Framework,
				}
			}
			fs := frameworkStats[suite.Framework]
			fs.Total++
			switch api.TestStatus(t.Status) {
			case api.Active:
				fs.Active++
			case api.Focused:
				fs.Focused++
			case api.Skipped:
				fs.Skipped++
			case api.Todo:
				fs.Todo++
			case api.Xfail:
				fs.Xfail++
			}
		}

		suites[i] = api.TestSuite{
			FilePath:  suite.FilePath,
			Framework: suite.Framework,
			Tests:     tests,
		}
	}

	frameworks := make([]api.FrameworkSummary, 0, len(frameworkStats))
	var totalActive, totalFocused, totalSkipped, totalTodo, totalXfail int
	for _, fs := range frameworkStats {
		frameworks = append(frameworks, *fs)
		totalActive += fs.Active
		totalFocused += fs.Focused
		totalSkipped += fs.Skipped
		totalTodo += fs.Todo
		totalXfail += fs.Xfail
	}

	// Sort frameworks by name for deterministic ordering
	sort.Slice(frameworks, func(i, j int) bool {
		return frameworks[i].Framework < frameworks[j].Framework
	})

	result := api.AnalysisResult{
		AnalyzedAt: analysis.CompletedAt,
		CommitSHA:  analysis.CommitSHA,
		Owner:      analysis.Owner,
		Repo:       analysis.Repo,
		Suites:     suites,
		Summary: api.Summary{
			Active:     totalActive,
			Focused:    totalFocused,
			Frameworks: frameworks,
			Skipped:    totalSkipped,
			Todo:       totalTodo,
			Total:      analysis.TotalTests,
			Xfail:      totalXfail,
		},
	}

	var response api.AnalysisResponse
	if err := response.FromCompletedResponse(api.CompletedResponse{Data: result}); err != nil {
		return api.AnalysisResponse{}, fmt.Errorf("marshal completed response: %w", err)
	}

	return response, nil
}

func (s *analyzerService) buildStatusResponse(status *AnalysisStatus) (api.AnalysisResponse, error) {
	var response api.AnalysisResponse
	var err error

	switch status.Status {
	case "completed":
		err = response.FromCompletedResponse(api.CompletedResponse{})
	case "running":
		err = response.FromAnalyzingResponse(api.AnalyzingResponse{})
	case "pending":
		err = response.FromQueuedResponse(api.QueuedResponse{})
	case "failed":
		errorMsg := "analysis failed"
		if status.ErrorMessage != nil {
			errorMsg = *status.ErrorMessage
		}
		err = response.FromFailedResponse(api.FailedResponse{
			Error: errorMsg,
		})
	default:
		slog.Warn("unknown analysis status, treating as failed", "status", status.Status)
		err = response.FromFailedResponse(api.FailedResponse{
			Error: "unknown status",
		})
	}

	if err != nil {
		return api.AnalysisResponse{}, fmt.Errorf("marshal status response: %w", err)
	}

	return response, nil
}

func mapToAPITestStatus(status string) api.TestStatus {
	switch status {
	case "active":
		return api.Active
	case "focused":
		return api.Focused
	case "skipped":
		return api.Skipped
	case "todo":
		return api.Todo
	case "xfail":
		return api.Xfail
	default:
		return api.Active
	}
}

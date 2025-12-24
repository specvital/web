package user

import (
	"context"
	"errors"
	"fmt"

	"github.com/specvital/web/src/backend/modules/user/domain"
)

type AnalysisHistoryService interface {
	GetUserAnalyzedRepositories(ctx context.Context, userID string, params domain.AnalyzedReposParams) (*domain.AnalyzedReposResult, error)
}

type analysisHistoryServiceImpl struct {
	repo AnalysisHistoryRepository
}

func NewAnalysisHistoryService(repo AnalysisHistoryRepository) AnalysisHistoryService {
	if repo == nil {
		panic("analysis history repository is required")
	}
	return &analysisHistoryServiceImpl{repo: repo}
}

func (s *analysisHistoryServiceImpl) GetUserAnalyzedRepositories(
	ctx context.Context,
	userID string,
	params domain.AnalyzedReposParams,
) (*domain.AnalyzedReposResult, error) {
	fetchLimit := params.Limit + 1
	fetchParams := domain.AnalyzedReposParams{
		Cursor:    params.Cursor,
		Limit:     fetchLimit,
		Ownership: params.Ownership,
	}

	repos, err := s.repo.GetUserAnalyzedRepositories(ctx, userID, fetchParams)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCursor) {
			return nil, err
		}
		return nil, fmt.Errorf("get user analyzed repositories: %w", err)
	}

	var nextCursor *string
	hasNext := false

	if len(repos) > params.Limit {
		hasNext = true
		repos = repos[:params.Limit]
		lastRepo := repos[len(repos)-1]
		cursorValue, err := domain.EncodeCursor(lastRepo.UpdatedAt, lastRepo.HistoryID)
		if err != nil {
			return nil, fmt.Errorf("encode cursor: %w", err)
		}
		nextCursor = &cursorValue
	}

	return &domain.AnalyzedReposResult{
		Data:       repos,
		HasNext:    hasNext,
		NextCursor: nextCursor,
	}, nil
}

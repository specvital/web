package port

import (
	"context"

	"github.com/specvital/web/src/backend/modules/user/domain/entity"
)

type AnalyzedReposParams struct {
	Cursor    *entity.CursorData
	Limit     int
	Ownership entity.OwnershipFilter
}

type AnalysisHistoryRepository interface {
	GetUserAnalyzedRepositories(ctx context.Context, userID string, params AnalyzedReposParams) ([]*entity.AnalyzedRepository, error)
}

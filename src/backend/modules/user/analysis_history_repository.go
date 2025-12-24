package user

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/specvital/web/src/backend/internal/db"
	"github.com/specvital/web/src/backend/modules/user/domain"
)

type AnalysisHistoryRepository interface {
	GetUserAnalyzedRepositories(ctx context.Context, userID string, params domain.AnalyzedReposParams) ([]*domain.AnalyzedRepository, error)
}

type analysisHistoryRepositoryImpl struct {
	queries *db.Queries
}

func NewAnalysisHistoryRepository(queries *db.Queries) AnalysisHistoryRepository {
	return &analysisHistoryRepositoryImpl{queries: queries}
}

func (r *analysisHistoryRepositoryImpl) GetUserAnalyzedRepositories(
	ctx context.Context,
	userID string,
	params domain.AnalyzedReposParams,
) ([]*domain.AnalyzedRepository, error) {
	userUUID, err := stringToUUID(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user ID: %w", err)
	}

	var cursorTime pgtype.Timestamptz
	var cursorID pgtype.UUID

	if params.Cursor != nil {
		cursor, err := domain.DecodeCursor(*params.Cursor)
		if err != nil {
			return nil, err
		}
		cursorTime = pgtype.Timestamptz{Time: cursor.Time, Valid: true}
		cursorID, err = stringToUUID(cursor.ID)
		if err != nil {
			return nil, domain.ErrInvalidCursor
		}
	}

	dbParams := db.GetUserAnalyzedRepositoriesParams{
		UserID:     userUUID,
		CursorTime: cursorTime,
		CursorID:   cursorID,
		Ownership:  string(params.Ownership),
		PageLimit:  int32(params.Limit),
	}

	rows, err := r.queries.GetUserAnalyzedRepositories(ctx, dbParams)
	if err != nil {
		return nil, fmt.Errorf("query analyzed repositories: %w", err)
	}

	return mapAnalyzedRepositoriesFromDB(rows), nil
}

func mapAnalyzedRepositoriesFromDB(rows []db.GetUserAnalyzedRepositoriesRow) []*domain.AnalyzedRepository {
	result := make([]*domain.AnalyzedRepository, 0, len(rows))

	for _, row := range rows {
		repo := &domain.AnalyzedRepository{
			CodebaseID: uuidToString(row.CodebaseID),
			CommitSHA:  row.CommitSha,
			HistoryID:  uuidToString(row.HistoryID),
			Name:       row.Name,
			Owner:      row.Owner,
			TotalTests: int(row.TotalTests),
			UpdatedAt:  row.UpdatedAt.Time,
		}

		if row.CompletedAt.Valid {
			repo.CompletedAt = row.CompletedAt.Time
		}

		result = append(result, repo)
	}

	return result
}

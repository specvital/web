package adapter

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/specvital/web/src/backend/internal/db"
	"github.com/specvital/web/src/backend/modules/user"
	"github.com/specvital/web/src/backend/modules/user/domain/entity"
	"github.com/specvital/web/src/backend/modules/user/domain/port"
)

type HistoryRepositoryPostgres struct {
	queries *db.Queries
}

var _ port.AnalysisHistoryRepository = (*HistoryRepositoryPostgres)(nil)

func NewHistoryRepository(queries *db.Queries) *HistoryRepositoryPostgres {
	return &HistoryRepositoryPostgres{queries: queries}
}

func (r *HistoryRepositoryPostgres) GetUserAnalyzedRepositories(
	ctx context.Context,
	userID string,
	params port.AnalyzedReposParams,
) ([]*entity.AnalyzedRepository, error) {
	userUUID, err := stringToUUID(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user ID: %w", err)
	}

	var cursorTime pgtype.Timestamptz
	var cursorID pgtype.UUID

	if params.Cursor != nil {
		cursorTime = pgtype.Timestamptz{Time: params.Cursor.Time, Valid: true}
		cursorID, err = stringToUUID(params.Cursor.ID)
		if err != nil {
			return nil, user.ErrInvalidCursor
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

func mapAnalyzedRepositoriesFromDB(rows []db.GetUserAnalyzedRepositoriesRow) []*entity.AnalyzedRepository {
	result := make([]*entity.AnalyzedRepository, 0, len(rows))

	for _, row := range rows {
		repo := &entity.AnalyzedRepository{
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

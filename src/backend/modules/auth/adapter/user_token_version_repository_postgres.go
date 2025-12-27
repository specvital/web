package adapter

import (
	"context"
	"fmt"

	"github.com/cockroachdb/errors"
	"github.com/jackc/pgx/v5"

	"github.com/specvital/web/src/backend/internal/db"
	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/domain/port"
)

type UserTokenVersionPostgresRepository struct {
	queries *db.Queries
}

var _ port.UserTokenVersionRepository = (*UserTokenVersionPostgresRepository)(nil)

func NewUserTokenVersionPostgresRepository(queries *db.Queries) *UserTokenVersionPostgresRepository {
	if queries == nil {
		panic("queries is required")
	}
	return &UserTokenVersionPostgresRepository{queries: queries}
}

func (r *UserTokenVersionPostgresRepository) GetTokenVersion(ctx context.Context, userID string) (int32, error) {
	uuid, err := stringToUUID(userID)
	if err != nil {
		return 0, fmt.Errorf("parse user ID: %w", err)
	}

	version, err := r.queries.GetUserTokenVersion(ctx, uuid)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, domain.ErrUserNotFound
		}
		return 0, fmt.Errorf("get user token version: %w", err)
	}

	return version, nil
}

func (r *UserTokenVersionPostgresRepository) IncrementTokenVersion(ctx context.Context, userID string) error {
	uuid, err := stringToUUID(userID)
	if err != nil {
		return fmt.Errorf("parse user ID: %w", err)
	}

	rowsAffected, err := r.queries.IncrementUserTokenVersion(ctx, uuid)
	if err != nil {
		return fmt.Errorf("increment user token version: %w", err)
	}
	if rowsAffected == 0 {
		return domain.ErrUserNotFound
	}

	return nil
}

package adapter

import (
	"context"
	"fmt"

	"github.com/cockroachdb/errors"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/specvital/web/src/backend/internal/db"
	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/domain/entity"
	"github.com/specvital/web/src/backend/modules/auth/domain/port"
)

type RefreshTokenPostgresRepository struct {
	queries *db.Queries
}

var _ port.RefreshTokenRepository = (*RefreshTokenPostgresRepository)(nil)

func NewRefreshTokenPostgresRepository(queries *db.Queries) *RefreshTokenPostgresRepository {
	if queries == nil {
		panic("queries is required")
	}
	return &RefreshTokenPostgresRepository{queries: queries}
}

func (r *RefreshTokenPostgresRepository) Create(ctx context.Context, token *entity.RefreshToken) (string, error) {
	if token == nil {
		return "", errors.New("token is required")
	}
	if token.TokenHash == "" {
		return "", errors.New("token hash is required")
	}
	if token.UserID == "" {
		return "", errors.New("user ID is required")
	}
	if token.FamilyID == "" {
		return "", errors.New("family ID is required")
	}

	userUUID, err := stringToUUID(token.UserID)
	if err != nil {
		return "", fmt.Errorf("parse user ID: %w", err)
	}

	familyUUID, err := stringToUUID(token.FamilyID)
	if err != nil {
		return "", fmt.Errorf("parse family ID: %w", err)
	}

	params := db.CreateRefreshTokenParams{
		UserID:    userUUID,
		TokenHash: token.TokenHash,
		FamilyID:  familyUUID,
		ExpiresAt: pgtype.Timestamptz{Time: token.ExpiresAt, Valid: true},
	}

	if token.Replaces != nil {
		replacesUUID, err := stringToUUID(*token.Replaces)
		if err != nil {
			return "", fmt.Errorf("parse replaces ID: %w", err)
		}
		params.Replaces = replacesUUID
	}

	row, err := r.queries.CreateRefreshToken(ctx, params)
	if err != nil {
		return "", fmt.Errorf("create refresh token: %w", err)
	}

	return uuidToString(row.ID), nil
}

func (r *RefreshTokenPostgresRepository) GetByHash(ctx context.Context, tokenHash string) (*entity.RefreshToken, error) {
	row, err := r.queries.GetRefreshTokenByHash(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrRefreshTokenNotFound
		}
		return nil, fmt.Errorf("get refresh token by hash: %w", err)
	}

	return mapRefreshTokenFromDB(&row), nil
}

func (r *RefreshTokenPostgresRepository) Revoke(ctx context.Context, id string) error {
	uuid, err := stringToUUID(id)
	if err != nil {
		return fmt.Errorf("parse token ID: %w", err)
	}

	rowsAffected, err := r.queries.RevokeRefreshToken(ctx, uuid)
	if err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}
	if rowsAffected == 0 {
		return domain.ErrRefreshTokenNotFound
	}

	return nil
}

func (r *RefreshTokenPostgresRepository) RevokeFamily(ctx context.Context, familyID string) error {
	uuid, err := stringToUUID(familyID)
	if err != nil {
		return fmt.Errorf("parse family ID: %w", err)
	}

	if err := r.queries.RevokeRefreshTokenFamily(ctx, uuid); err != nil {
		return fmt.Errorf("revoke refresh token family: %w", err)
	}

	return nil
}

func (r *RefreshTokenPostgresRepository) RevokeUserTokens(ctx context.Context, userID string) error {
	uuid, err := stringToUUID(userID)
	if err != nil {
		return fmt.Errorf("parse user ID: %w", err)
	}

	if err := r.queries.RevokeUserRefreshTokens(ctx, uuid); err != nil {
		return fmt.Errorf("revoke user refresh tokens: %w", err)
	}

	return nil
}

func mapRefreshTokenFromDB(row *db.RefreshToken) *entity.RefreshToken {
	token := &entity.RefreshToken{
		CreatedAt: row.CreatedAt.Time,
		ExpiresAt: row.ExpiresAt.Time,
		FamilyID:  uuidToString(row.FamilyID),
		ID:        uuidToString(row.ID),
		TokenHash: row.TokenHash,
		UserID:    uuidToString(row.UserID),
	}

	if row.RevokedAt.Valid {
		t := row.RevokedAt.Time
		token.RevokedAt = &t
	}
	if row.Replaces.Valid {
		s := uuidToString(row.Replaces)
		token.Replaces = &s
	}

	return token
}

package github

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/specvital/web/src/backend/internal/db"
	"github.com/specvital/web/src/backend/modules/github/domain"
)

type Repository interface {
	// User personal repositories
	DeleteUserRepositories(ctx context.Context, userID string) error
	GetUserRepositories(ctx context.Context, userID string) ([]domain.Repository, error)
	HasUserRepositories(ctx context.Context, userID string) (bool, error)
	UpsertUserRepositories(ctx context.Context, userID string, repos []domain.Repository) error

	// Organization repositories
	DeleteOrgRepositories(ctx context.Context, userID string, orgID pgtype.UUID) error
	GetOrgRepositories(ctx context.Context, userID string, orgID pgtype.UUID) ([]domain.Repository, error)
	HasOrgRepositories(ctx context.Context, userID string, orgID pgtype.UUID) (bool, error)
	UpsertOrgRepositories(ctx context.Context, userID string, orgID pgtype.UUID, repos []domain.Repository) error

	// Organizations
	DeleteUserOrganizations(ctx context.Context, userID string) error
	GetOrgIDByLogin(ctx context.Context, login string) (pgtype.UUID, error)
	GetUserOrganizations(ctx context.Context, userID string) ([]domain.Organization, error)
	HasUserOrganizations(ctx context.Context, userID string) (bool, error)
	UpsertUserOrganizations(ctx context.Context, userID string, orgs []domain.Organization) error
}

type repositoryImpl struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewRepository(pool *pgxpool.Pool, queries *db.Queries) Repository {
	return &repositoryImpl{pool: pool, queries: queries}
}

// =============================================================================
// User Personal Repositories
// =============================================================================

func (r *repositoryImpl) GetUserRepositories(ctx context.Context, userID string) ([]domain.Repository, error) {
	uid, err := parseUUID(userID)
	if err != nil {
		return nil, err
	}

	rows, err := r.queries.GetUserGitHubRepositories(ctx, uid)
	if err != nil {
		return nil, err
	}

	repos := make([]domain.Repository, len(rows))
	for i, row := range rows {
		repos[i] = mapUserRepoRowToRepository(row)
	}
	return repos, nil
}

func (r *repositoryImpl) HasUserRepositories(ctx context.Context, userID string) (bool, error) {
	uid, err := parseUUID(userID)
	if err != nil {
		return false, err
	}
	return r.queries.HasUserGitHubRepositories(ctx, uid)
}

func (r *repositoryImpl) UpsertUserRepositories(ctx context.Context, userID string, repos []domain.Repository) error {
	if len(repos) == 0 {
		return nil
	}

	uid, err := parseUUID(userID)
	if err != nil {
		return err
	}

	return r.withTx(ctx, func(qtx *db.Queries) error {
		for _, repo := range repos {
			params := db.UpsertUserGitHubRepositoryParams{
				UserID:          uid,
				GithubRepoID:    repo.ID,
				Name:            repo.Name,
				FullName:        repo.FullName,
				HtmlUrl:         repo.HTMLURL,
				Description:     toPgText(repo.Description),
				DefaultBranch:   toPgText(repo.DefaultBranch),
				Language:        toPgText(repo.Language),
				Visibility:      repo.Visibility,
				IsPrivate:       repo.Private,
				Archived:        repo.Archived,
				Disabled:        repo.Disabled,
				Fork:            repo.Fork,
				StargazersCount: int32(repo.StarCount),
				PushedAt:        toPgTimestamptz(repo.PushedAt),
			}
			if err := qtx.UpsertUserGitHubRepository(ctx, params); err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *repositoryImpl) DeleteUserRepositories(ctx context.Context, userID string) error {
	uid, err := parseUUID(userID)
	if err != nil {
		return err
	}
	return r.queries.DeleteUserGitHubRepositories(ctx, uid)
}

// =============================================================================
// Organization Repositories
// =============================================================================

func (r *repositoryImpl) GetOrgRepositories(ctx context.Context, userID string, orgID pgtype.UUID) ([]domain.Repository, error) {
	uid, err := parseUUID(userID)
	if err != nil {
		return nil, err
	}

	rows, err := r.queries.GetOrgGitHubRepositories(ctx, db.GetOrgGitHubRepositoriesParams{
		UserID: uid,
		OrgID:  orgID,
	})
	if err != nil {
		return nil, err
	}

	repos := make([]domain.Repository, len(rows))
	for i, row := range rows {
		repos[i] = mapOrgRepoRowToRepository(row)
	}
	return repos, nil
}

func (r *repositoryImpl) HasOrgRepositories(ctx context.Context, userID string, orgID pgtype.UUID) (bool, error) {
	uid, err := parseUUID(userID)
	if err != nil {
		return false, err
	}
	return r.queries.HasOrgGitHubRepositories(ctx, db.HasOrgGitHubRepositoriesParams{
		UserID: uid,
		OrgID:  orgID,
	})
}

func (r *repositoryImpl) UpsertOrgRepositories(ctx context.Context, userID string, orgID pgtype.UUID, repos []domain.Repository) error {
	if len(repos) == 0 {
		return nil
	}

	uid, err := parseUUID(userID)
	if err != nil {
		return err
	}

	return r.withTx(ctx, func(qtx *db.Queries) error {
		for _, repo := range repos {
			params := db.UpsertOrgGitHubRepositoryParams{
				UserID:          uid,
				GithubRepoID:    repo.ID,
				Name:            repo.Name,
				FullName:        repo.FullName,
				HtmlUrl:         repo.HTMLURL,
				Description:     toPgText(repo.Description),
				DefaultBranch:   toPgText(repo.DefaultBranch),
				Language:        toPgText(repo.Language),
				Visibility:      repo.Visibility,
				IsPrivate:       repo.Private,
				Archived:        repo.Archived,
				Disabled:        repo.Disabled,
				Fork:            repo.Fork,
				StargazersCount: int32(repo.StarCount),
				PushedAt:        toPgTimestamptz(repo.PushedAt),
				OrgID:           orgID,
			}
			if err := qtx.UpsertOrgGitHubRepository(ctx, params); err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *repositoryImpl) DeleteOrgRepositories(ctx context.Context, userID string, orgID pgtype.UUID) error {
	uid, err := parseUUID(userID)
	if err != nil {
		return err
	}
	return r.queries.DeleteOrgGitHubRepositories(ctx, db.DeleteOrgGitHubRepositoriesParams{
		UserID: uid,
		OrgID:  orgID,
	})
}

// =============================================================================
// Organizations
// =============================================================================

func (r *repositoryImpl) GetUserOrganizations(ctx context.Context, userID string) ([]domain.Organization, error) {
	uid, err := parseUUID(userID)
	if err != nil {
		return nil, err
	}

	rows, err := r.queries.GetUserGitHubOrganizations(ctx, uid)
	if err != nil {
		return nil, err
	}

	orgs := make([]domain.Organization, len(rows))
	for i, row := range rows {
		orgs[i] = mapRowToOrganization(row)
	}
	return orgs, nil
}

func (r *repositoryImpl) HasUserOrganizations(ctx context.Context, userID string) (bool, error) {
	uid, err := parseUUID(userID)
	if err != nil {
		return false, err
	}
	return r.queries.HasUserOrgMemberships(ctx, uid)
}

func (r *repositoryImpl) UpsertUserOrganizations(ctx context.Context, userID string, orgs []domain.Organization) error {
	if len(orgs) == 0 {
		return nil
	}

	uid, err := parseUUID(userID)
	if err != nil {
		return err
	}

	return r.withTx(ctx, func(qtx *db.Queries) error {
		for _, org := range orgs {
			orgID, err := qtx.UpsertGitHubOrganization(ctx, db.UpsertGitHubOrganizationParams{
				GithubOrgID: org.ID,
				Login:       org.Login,
				AvatarUrl:   toPgText(org.AvatarURL),
				HtmlUrl:     toPgText(org.HTMLURL),
				Description: toPgText(org.Description),
			})
			if err != nil {
				return err
			}

			if err := qtx.UpsertUserOrgMembership(ctx, db.UpsertUserOrgMembershipParams{
				UserID: uid,
				OrgID:  orgID,
				Role:   toPgText(org.Role),
			}); err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *repositoryImpl) DeleteUserOrganizations(ctx context.Context, userID string) error {
	uid, err := parseUUID(userID)
	if err != nil {
		return err
	}
	return r.queries.DeleteUserOrgMemberships(ctx, uid)
}

func (r *repositoryImpl) GetOrgIDByLogin(ctx context.Context, login string) (pgtype.UUID, error) {
	row, err := r.queries.GetGitHubOrganizationByLogin(ctx, login)
	if err != nil {
		return pgtype.UUID{}, err
	}
	return row.ID, nil
}

// =============================================================================
// Helpers
// =============================================================================

func (r *repositoryImpl) withTx(ctx context.Context, fn func(*db.Queries) error) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := fn(r.queries.WithTx(tx)); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func parseUUID(s string) (pgtype.UUID, error) {
	u, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	return pgtype.UUID{Bytes: u, Valid: true}, nil
}

func toPgText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}

func toPgTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}

type repoRowFields struct {
	Archived        bool
	DefaultBranch   pgtype.Text
	Description     pgtype.Text
	Disabled        bool
	Fork            bool
	FullName        string
	GithubRepoID    int64
	HtmlUrl         string
	IsPrivate       bool
	Language        pgtype.Text
	Name            string
	PushedAt        pgtype.Timestamptz
	StargazersCount int32
	Visibility      string
}

func mapRepoRowFieldsToRepository(f repoRowFields) domain.Repository {
	repo := domain.Repository{
		Archived:   f.Archived,
		Disabled:   f.Disabled,
		Fork:       f.Fork,
		FullName:   f.FullName,
		HTMLURL:    f.HtmlUrl,
		ID:         f.GithubRepoID,
		Name:       f.Name,
		Owner:      extractOwnerFromFullName(f.FullName),
		Private:    f.IsPrivate,
		StarCount:  int(f.StargazersCount),
		Visibility: f.Visibility,
	}

	if f.DefaultBranch.Valid {
		repo.DefaultBranch = f.DefaultBranch.String
	}
	if f.Description.Valid {
		repo.Description = f.Description.String
	}
	if f.Language.Valid {
		repo.Language = f.Language.String
	}
	if f.PushedAt.Valid {
		t := f.PushedAt.Time
		repo.PushedAt = &t
	}

	return repo
}

func mapUserRepoRowToRepository(row db.GetUserGitHubRepositoriesRow) domain.Repository {
	return mapRepoRowFieldsToRepository(repoRowFields{
		Archived:        row.Archived,
		DefaultBranch:   row.DefaultBranch,
		Description:     row.Description,
		Disabled:        row.Disabled,
		Fork:            row.Fork,
		FullName:        row.FullName,
		GithubRepoID:    row.GithubRepoID,
		HtmlUrl:         row.HtmlUrl,
		IsPrivate:       row.IsPrivate,
		Language:        row.Language,
		Name:            row.Name,
		PushedAt:        row.PushedAt,
		StargazersCount: row.StargazersCount,
		Visibility:      row.Visibility,
	})
}

func mapOrgRepoRowToRepository(row db.GetOrgGitHubRepositoriesRow) domain.Repository {
	return mapRepoRowFieldsToRepository(repoRowFields{
		Archived:        row.Archived,
		DefaultBranch:   row.DefaultBranch,
		Description:     row.Description,
		Disabled:        row.Disabled,
		Fork:            row.Fork,
		FullName:        row.FullName,
		GithubRepoID:    row.GithubRepoID,
		HtmlUrl:         row.HtmlUrl,
		IsPrivate:       row.IsPrivate,
		Language:        row.Language,
		Name:            row.Name,
		PushedAt:        row.PushedAt,
		StargazersCount: row.StargazersCount,
		Visibility:      row.Visibility,
	})
}

func extractOwnerFromFullName(fullName string) string {
	if parts := strings.SplitN(fullName, "/", 2); len(parts) == 2 {
		return parts[0]
	}
	return ""
}

func mapRowToOrganization(row db.GetUserGitHubOrganizationsRow) domain.Organization {
	org := domain.Organization{
		ID:    row.GithubOrgID,
		Login: row.Login,
		OrgID: row.OrgID,
	}

	if row.AvatarUrl.Valid {
		org.AvatarURL = row.AvatarUrl.String
	}
	if row.HtmlUrl.Valid {
		org.HTMLURL = row.HtmlUrl.String
	}
	if row.Description.Valid {
		org.Description = row.Description.String
	}
	if row.Role.Valid {
		org.Role = row.Role.String
	}

	return org
}

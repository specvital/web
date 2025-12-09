package analyzer

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/specvital/web/src/backend/internal/db"
)

const (
	HostGitHub = "github.com"
)

var (
	ErrNotFound = errors.New("analysis not found")
)

type Repository interface {
	GetLatestCompletedAnalysis(ctx context.Context, owner, repo string) (*CompletedAnalysis, error)
	GetAnalysisStatus(ctx context.Context, owner, repo string) (*AnalysisStatus, error)
}

type CompletedAnalysis struct {
	ID          string
	Owner       string
	Repo        string
	CommitSHA   string
	CompletedAt time.Time
	TotalSuites int
	TotalTests  int
}

type AnalysisStatus struct {
	ID           string
	Status       string
	ErrorMessage *string
	CreatedAt    time.Time
	CompletedAt  *time.Time
}

type repositoryImpl struct {
	queries *db.Queries
}

func NewRepository(queries *db.Queries) Repository {
	return &repositoryImpl{queries: queries}
}

func (r *repositoryImpl) GetLatestCompletedAnalysis(ctx context.Context, owner, repo string) (*CompletedAnalysis, error) {
	row, err := r.queries.GetLatestCompletedAnalysis(ctx, db.GetLatestCompletedAnalysisParams{
		Host:  HostGitHub,
		Owner: owner,
		Name:  repo,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get latest completed analysis: %w", err)
	}

	return &CompletedAnalysis{
		ID:          uuidToString(row.ID),
		Owner:       row.Owner,
		Repo:        row.Repo,
		CommitSHA:   row.CommitSha,
		CompletedAt: row.CompletedAt.Time,
		TotalSuites: int(row.TotalSuites),
		TotalTests:  int(row.TotalTests),
	}, nil
}

func (r *repositoryImpl) GetAnalysisStatus(ctx context.Context, owner, repo string) (*AnalysisStatus, error) {
	row, err := r.queries.GetAnalysisStatus(ctx, db.GetAnalysisStatusParams{
		Host:  HostGitHub,
		Owner: owner,
		Name:  repo,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get analysis status: %w", err)
	}

	status := &AnalysisStatus{
		ID:        uuidToString(row.ID),
		Status:    string(row.Status),
		CreatedAt: row.CreatedAt.Time,
	}

	if row.ErrorMessage.Valid {
		status.ErrorMessage = &row.ErrorMessage.String
	}
	if row.CompletedAt.Valid {
		status.CompletedAt = &row.CompletedAt.Time
	}

	return status, nil
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	// pgtype.UUID.Bytes is [16]byte, format as UUID string
	b := u.Bytes
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

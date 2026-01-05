package adapter

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/specvital/web/src/backend/internal/db"
	"github.com/specvital/web/src/backend/modules/spec-view/domain"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/port"
)

const hostGitHub = "github.com"

type AnalysisProviderAdapter struct {
	queries *db.Queries
}

var _ port.AnalysisProvider = (*AnalysisProviderAdapter)(nil)

func NewAnalysisProviderAdapter(queries *db.Queries) (*AnalysisProviderAdapter, error) {
	if queries == nil {
		return nil, errors.New("queries is required")
	}
	return &AnalysisProviderAdapter{queries: queries}, nil
}

func (a *AnalysisProviderAdapter) GetAnalysisForConversion(ctx context.Context, owner, repo, commitSHA string) (*port.AnalysisInfo, error) {
	analysis, err := a.queries.GetLatestCompletedAnalysis(ctx, db.GetLatestCompletedAnalysisParams{
		Host:  hostGitHub,
		Owner: owner,
		Name:  repo,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrAnalysisNotFound
		}
		return nil, fmt.Errorf("get latest analysis: %w", err)
	}

	if analysis.CommitSha != commitSHA {
		return nil, domain.ErrCommitMismatch
	}

	codebaseID, err := a.queries.GetCodebaseIDByOwnerRepo(ctx, db.GetCodebaseIDByOwnerRepoParams{
		Host:  hostGitHub,
		Owner: owner,
		Name:  repo,
	})
	if err != nil {
		return nil, fmt.Errorf("get codebase ID: %w", err)
	}

	suiteRows, err := a.queries.GetTestSuitesByAnalysisID(ctx, analysis.ID)
	if err != nil {
		return nil, fmt.Errorf("get test suites: %w", err)
	}

	if len(suiteRows) == 0 {
		return &port.AnalysisInfo{
			CodebaseID: pgtypeUUIDToUUID(codebaseID),
			Files:      []port.FileInfo{},
		}, nil
	}

	suiteIDs := make([]pgtype.UUID, len(suiteRows))
	for i, s := range suiteRows {
		suiteIDs[i] = s.ID
	}

	testRows, err := a.queries.GetTestCasesBySuiteIDs(ctx, suiteIDs)
	if err != nil {
		return nil, fmt.Errorf("get test cases: %w", err)
	}

	testsBySuite := make(map[string][]port.TestInfo)
	for _, t := range testRows {
		suiteID := uuidPgtypeToString(t.SuiteID)
		line := 0
		if t.LineNumber.Valid {
			line = int(t.LineNumber.Int32)
		}
		testsBySuite[suiteID] = append(testsBySuite[suiteID], port.TestInfo{
			Line:     line,
			Modifier: extractModifier(string(t.Status)),
			Name:     t.Name,
			Status:   string(t.Status),
		})
	}

	fileMap := make(map[string]*port.FileInfo)
	suitesByFile := make(map[string][]port.SuiteInfo)

	for _, s := range suiteRows {
		suiteID := uuidPgtypeToString(s.ID)
		framework := ""
		if s.Framework.Valid {
			framework = s.Framework.String
		}

		if fileMap[s.FilePath] == nil {
			fileMap[s.FilePath] = &port.FileInfo{
				FilePath:  s.FilePath,
				Framework: framework,
			}
		}

		suitesByFile[s.FilePath] = append(suitesByFile[s.FilePath], port.SuiteInfo{
			Hierarchy: s.Name,
			Name:      extractSuiteName(s.Name),
			Tests:     testsBySuite[suiteID],
		})
	}

	files := make([]port.FileInfo, 0, len(fileMap))
	for filePath, fileInfo := range fileMap {
		fileInfo.Suites = suitesByFile[filePath]
		files = append(files, *fileInfo)
	}

	return &port.AnalysisInfo{
		CodebaseID: pgtypeUUIDToUUID(codebaseID),
		Files:      files,
	}, nil
}

func extractSuiteName(hierarchy string) string {
	parts := strings.Split(hierarchy, " > ")
	if len(parts) == 0 {
		return hierarchy
	}
	return parts[len(parts)-1]
}

func extractModifier(status string) string {
	switch status {
	case "focused":
		return "only"
	case "skipped":
		return "skip"
	case "todo":
		return "todo"
	default:
		return ""
	}
}

func uuidPgtypeToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	b := u.Bytes
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

func pgtypeUUIDToUUID(pg pgtype.UUID) uuid.UUID {
	if !pg.Valid {
		return uuid.Nil
	}
	return pg.Bytes
}

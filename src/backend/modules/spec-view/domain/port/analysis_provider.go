package port

import (
	"context"

	"github.com/google/uuid"
)

type AnalysisProvider interface {
	GetAnalysisForConversion(ctx context.Context, owner, repo, commitSHA string) (*AnalysisInfo, error)
}

type AnalysisInfo struct {
	CodebaseID uuid.UUID
	Files      []FileInfo
}

type FileInfo struct {
	FilePath  string
	Framework string
	Suites    []SuiteInfo
}

type SuiteInfo struct {
	Hierarchy string
	Name      string
	Tests     []TestInfo
}

type TestInfo struct {
	Line     int
	Modifier string
	Name     string
	Status   string
}

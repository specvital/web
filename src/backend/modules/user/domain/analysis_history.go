package domain

import "time"

type OwnershipFilter string

const (
	OwnershipAll          OwnershipFilter = "all"
	OwnershipMine         OwnershipFilter = "mine"
	OwnershipOrganization OwnershipFilter = "organization"
)

func ParseOwnershipFilter(s string) OwnershipFilter {
	switch s {
	case "mine":
		return OwnershipMine
	case "organization":
		return OwnershipOrganization
	default:
		return OwnershipAll
	}
}

type AnalyzedReposParams struct {
	Cursor    *string
	Limit     int
	Ownership OwnershipFilter
}

type AnalyzedRepository struct {
	CodebaseID  string
	CommitSHA   string
	CompletedAt time.Time
	HistoryID   string
	Name        string
	Owner       string
	TotalTests  int
	UpdatedAt   time.Time
}

type AnalyzedReposResult struct {
	Data       []*AnalyzedRepository
	HasNext    bool
	NextCursor *string
}

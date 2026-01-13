package entity

import "time"

type SpecDocument struct {
	AnalysisID       string
	CreatedAt        time.Time
	Domains          []SpecDomain
	ExecutiveSummary *string
	ID               string
	Language         string
	ModelID          string
}

type SpecDomain struct {
	ClassificationConfidence *float64
	Description              *string
	Features                 []SpecFeature
	ID                       string
	Name                     string
	SortOrder                int
}

type SpecFeature struct {
	Behaviors   []SpecBehavior
	Description *string
	ID          string
	Name        string
	SortOrder   int
}

type SpecBehavior struct {
	ConvertedDescription string
	ID                   string
	OriginalName         string
	SortOrder            int
	SourceInfo           *BehaviorSourceInfo
	SourceTestCaseID     *string
}

type BehaviorSourceInfo struct {
	FilePath   string
	Framework  string
	LineNumber int
	Status     string
}

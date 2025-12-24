package domain

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type Repository struct {
	Archived      bool
	DefaultBranch string
	Description   string
	Disabled      bool
	Fork          bool
	FullName      string
	HTMLURL       string
	ID            int64
	Language      string
	Name          string
	Owner         string
	Private       bool
	PushedAt      *time.Time
	StarCount     int
	Visibility    string
}

type Organization struct {
	AvatarURL   string
	Description string
	HTMLURL     string
	ID          int64
	Login       string
	OrgID       pgtype.UUID
	Role        string
}

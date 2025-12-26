package domain

import "github.com/cockroachdb/errors"

var (
	ErrCodebaseNotFound = errors.New("codebase not found")
	ErrInvalidCursor    = errors.New("invalid cursor format")
)

package domain

import "github.com/cockroachdb/errors"

var (
	ErrInvalidCursor = errors.New("invalid cursor format")
)

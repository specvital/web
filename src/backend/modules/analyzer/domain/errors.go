package domain

import (
	"errors"
	"fmt"
)

var (
	ErrInvalidCursor = errors.New("invalid cursor format")
	ErrNotFound      = errors.New("analysis not found")
)

func WrapNotFound(owner, repo string) error {
	return fmt.Errorf("%s/%s: %w", owner, repo, ErrNotFound)
}

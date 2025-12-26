package domain

import (
	"errors"
	"fmt"
)

var (
	ErrNotFound = errors.New("analysis not found")
)

func WrapNotFound(owner, repo string) error {
	return fmt.Errorf("%s/%s: %w", owner, repo, ErrNotFound)
}

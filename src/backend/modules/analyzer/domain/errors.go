package domain

import "github.com/cockroachdb/errors"

// Sentinel errors for domain-level error handling.
// Check using errors.Is() by callers.
var (
	ErrNotFound = errors.New("analysis not found")
)

func WrapNotFound(owner, repo string) error {
	return errors.Wrapf(ErrNotFound, "%s/%s", owner, repo)
}

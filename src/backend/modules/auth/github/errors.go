package github

import "github.com/cockroachdb/errors"

var (
	ErrAccessDenied       = errors.New("access denied by user")
	ErrInvalidCode        = errors.New("invalid authorization code")
	ErrInvalidGitHubToken = errors.New("invalid or expired github access token")
	ErrNetworkFailure     = errors.New("network communication failed")
	ErrRateLimited        = errors.New("github api rate limit exceeded")
)

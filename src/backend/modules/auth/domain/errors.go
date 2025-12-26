package domain

import "github.com/cockroachdb/errors"

var (
	ErrAccessDenied       = errors.New("access denied by user")
	ErrCodebaseNotFound   = errors.New("codebase not found")
	ErrInvalidCode        = errors.New("invalid authorization code")
	ErrInvalidGitHubToken = errors.New("invalid or expired github access token")
	ErrInvalidOAuthCode   = errors.New("invalid oauth code")
	ErrInvalidState       = errors.New("invalid oauth state")
	ErrInvalidToken       = errors.New("invalid token")
	ErrNetworkFailure     = errors.New("network communication failed")
	ErrNoGitHubToken      = errors.New("user has no github access token")
	ErrRateLimited        = errors.New("github api rate limit exceeded")
	ErrTokenExpired       = errors.New("token expired")
	ErrUserNotFound       = errors.New("user not found")
)

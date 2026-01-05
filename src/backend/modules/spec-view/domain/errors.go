package domain

import "errors"

var (
	ErrAIProviderUnavailable = errors.New("AI provider unavailable")
	ErrAnalysisNotFound      = errors.New("analysis not found")
	ErrCommitMismatch        = errors.New("commit SHA mismatch")
	ErrConversionFailed      = errors.New("conversion failed")
	ErrInvalidLanguage       = errors.New("invalid conversion language")
	ErrRateLimited           = errors.New("rate limit exceeded")
)

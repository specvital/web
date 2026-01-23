package domain

import "errors"

var (
	ErrAlreadyExists     = errors.New("spec document already exists")
	ErrAnalysisNotFound  = errors.New("analysis not found")
	ErrDocumentNotFound  = errors.New("spec document not found")
	ErrForbidden         = errors.New("access denied to this resource")
	ErrGenerationPending = errors.New("generation already pending")
	ErrGenerationRunning = errors.New("generation already running")
	ErrInvalidAnalysisID = errors.New("invalid analysis ID")
	ErrInvalidLanguage   = errors.New("invalid language")
	ErrQuotaExceeded     = errors.New("quota exceeded")
	ErrUnauthorized      = errors.New("authentication required")
)

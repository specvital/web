package dto

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

const (
	ContentTypeHeader     = "Content-Type"
	JSONContentType       = "application/json"
	ProblemJSONType       = "application/problem+json"
	ProblemTypeAboutBlank = "about:blank"
)

// ProblemDetail represents RFC 7807 error response format with optional rate limit extension.
type ProblemDetail struct {
	Detail    string              `json:"detail"`
	Instance  string              `json:"instance,omitempty"`
	RateLimit *RateLimitExtension `json:"rateLimit,omitempty"`
	Status    int                 `json:"status"`
	Title     string              `json:"title"`
	Type      string              `json:"type,omitempty"`
}

// RateLimitExtension provides rate limit information when applicable.
type RateLimitExtension struct {
	Limit     int   `json:"limit"`
	Remaining int   `json:"remaining"`
	ResetAt   int64 `json:"resetAt"`
}

func SendProblemDetail(w http.ResponseWriter, r *http.Request, status int, title, detail string) {
	SendProblemDetailWithRateLimit(w, r, status, title, detail, nil)
}

func SendProblemDetailWithRateLimit(w http.ResponseWriter, r *http.Request, status int, title, detail string, rateLimit *RateLimitExtension) {
	problem := ProblemDetail{
		Detail:    detail,
		Instance:  r.URL.Path,
		RateLimit: rateLimit,
		Status:    status,
		Title:     title,
		Type:      ProblemTypeAboutBlank,
	}
	w.Header().Set(ContentTypeHeader, ProblemJSONType)
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(problem); err != nil {
		slog.Error("failed to encode problem detail", "error", err)
	}
}

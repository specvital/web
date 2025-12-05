package analyzer

import (
	"github.com/go-chi/chi/v5"
	"github.com/specvital/web/src/backend/common/clients/github"
)

// setupTestHandler creates a new Handler with mock GitHub client and chi router.
// This helper is used in tests to avoid code duplication.
func setupTestHandler() (*Handler, *chi.Mux) {
	githubClient := github.NewClient("")
	service := NewService(githubClient)
	handler := NewHandler(service)

	r := chi.NewRouter()
	handler.RegisterRoutes(r)

	return handler, r
}

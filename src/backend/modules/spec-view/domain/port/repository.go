package port

import (
	"context"

	"github.com/specvital/web/src/backend/modules/spec-view/domain/entity"
)

type SpecViewRepository interface {
	CheckAnalysisExists(ctx context.Context, analysisID string) (bool, error)
	CheckSpecDocumentExists(ctx context.Context, analysisID string) (bool, error)
	// DeleteSpecDocumentByLanguage deletes a spec document for a given analysis and language.
	// CASCADE will automatically delete child tables (domains, features, behaviors).
	DeleteSpecDocumentByLanguage(ctx context.Context, analysisID string, language string) error
	GetGenerationStatus(ctx context.Context, analysisID string) (*entity.SpecGenerationStatus, error)
	// GetSpecDocumentByLanguage retrieves a spec document for a given analysis and language.
	// If language is empty, returns the most recent document regardless of language.
	GetSpecDocumentByLanguage(ctx context.Context, analysisID string, language string) (*entity.SpecDocument, error)
}

type TierLookup interface {
	GetUserTier(ctx context.Context, userID string) (string, error)
}

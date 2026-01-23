package usecase

import (
	"context"

	"github.com/specvital/web/src/backend/modules/spec-view/domain"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/entity"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/port"
)

type GetSpecDocumentInput struct {
	AnalysisID string
	// Language is optional. If empty, returns the most recent document.
	Language string
	// UserID is required. Empty userID returns ErrUnauthorized.
	UserID string
	// Version is optional. If 0, returns the latest version. Requires Language to be set.
	Version int
}

type GetSpecDocumentOutput struct {
	Document         *entity.SpecDocument
	GenerationStatus *entity.SpecGenerationStatus
}

type GetSpecDocumentUseCase struct {
	repo port.SpecViewRepository
}

func NewGetSpecDocumentUseCase(repo port.SpecViewRepository) *GetSpecDocumentUseCase {
	return &GetSpecDocumentUseCase{repo: repo}
}

func (uc *GetSpecDocumentUseCase) Execute(ctx context.Context, input GetSpecDocumentInput) (*GetSpecDocumentOutput, error) {
	if input.UserID == "" {
		return nil, domain.ErrUnauthorized
	}

	if input.AnalysisID == "" {
		return nil, domain.ErrInvalidAnalysisID
	}

	// Version requires valid language
	if input.Version > 0 {
		if input.Language == "" || !entity.IsValidLanguage(input.Language) {
			return nil, domain.ErrInvalidLanguage
		}
	}

	// Check ownership before returning any data.
	// ownership == nil means no document exists yet, which is allowed to support
	// viewing generation-in-progress status. The user-scoped query (GetSpecDocumentByUser)
	// provides the final authorization check for actual document access.
	ownership, err := uc.repo.CheckSpecDocumentOwnership(ctx, input.AnalysisID)
	if err != nil {
		return nil, err
	}
	if ownership != nil && ownership.UserID != input.UserID {
		return nil, domain.ErrForbidden
	}

	// Check for active generation first (for regeneration scenarios)
	// If generation is in progress, return generating status even if document exists
	// Skip generation check when requesting specific version (historical data)
	var status *entity.SpecGenerationStatus
	if input.Version == 0 {
		if input.Language != "" {
			status, err = uc.repo.GetGenerationStatusByLanguage(ctx, input.AnalysisID, input.Language)
		} else {
			status, err = uc.repo.GetGenerationStatus(ctx, input.AnalysisID)
		}
		if err != nil {
			return nil, err
		}

		if status != nil && (status.Status == entity.StatusPending || status.Status == entity.StatusRunning) {
			return &GetSpecDocumentOutput{GenerationStatus: status}, nil
		}
	}

	var doc *entity.SpecDocument
	if input.Version > 0 {
		doc, err = uc.repo.GetSpecDocumentByUserAndVersion(ctx, input.UserID, input.AnalysisID, input.Language, input.Version)
	} else {
		doc, err = uc.repo.GetSpecDocumentByUser(ctx, input.UserID, input.AnalysisID, input.Language)
	}
	if err != nil {
		return nil, err
	}

	if doc != nil {
		availableLanguages, err := uc.repo.GetAvailableLanguagesByUser(ctx, input.UserID, input.AnalysisID)
		if err != nil {
			return nil, err
		}
		doc.AvailableLanguages = availableLanguages
		return &GetSpecDocumentOutput{Document: doc}, nil
	}

	if status != nil && status.Status != entity.StatusNotFound {
		return &GetSpecDocumentOutput{GenerationStatus: status}, nil
	}

	return nil, domain.ErrDocumentNotFound
}

package usecase

import (
	"context"

	"github.com/specvital/web/src/backend/modules/spec-view/domain"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/entity"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/port"
)

type GetSpecDocumentInput struct {
	AnalysisID string
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
	if input.AnalysisID == "" {
		return nil, domain.ErrInvalidAnalysisID
	}

	doc, err := uc.repo.GetSpecDocument(ctx, input.AnalysisID)
	if err != nil {
		return nil, err
	}

	if doc != nil {
		return &GetSpecDocumentOutput{Document: doc}, nil
	}

	status, err := uc.repo.GetGenerationStatus(ctx, input.AnalysisID)
	if err != nil {
		return nil, err
	}

	if status != nil && status.Status != entity.StatusNotFound {
		return &GetSpecDocumentOutput{GenerationStatus: status}, nil
	}

	return nil, domain.ErrDocumentNotFound
}

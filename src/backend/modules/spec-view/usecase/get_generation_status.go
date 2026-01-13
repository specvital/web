package usecase

import (
	"context"

	"github.com/specvital/web/src/backend/modules/spec-view/domain"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/entity"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/port"
)

type GetGenerationStatusInput struct {
	AnalysisID string
}

type GetGenerationStatusOutput struct {
	Status *entity.SpecGenerationStatus
}

type GetGenerationStatusUseCase struct {
	repo port.SpecViewRepository
}

func NewGetGenerationStatusUseCase(repo port.SpecViewRepository) *GetGenerationStatusUseCase {
	return &GetGenerationStatusUseCase{repo: repo}
}

func (uc *GetGenerationStatusUseCase) Execute(ctx context.Context, input GetGenerationStatusInput) (*GetGenerationStatusOutput, error) {
	if input.AnalysisID == "" {
		return nil, domain.ErrInvalidAnalysisID
	}

	status, err := uc.repo.GetGenerationStatus(ctx, input.AnalysisID)
	if err != nil {
		return nil, err
	}

	if status == nil {
		return &GetGenerationStatusOutput{
			Status: &entity.SpecGenerationStatus{
				AnalysisID: input.AnalysisID,
				Status:     entity.StatusNotFound,
			},
		}, nil
	}

	return &GetGenerationStatusOutput{Status: status}, nil
}

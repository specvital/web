package usecase

import (
	"context"

	"github.com/specvital/web/src/backend/modules/spec-view/domain"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/entity"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/port"
)

type GetGenerationStatusInput struct {
	AnalysisID string
	Language   string // Optional: if specified, returns status for that specific language
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

	if input.Language != "" && !entity.IsValidLanguage(input.Language) {
		return nil, domain.ErrInvalidLanguage
	}

	var status *entity.SpecGenerationStatus
	var err error

	if input.Language != "" {
		status, err = uc.repo.GetGenerationStatusByLanguage(ctx, input.AnalysisID, input.Language)
	} else {
		status, err = uc.repo.GetGenerationStatus(ctx, input.AnalysisID)
	}
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

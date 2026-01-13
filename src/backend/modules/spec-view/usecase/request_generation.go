package usecase

import (
	"context"

	"github.com/specvital/web/src/backend/modules/spec-view/domain"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/entity"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/port"
)

type RequestGenerationInput struct {
	AnalysisID        string
	IsForceRegenerate bool
	Language          string
}

type RequestGenerationOutput struct {
	AnalysisID string
	Message    *string
	Status     entity.GenerationStatus
}

type RequestGenerationUseCase struct {
	queue port.QueueService
	repo  port.SpecViewRepository
}

func NewRequestGenerationUseCase(repo port.SpecViewRepository, queue port.QueueService) *RequestGenerationUseCase {
	return &RequestGenerationUseCase{
		queue: queue,
		repo:  repo,
	}
}

func (uc *RequestGenerationUseCase) Execute(ctx context.Context, input RequestGenerationInput) (*RequestGenerationOutput, error) {
	if input.AnalysisID == "" {
		return nil, domain.ErrInvalidAnalysisID
	}

	exists, err := uc.repo.CheckAnalysisExists(ctx, input.AnalysisID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, domain.ErrAnalysisNotFound
	}

	if !input.IsForceRegenerate {
		docExists, err := uc.repo.CheckSpecDocumentExists(ctx, input.AnalysisID)
		if err != nil {
			return nil, err
		}
		if docExists {
			return nil, domain.ErrAlreadyExists
		}

		status, err := uc.repo.GetGenerationStatus(ctx, input.AnalysisID)
		if err != nil {
			return nil, err
		}
		if status != nil {
			switch status.Status {
			case entity.StatusPending:
				return nil, domain.ErrGenerationPending
			case entity.StatusRunning:
				return nil, domain.ErrGenerationRunning
			}
		}
	}

	language := input.Language
	if language == "" {
		language = "en"
	}

	if err := uc.queue.EnqueueSpecGeneration(ctx, input.AnalysisID, language); err != nil {
		return nil, err
	}

	return &RequestGenerationOutput{
		AnalysisID: input.AnalysisID,
		Status:     entity.StatusPending,
	}, nil
}

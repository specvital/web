package adapter

import (
	"context"

	"github.com/specvital/web/src/backend/common/logger"
	"github.com/specvital/web/src/backend/modules/spec-view/domain/port"
)

// NoopQueueService is a no-op implementation for spec generation queue.
// The actual implementation will be in the worker module.
// WARNING: This service accepts requests but does not process them.
type NoopQueueService struct {
	logger *logger.Logger
}

var _ port.QueueService = (*NoopQueueService)(nil)

func NewNoopQueueService(l *logger.Logger) *NoopQueueService {
	return &NoopQueueService{logger: l}
}

func (s *NoopQueueService) EnqueueSpecGeneration(ctx context.Context, analysisID string, language string) error {
	s.logger.Warn(ctx, "NoopQueueService: spec generation requested but not implemented",
		"analysisID", analysisID,
		"language", language,
	)
	return nil
}

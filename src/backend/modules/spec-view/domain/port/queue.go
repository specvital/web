package port

import "context"

type QueueService interface {
	EnqueueSpecGeneration(ctx context.Context, analysisID string, language string, userID *string) error
}

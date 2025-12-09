package analyzer

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TypeAnalyze = "analysis:analyze"
)

type AnalyzePayload struct {
	Owner string `json:"owner"`
	Repo  string `json:"repo"`
}

type QueueService interface {
	Enqueue(ctx context.Context, owner, repo string) error
	Close() error
}

type queueService struct {
	client *asynq.Client
}

func NewQueueService(client *asynq.Client) QueueService {
	return &queueService{client: client}
}

func (s *queueService) Enqueue(ctx context.Context, owner, repo string) error {
	payload, err := json.Marshal(AnalyzePayload{
		Owner: owner,
		Repo:  repo,
	})
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	task := asynq.NewTask(TypeAnalyze, payload)

	_, err = s.client.EnqueueContext(ctx, task,
		asynq.MaxRetry(3),
		asynq.Queue("default"),
	)
	if err != nil {
		return fmt.Errorf("enqueue task: %w", err)
	}

	return nil
}

func (s *queueService) Close() error {
	return s.client.Close()
}

package port

import "context"

type QueueService interface {
	Enqueue(ctx context.Context, owner, repo, commitSHA string, userID *string) error
	FindTaskByRepo(ctx context.Context, owner, repo string) (*TaskInfo, error)
	Close() error
}

type TaskInfo struct {
	CommitSHA string
	State     string
}

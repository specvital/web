package analyzer

import (
	"context"

	"github.com/specvital/web/src/backend/common/clients/github"
)

// GitHost abstracts Git hosting services (GitHub, GitLab, Bitbucket, etc.)
type GitHost interface {
	GetLatestCommit(ctx context.Context, owner, repo string) (*github.CommitInfo, error)
	ListFiles(ctx context.Context, owner, repo string) ([]github.FileInfo, error)
	GetFileContent(ctx context.Context, owner, repo, path string) (string, error)
	GetRateLimit() github.RateLimitInfo
}

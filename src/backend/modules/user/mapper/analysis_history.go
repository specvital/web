package mapper

import (
	"fmt"

	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/user/domain"
)

func ToUserAnalyzedRepositoriesResponse(result *domain.AnalyzedReposResult) api.UserAnalyzedRepositoriesResponse {
	cards := make([]api.RepositoryCard, 0, len(result.Data))

	for _, repo := range result.Data {
		cards = append(cards, ToAnalyzedRepositoryCard(repo))
	}

	return api.UserAnalyzedRepositoriesResponse{
		Data:       cards,
		HasNext:    result.HasNext,
		NextCursor: result.NextCursor,
	}
}

func ToAnalyzedRepositoryCard(repo *domain.AnalyzedRepository) api.RepositoryCard {
	card := api.RepositoryCard{
		FullName: fmt.Sprintf("%s/%s", repo.Owner, repo.Name),
		ID:       repo.CodebaseID,
		// TODO: Fetch bookmark status - requires JOIN with user_bookmarks table
		IsBookmarked: false,
		Name:         repo.Name,
		Owner:        repo.Owner,
		// TODO: Calculate update status - requires GitHub API call to check for new commits
		UpdateStatus: api.Unknown,
	}

	if !repo.CompletedAt.IsZero() {
		card.LatestAnalysis = &api.AnalysisSummary{
			AnalyzedAt: repo.CompletedAt,
			// TODO: Calculate change delta - requires querying previous analysis for same codebase
			Change:    0,
			CommitSHA: repo.CommitSHA,
			TestCount: repo.TotalTests,
		}
	}

	return card
}

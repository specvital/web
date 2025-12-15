package github

type GitHubUser struct {
	AvatarURL string
	Email     *string
	ID        int64
	Login     string
}

type userResponse struct {
	AvatarURL string  `json:"avatar_url"`
	Email     *string `json:"email"`
	ID        int64   `json:"id"`
	Login     string  `json:"login"`
}

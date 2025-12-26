package github

type userResponse struct {
	AvatarURL string  `json:"avatar_url"`
	Email     *string `json:"email"`
	ID        int64   `json:"id"`
	Login     string  `json:"login"`
}

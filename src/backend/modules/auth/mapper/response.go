package mapper

import (
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/auth/domain"
)

func ToUserInfo(user *domain.User) api.UserInfo {
	return api.UserInfo{
		AvatarURL: user.AvatarURL,
		ID:        user.ID,
		Login:     user.Username,
		Name:      nil, // GitHub display name not stored in domain.User
	}
}

func ToLoginResponse(authURL string) api.LoginResponse {
	return api.LoginResponse{
		AuthURL: authURL,
	}
}

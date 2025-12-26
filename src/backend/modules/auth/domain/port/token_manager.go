package port

import "github.com/specvital/web/src/backend/modules/auth/domain/entity"

type TokenManager interface {
	Generate(userID, login string) (string, error)
	Validate(tokenString string) (*entity.Claims, error)
}

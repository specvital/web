package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/cockroachdb/errors"

	"github.com/specvital/web/src/backend/common/logger"
	"github.com/specvital/web/src/backend/common/middleware"
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/auth/domain"
	"github.com/specvital/web/src/backend/modules/auth/mapper"
)

const (
	CookieName     = "auth_token"
	CookieMaxAge   = 7 * 24 * 60 * 60 // 7 days in seconds
	CookiePath     = "/"
	CookieSameSite = http.SameSiteLaxMode
)

type Handler struct {
	cookieSecure bool
	logger       *logger.Logger
	service      Service
}

type HandlerConfig struct {
	CookieSecure bool
	Logger       *logger.Logger
	Service      Service
}

var _ api.AuthHandlers = (*Handler)(nil)

func NewHandler(cfg *HandlerConfig) *Handler {
	if cfg == nil {
		panic("auth: HandlerConfig is required")
	}
	if cfg.Logger == nil {
		panic("auth: Logger is required")
	}
	if cfg.Service == nil {
		panic("auth: Service is required")
	}
	return &Handler{
		cookieSecure: cfg.CookieSecure,
		logger:       cfg.Logger,
		service:      cfg.Service,
	}
}

func (h *Handler) AuthLogin(ctx context.Context, _ api.AuthLoginRequestObject) (api.AuthLoginResponseObject, error) {
	authURL, err := h.service.InitiateOAuth(ctx)
	if err != nil {
		h.logger.Error(ctx, "failed to initiate oauth", "error", err)
		return api.AuthLogin500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to initiate login"),
		}, nil
	}

	return api.AuthLogin200JSONResponse(mapper.ToLoginResponse(authURL)), nil
}

func (h *Handler) AuthCallback(ctx context.Context, request api.AuthCallbackRequestObject) (api.AuthCallbackResponseObject, error) {
	code := request.Params.Code
	state := request.Params.State

	if code == "" || state == "" {
		return api.AuthCallback400ApplicationProblemPlusJSONResponse{
			BadRequestApplicationProblemPlusJSONResponse: api.NewBadRequest("missing code or state parameter"),
		}, nil
	}

	result, err := h.service.HandleOAuthCallback(ctx, code, state)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidState) {
			return api.AuthCallback400ApplicationProblemPlusJSONResponse{
				BadRequestApplicationProblemPlusJSONResponse: api.NewBadRequest("invalid or expired state parameter"),
			}, nil
		}
		if errors.Is(err, domain.ErrInvalidOAuthCode) {
			return api.AuthCallback400ApplicationProblemPlusJSONResponse{
				BadRequestApplicationProblemPlusJSONResponse: api.NewBadRequest("invalid authorization code"),
			}, nil
		}

		h.logger.Error(ctx, "oauth callback failed", "error", err)
		return api.AuthCallback500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("authentication failed"),
		}, nil
	}

	cookie := h.buildAuthCookie(result.Token)

	return api.AuthCallback200JSONResponse{
		Body:    mapper.ToUserInfo(result.User),
		Headers: api.AuthCallback200ResponseHeaders{SetCookie: cookie},
	}, nil
}

func (h *Handler) AuthLogout(_ context.Context, _ api.AuthLogoutRequestObject) (api.AuthLogoutResponseObject, error) {
	cookie := h.BuildLogoutCookie()
	return logoutResponse{
		cookie:  cookie,
		success: true,
	}, nil
}

func (h *Handler) AuthMe(ctx context.Context, _ api.AuthMeRequestObject) (api.AuthMeResponseObject, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return api.AuthMe401ApplicationProblemPlusJSONResponse{
			UnauthorizedApplicationProblemPlusJSONResponse: api.NewUnauthorized("authentication required"),
		}, nil
	}

	user, err := h.service.GetCurrentUser(ctx, userID)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return api.AuthMe401ApplicationProblemPlusJSONResponse{
				UnauthorizedApplicationProblemPlusJSONResponse: api.NewUnauthorized("user not found"),
			}, nil
		}

		h.logger.Error(ctx, "failed to get current user", "error", err, "userID", userID)
		return api.AuthMe500ApplicationProblemPlusJSONResponse{
			InternalErrorApplicationProblemPlusJSONResponse: api.NewInternalError("failed to retrieve user information"),
		}, nil
	}

	return api.AuthMe200JSONResponse(mapper.ToUserInfo(user)), nil
}

func (h *Handler) buildAuthCookie(token string) string {
	cookie := &http.Cookie{
		HttpOnly: true,
		MaxAge:   CookieMaxAge,
		Name:     CookieName,
		Path:     CookiePath,
		SameSite: CookieSameSite,
		Secure:   h.cookieSecure,
		Value:    token,
	}
	return cookie.String()
}

func (h *Handler) BuildLogoutCookie() string {
	cookie := &http.Cookie{
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		MaxAge:   -1,
		Name:     CookieName,
		Path:     CookiePath,
		SameSite: CookieSameSite,
		Secure:   h.cookieSecure,
		Value:    "",
	}
	return cookie.String()
}

// logoutResponse implements AuthLogoutResponseObject with Set-Cookie header.
type logoutResponse struct {
	cookie  string
	success bool
}

func (r logoutResponse) VisitAuthLogoutResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Set-Cookie", r.cookie)
	w.WriteHeader(http.StatusOK)
	return json.NewEncoder(w).Encode(api.LogoutResponse{Success: r.success})
}

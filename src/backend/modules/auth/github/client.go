// Package github implements GitHub OAuth 2.0 authentication flow using golang.org/x/oauth2.
package github

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/cockroachdb/errors"
	"golang.org/x/oauth2"
	oauthGithub "golang.org/x/oauth2/github"

	"github.com/specvital/web/src/backend/modules/auth/domain/entity"
)

const (
	githubUserURL = "https://api.github.com/user"
	DefaultScope  = "user:email"
)

type Config struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Scopes       []string
}

type Client interface {
	ExchangeCode(ctx context.Context, code string) (string, error)
	GenerateAuthURL(state string) (string, error)
	GetUserInfo(ctx context.Context, accessToken string) (*entity.OAuthUserInfo, error)
}

type oauthClient struct {
	config      *oauth2.Config
	oauthConfig *Config
}

func NewClient(config *Config) (Client, error) {
	if config.ClientID == "" {
		return nil, errors.New("github client ID is required")
	}
	if config.ClientSecret == "" {
		return nil, errors.New("github client secret is required")
	}
	if config.RedirectURL == "" {
		return nil, errors.New("github redirect URL is required")
	}

	scopes := config.Scopes
	if len(scopes) == 0 {
		scopes = []string{DefaultScope}
	}

	return &oauthClient{
		config: &oauth2.Config{
			ClientID:     config.ClientID,
			ClientSecret: config.ClientSecret,
			RedirectURL:  config.RedirectURL,
			Scopes:       scopes,
			Endpoint:     oauthGithub.Endpoint,
		},
		oauthConfig: config,
	}, nil
}

var ErrEmptyState = errors.New("state parameter is required for CSRF protection")

func (c *oauthClient) GenerateAuthURL(state string) (string, error) {
	if state == "" {
		return "", ErrEmptyState
	}
	return c.config.AuthCodeURL(state), nil
}

func (c *oauthClient) ExchangeCode(ctx context.Context, code string) (string, error) {
	if code == "" {
		return "", errors.Wrap(ErrInvalidCode, "code is empty")
	}

	token, err := c.config.Exchange(ctx, code)
	if err != nil {
		var retrieveErr *oauth2.RetrieveError
		if errors.As(err, &retrieveErr) && retrieveErr.Response != nil {
			switch retrieveErr.Response.StatusCode {
			case http.StatusUnauthorized, http.StatusBadRequest:
				return "", errors.Wrap(ErrInvalidCode, "bad verification code")
			case http.StatusForbidden:
				return "", errors.Wrap(ErrAccessDenied, "access denied")
			}
		}
		return "", errors.Wrap(ErrNetworkFailure, err.Error())
	}

	if token.AccessToken == "" {
		return "", errors.Wrap(ErrInvalidCode, "empty access token")
	}

	return token.AccessToken, nil
}

func (c *oauthClient) GetUserInfo(ctx context.Context, accessToken string) (*entity.OAuthUserInfo, error) {
	if accessToken == "" {
		return nil, errors.Wrap(ErrInvalidGitHubToken, "access token is empty")
	}

	token := &oauth2.Token{AccessToken: accessToken}
	httpClient := c.config.Client(ctx, token)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, githubUserURL, nil)
	if err != nil {
		return nil, errors.Wrap(ErrNetworkFailure, "failed to create request")
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(ErrNetworkFailure, err.Error())
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, errors.Wrap(ErrInvalidGitHubToken, "unauthorized")
	}
	if resp.StatusCode == http.StatusForbidden {
		if resp.Header.Get("X-RateLimit-Remaining") == "0" {
			return nil, errors.Wrap(ErrRateLimited, "rate limit exceeded")
		}
		return nil, errors.Wrap(ErrInvalidGitHubToken, "forbidden")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, errors.Wrapf(ErrNetworkFailure, "unexpected status: %d", resp.StatusCode)
	}

	var userResp userResponse
	if err := json.NewDecoder(resp.Body).Decode(&userResp); err != nil {
		return nil, errors.Wrap(ErrNetworkFailure, "failed to parse response")
	}

	return &entity.OAuthUserInfo{
		AvatarURL:  userResp.AvatarURL,
		Email:      userResp.Email,
		ExternalID: strconv.FormatInt(userResp.ID, 10),
		Username:   userResp.Login,
	}, nil
}

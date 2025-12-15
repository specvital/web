package github

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	pkgerrors "github.com/cockroachdb/errors"
	"golang.org/x/oauth2"
)

func TestNewClient(t *testing.T) {
	tests := []struct {
		name    string
		config  *Config
		wantErr bool
	}{
		{
			name: "valid config",
			config: &Config{
				ClientID:     "test-client-id",
				ClientSecret: "test-client-secret",
				RedirectURL:  "http://localhost:8000/callback",
			},
			wantErr: false,
		},
		{
			name: "missing client ID",
			config: &Config{
				ClientSecret: "test-client-secret",
				RedirectURL:  "http://localhost:8000/callback",
			},
			wantErr: true,
		},
		{
			name: "missing client secret",
			config: &Config{
				ClientID:    "test-client-id",
				RedirectURL: "http://localhost:8000/callback",
			},
			wantErr: true,
		},
		{
			name: "missing redirect URL",
			config: &Config{
				ClientID:     "test-client-id",
				ClientSecret: "test-client-secret",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewClient(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewClient() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestGenerateAuthURL(t *testing.T) {
	config := &Config{
		ClientID:     "test-client-id",
		ClientSecret: "test-secret",
		RedirectURL:  "http://localhost:8000/callback",
		Scopes:       []string{"user:email"},
	}

	client, _ := NewClient(config)
	url, err := client.GenerateAuthURL("test-state-123")
	if err != nil {
		t.Fatalf("GenerateAuthURL() error = %v", err)
	}

	if !strings.Contains(url, "client_id=test-client-id") {
		t.Error("URL should contain client_id")
	}
	if !strings.Contains(url, "state=test-state-123") {
		t.Error("URL should contain state")
	}
	if !strings.Contains(url, "redirect_uri=") {
		t.Error("URL should contain redirect_uri")
	}
	if !strings.Contains(url, "scope=user") {
		t.Error("URL should contain scope")
	}
	if !strings.HasPrefix(url, "https://github.com/login/oauth/authorize") {
		t.Error("URL should start with GitHub auth URL")
	}
}

func TestGenerateAuthURL_EmptyState(t *testing.T) {
	config := &Config{
		ClientID:     "test-client-id",
		ClientSecret: "test-secret",
		RedirectURL:  "http://localhost:8000/callback",
	}

	client, _ := NewClient(config)
	_, err := client.GenerateAuthURL("")
	if !pkgerrors.Is(err, ErrEmptyState) {
		t.Errorf("GenerateAuthURL() error = %v, wantErr %v", err, ErrEmptyState)
	}
}

func TestExchangeCode(t *testing.T) {
	tests := []struct {
		name        string
		code        string
		response    string
		statusCode  int
		wantToken   string
		wantErr     bool
		wantErrType error
	}{
		{
			name:       "successful exchange",
			code:       "valid-code",
			response:   `{"access_token":"gho_xxxx","token_type":"bearer","scope":"user:email"}`,
			statusCode: 200,
			wantToken:  "gho_xxxx",
			wantErr:    false,
		},
		{
			name:        "empty code",
			code:        "",
			response:    "",
			statusCode:  200,
			wantErr:     true,
			wantErrType: ErrInvalidCode,
		},
		{
			name:        "bad verification code",
			code:        "invalid-code",
			response:    `{"error":"bad_verification_code","error_description":"The code passed is incorrect or expired."}`,
			statusCode:  400,
			wantErr:     true,
			wantErrType: ErrInvalidCode,
		},
		{
			name:        "access denied",
			code:        "denied-code",
			response:    `{"error":"access_denied"}`,
			statusCode:  403,
			wantErr:     true,
			wantErrType: ErrAccessDenied,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.code == "" {
				config := &Config{
					ClientID:     "test-client-id",
					ClientSecret: "test-secret",
					RedirectURL:  "http://localhost:8000/callback",
				}
				client, _ := NewClient(config)
				_, err := client.ExchangeCode(context.Background(), tt.code)

				if (err != nil) != tt.wantErr {
					t.Errorf("ExchangeCode() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				if tt.wantErrType != nil && !pkgerrors.Is(err, tt.wantErrType) {
					t.Errorf("ExchangeCode() error type = %v, wantErrType %v", err, tt.wantErrType)
				}
				return
			}

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tt.statusCode)
				w.Write([]byte(tt.response))
			}))
			defer server.Close()

			client := &oauthClient{
				config: &oauth2.Config{
					ClientID:     "test-client-id",
					ClientSecret: "test-secret",
					RedirectURL:  "http://localhost:8000/callback",
					Scopes:       []string{"user:email"},
					Endpoint:     oauth2.Endpoint{TokenURL: server.URL},
				},
			}

			token, err := client.ExchangeCode(context.Background(), tt.code)

			if (err != nil) != tt.wantErr {
				t.Errorf("ExchangeCode() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.wantErr && tt.wantErrType != nil {
				if !pkgerrors.Is(err, tt.wantErrType) {
					t.Errorf("ExchangeCode() error type = %v, wantErrType %v", err, tt.wantErrType)
				}
				return
			}

			if token != tt.wantToken {
				t.Errorf("ExchangeCode() token = %v, want %v", token, tt.wantToken)
			}
		})
	}
}

func TestGetUserInfo(t *testing.T) {
	email := "test@example.com"

	tests := []struct {
		name        string
		token       string
		response    string
		statusCode  int
		headers     map[string]string
		wantUserID  int64
		wantLogin   string
		wantErr     bool
		wantErrType error
	}{
		{
			name:       "successful fetch",
			token:      "valid-token",
			response:   `{"id":12345,"login":"testuser","email":"test@example.com","avatar_url":"https://avatar.url"}`,
			statusCode: 200,
			wantUserID: 12345,
			wantLogin:  "testuser",
			wantErr:    false,
		},
		{
			name:        "empty token",
			token:       "",
			response:    "",
			statusCode:  200,
			wantErr:     true,
			wantErrType: ErrInvalidGitHubToken,
		},
		{
			name:        "unauthorized",
			token:       "invalid-token",
			response:    `{"message":"Bad credentials"}`,
			statusCode:  401,
			wantErr:     true,
			wantErrType: ErrInvalidGitHubToken,
		},
		{
			name:        "rate limited",
			token:       "valid-token",
			response:    `{"message":"API rate limit exceeded"}`,
			statusCode:  403,
			headers:     map[string]string{"X-RateLimit-Remaining": "0"},
			wantErr:     true,
			wantErrType: ErrRateLimited,
		},
		{
			name:        "malformed json response",
			token:       "valid-token",
			response:    `{"id": "not-a-number"}`,
			statusCode:  200,
			wantErr:     true,
			wantErrType: ErrNetworkFailure,
		},
		{
			name:        "unexpected status code",
			token:       "valid-token",
			response:    `{"message":"Internal Server Error"}`,
			statusCode:  500,
			wantErr:     true,
			wantErrType: ErrNetworkFailure,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.token == "" {
				config := &Config{
					ClientID:     "test-client-id",
					ClientSecret: "test-secret",
					RedirectURL:  "http://localhost:8000/callback",
				}
				client, _ := NewClient(config)
				_, err := client.GetUserInfo(context.Background(), tt.token)

				if (err != nil) != tt.wantErr {
					t.Errorf("GetUserInfo() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				if tt.wantErrType != nil && !pkgerrors.Is(err, tt.wantErrType) {
					t.Errorf("GetUserInfo() error type = %v, wantErrType %v", err, tt.wantErrType)
				}
				return
			}

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				for k, v := range tt.headers {
					w.Header().Set(k, v)
				}
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tt.statusCode)
				w.Write([]byte(tt.response))
			}))
			defer server.Close()

			client := &oauthClient{
				config: &oauth2.Config{
					ClientID:     "test-client-id",
					ClientSecret: "test-secret",
					RedirectURL:  "http://localhost:8000/callback",
					Scopes:       []string{"user:email"},
				},
			}

			user, err := client.getUserInfoWithURL(context.Background(), tt.token, server.URL)

			if (err != nil) != tt.wantErr {
				t.Errorf("GetUserInfo() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.wantErr {
				if tt.wantErrType != nil && !pkgerrors.Is(err, tt.wantErrType) {
					t.Errorf("GetUserInfo() error type = %v, wantErrType %v", err, tt.wantErrType)
				}
				return
			}

			if user.ID != tt.wantUserID {
				t.Errorf("GetUserInfo() ID = %v, want %v", user.ID, tt.wantUserID)
			}
			if user.Login != tt.wantLogin {
				t.Errorf("GetUserInfo() Login = %v, want %v", user.Login, tt.wantLogin)
			}
			if user.Email == nil || *user.Email != email {
				t.Errorf("GetUserInfo() Email = %v, want %v", user.Email, email)
			}
		})
	}
}

func (c *oauthClient) getUserInfoWithURL(ctx context.Context, accessToken string, url string) (*GitHubUser, error) {
	if accessToken == "" {
		return nil, pkgerrors.Wrap(ErrInvalidGitHubToken, "access token is empty")
	}

	token := &oauth2.Token{AccessToken: accessToken}
	httpClient := c.config.Client(ctx, token)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, pkgerrors.Wrap(ErrNetworkFailure, "failed to create request")
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, pkgerrors.Wrap(ErrNetworkFailure, err.Error())
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, pkgerrors.Wrap(ErrInvalidGitHubToken, "unauthorized")
	}
	if resp.StatusCode == http.StatusForbidden {
		if resp.Header.Get("X-RateLimit-Remaining") == "0" {
			return nil, pkgerrors.Wrap(ErrRateLimited, "rate limit exceeded")
		}
		return nil, pkgerrors.Wrap(ErrInvalidGitHubToken, "forbidden")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, pkgerrors.Wrapf(ErrNetworkFailure, "unexpected status: %d", resp.StatusCode)
	}

	var userResp userResponse
	if err := json.NewDecoder(resp.Body).Decode(&userResp); err != nil {
		return nil, pkgerrors.Wrap(ErrNetworkFailure, "failed to parse response")
	}

	return &GitHubUser{
		AvatarURL: userResp.AvatarURL,
		Email:     userResp.Email,
		ID:        userResp.ID,
		Login:     userResp.Login,
	}, nil
}

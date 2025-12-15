package infra

import (
	"context"
	"fmt"
	"os"

	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/specvital/web/src/backend/common/crypto"
	"github.com/specvital/web/src/backend/internal/client"
	"github.com/specvital/web/src/backend/modules/auth/github"
	"github.com/specvital/web/src/backend/modules/auth/jwt"
)

type Container struct {
	DB           *pgxpool.Pool
	Encryptor    crypto.Encryptor
	GitClient    client.GitClient
	GitHubOAuth  github.Client
	JWTManager   *jwt.Manager
	Queue        *asynq.Client
	SecureCookie bool
}

type Config struct {
	DatabaseURL        string
	EncryptionKey      string
	Environment        string
	GitHubClientID     string
	GitHubClientSecret string
	GitHubRedirectURL  string
	JWTSecret          string
	RedisURL           string
	SecureCookie       bool
}

func ConfigFromEnv() Config {
	return Config{
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		EncryptionKey:      os.Getenv("ENCRYPTION_KEY"),
		Environment:        os.Getenv("ENV"),
		GitHubClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		GitHubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		GitHubRedirectURL:  os.Getenv("GITHUB_REDIRECT_URL"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		RedisURL:           os.Getenv("REDIS_URL"),
		SecureCookie:       os.Getenv("SECURE_COOKIE") == "true",
	}
}

func NewContainer(ctx context.Context, cfg Config) (*Container, error) {
	if err := validateConfig(cfg); err != nil {
		return nil, err
	}

	var cleanups []func()
	cleanup := func() {
		for i := len(cleanups) - 1; i >= 0; i-- {
			cleanups[i]()
		}
	}

	pool, err := NewPostgresPool(ctx, PostgresConfig{
		URL: cfg.DatabaseURL,
	})
	if err != nil {
		return nil, fmt.Errorf("postgres: %w", err)
	}
	cleanups = append(cleanups, pool.Close)

	jwtManager, err := jwt.NewManager(cfg.JWTSecret)
	if err != nil {
		cleanup()
		return nil, fmt.Errorf("jwt: %w", err)
	}

	queueClient, err := NewAsynqClient(cfg.RedisURL)
	if err != nil {
		cleanup()
		return nil, fmt.Errorf("asynq: %w", err)
	}
	cleanups = append(cleanups, func() { _ = queueClient.Close() })

	encryptor, err := crypto.NewEncryptorFromBase64(cfg.EncryptionKey)
	if err != nil {
		cleanup()
		return nil, fmt.Errorf("encryptor: %w", err)
	}

	githubClient, err := github.NewClient(&github.Config{
		ClientID:     cfg.GitHubClientID,
		ClientSecret: cfg.GitHubClientSecret,
		RedirectURL:  cfg.GitHubRedirectURL,
	})
	if err != nil {
		cleanup()
		return nil, fmt.Errorf("github oauth: %w", err)
	}

	gitClient := client.NewGitClient()

	return &Container{
		DB:           pool,
		Encryptor:    encryptor,
		GitClient:    gitClient,
		GitHubOAuth:  githubClient,
		JWTManager:   jwtManager,
		Queue:        queueClient,
		SecureCookie: cfg.SecureCookie,
	}, nil
}

func validateConfig(cfg Config) error {
	if cfg.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.EncryptionKey == "" {
		return fmt.Errorf("ENCRYPTION_KEY is required")
	}
	if cfg.GitHubClientID == "" {
		return fmt.Errorf("GITHUB_CLIENT_ID is required")
	}
	if cfg.GitHubClientSecret == "" {
		return fmt.Errorf("GITHUB_CLIENT_SECRET is required")
	}
	if cfg.GitHubRedirectURL == "" {
		return fmt.Errorf("GITHUB_REDIRECT_URL is required")
	}
	if cfg.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if cfg.RedisURL == "" {
		return fmt.Errorf("REDIS_URL is required")
	}
	if cfg.Environment == "production" && !cfg.SecureCookie {
		return fmt.Errorf("SECURE_COOKIE=true is required when ENV=production")
	}
	return nil
}

func (c *Container) Close() error {
	var errs []error

	if c.Queue != nil {
		if err := c.Queue.Close(); err != nil {
			errs = append(errs, fmt.Errorf("close queue: %w", err))
		}
	}
	if c.DB != nil {
		c.DB.Close()
	}

	if len(errs) > 0 {
		return fmt.Errorf("close container: %v", errs)
	}
	return nil
}

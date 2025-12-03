package middleware

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/httplog/v2"
)

const serviceName = "specvital-web"

func Logger() func(http.Handler) http.Handler {
	logger := httplog.NewLogger(serviceName, httplog.Options{
		LogLevel:       slog.LevelInfo,
		Concise:        true,
		RequestHeaders: true,
	})

	return httplog.RequestLogger(logger)
}

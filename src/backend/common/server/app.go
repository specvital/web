package server

import (
	"os"

	"github.com/specvital/web/src/backend/common/clients/github"
	"github.com/specvital/web/src/backend/common/health"
	"github.com/specvital/web/src/backend/modules/analyzer"
)

type Clients struct {
	GitHub *github.Client
}

type Services struct {
	Analyzer *analyzer.Service
}

type Handlers struct {
	Analyzer *analyzer.Handler
	Health   *health.Handler
}

type App struct {
	Clients  *Clients
	Services *Services
	Handlers *Handlers
}

func NewApp() *App {
	clients := initClients()
	services := initServices(clients)
	handlers := initHandlers(services)

	return &App{
		Clients:  clients,
		Services: services,
		Handlers: handlers,
	}
}

func initClients() *Clients {
	return &Clients{
		GitHub: github.NewClient(os.Getenv("GITHUB_TOKEN")),
	}
}

func initServices(c *Clients) *Services {
	return &Services{
		Analyzer: analyzer.NewService(c.GitHub),
	}
}

func initHandlers(s *Services) *Handlers {
	return &Handlers{
		Analyzer: analyzer.NewHandler(s.Analyzer),
		Health:   health.NewHandler(),
	}
}

func (a *App) RouteRegistrars() []RouteRegistrar {
	return []RouteRegistrar{
		a.Handlers.Analyzer,
		a.Handlers.Health,
	}
}

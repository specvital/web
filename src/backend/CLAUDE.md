# Backend CLAUDE.md

Go API server with Chi router and OpenAPI-first architecture.

## Architecture: Layered Pattern

```
Handler → Service → Domain → Repository
```

| Layer          | Responsibility                                                                   |
| -------------- | -------------------------------------------------------------------------------- |
| **Handler**    | Implements `StrictServerInterface`, HTTP validation, request/response marshaling |
| **Service**    | Business logic, returns domain types + domain errors                             |
| **Domain**     | Models (`Analysis`, `TestSuite`), status enums, custom errors                    |
| **Mapper**     | Domain → API response conversion                                                 |
| **Repository** | Database abstraction via SQLc-generated methods                                  |

### Error Handling Pattern

```go
// Service returns domain error
if repo == nil {
    return nil, domain.ErrNotFound
}

// Handler maps to HTTP status
switch {
case errors.Is(err, domain.ErrNotFound):
    return api.GetAnalysis404JSONResponse{...}, nil
}
```

## Auto-Generated Files (NEVER modify)

| File                         | Source             | Regenerate      |
| ---------------------------- | ------------------ | --------------- |
| `internal/api/server.gen.go` | `api/openapi.yaml` | `just gen-api`  |
| `internal/db/*.sql.go`       | `queries/*.sql`    | `just gen-sqlc` |

## Common Workflows

### API Change

1. Modify `api/openapi.yaml`
2. Run `just gen-api`
3. Implement handler method (satisfies `StrictServerInterface`)
4. Add service logic with domain types
5. Create mapper if new response type

### Database Change

1. Add/modify SQL in `queries/*.sql`
2. Run `just gen-sqlc`
3. Update repository to use new generated methods

### New Module

Create `modules/[name]/`:

```
modules/[name]/
├── domain/
│   ├── models.go      # Domain models
│   ├── errors.go      # Sentinel errors (ErrNotFound, etc.)
│   └── status.go      # Status enums (if needed)
├── handler.go         # StrictServerInterface implementation
├── service.go         # Business logic
├── repository.go      # Database layer (optional)
└── mapper/
    └── response.go    # Domain → API conversion
```

## Authentication

```
GitHub OAuth → JWT token → httpOnly cookie (set by frontend)
```

- OAuth config: `internal/infra/oauth.go`
- JWT handling: `modules/auth/jwt/`
- Middleware: `common/middleware/auth.go`

## Async Processing

- **Queue**: River (PostgreSQL-backed)
- **Workers**: `modules/analyzer/queue_service.go`
- Used for: Repository analysis tasks

## Environment Variables

| Variable          | Purpose                    | Default |
| ----------------- | -------------------------- | ------- |
| `PORT`            | Server port                | 8000    |
| `ALLOWED_ORIGINS` | CORS origins               | -       |
| `DATABASE_URL`    | PostgreSQL connection      | -       |
| `GITHUB_TOKEN`    | GitHub API rate limit      | -       |
| `JWT_SECRET`      | Token signing (32+ chars)  | -       |
| `ENCRYPTION_KEY`  | Sensitive data (32+ chars) | -       |
| `FRONTEND_URL`    | OAuth redirect             | -       |

## Key Patterns

### StrictServerInterface

All handlers implement the generated interface:

```go
type StrictServerInterface interface {
    GetAnalysis(ctx context.Context, request GetAnalysisRequestObject) (GetAnalysisResponseObject, error)
    // ...
}
```

### Domain Errors → HTTP Status

```go
var (
    ErrNotFound     = errors.New("not found")      // → 404
    ErrAlreadyQueued = errors.New("already queued") // → 409
    ErrRateLimited  = errors.New("rate limited")   // → 429
)
```

### SQLc Usage

```go
// queries/analysis.sql
-- name: GetAnalysis :one
SELECT * FROM analyses WHERE id = $1;

// Generated: internal/db/analysis.sql.go
func (q *Queries) GetAnalysis(ctx context.Context, id int64) (Analysis, error)
```

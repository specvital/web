# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dependencies
just deps                    # Install all dependencies

# Development
just run backend             # Go server on :8000 (uses air for hot reload)
just run frontend            # Next.js on :5173 (uses turbopack)

# Build & Test
just build                   # Build all
just build backend           # go build ./...
just build frontend          # pnpm build
just test                    # Test all
just test backend            # go test -v ./...
just test frontend           # pnpm test (vitest)

# Code Generation
just gen-api                 # Generate Go/TS types from OpenAPI spec

# Lint
just lint                    # All targets
just lint go                 # gofmt
```

## Architecture

### Backend (Go + Chi + OpenAPI)

**Architecture**: OpenAPI-First with Layered Architecture

```
src/backend/
├── cmd/server/main.go      # Entry point
├── internal/
│   ├── api/types.gen.go    # Generated from OpenAPI spec (DO NOT EDIT)
│   └── app/app.go          # Router setup with strict handler
├── api/
│   ├── openapi.yaml        # API spec (single source of truth)
│   └── oapi-codegen.yaml   # Code generation config
├── modules/
│   └── analyzer/           # Core analysis module (layered)
│       ├── domain/         # Domain layer
│       │   ├── analysis.go # Domain models (Analysis, TestSuite, TestCase)
│       │   ├── errors.go   # Domain errors (ErrNotFound, ErrAlreadyQueued)
│       │   └── status.go   # Status type definitions
│       ├── mapper/         # Mapper layer
│       │   └── response.go # Domain → API response conversion
│       ├── handler.go      # HTTP handler (StrictServerInterface)
│       └── service.go      # Business logic (returns domain types)
├── github/                 # GitHub API client
│   ├── client.go           # ListFiles, GetFileContent, rate limit tracking
│   └── errors.go           # ErrNotFound, ErrForbidden, ErrRateLimited
└── common/
    ├── config/             # Environment configuration
    ├── health/             # Health check endpoint
    ├── middleware/         # CORS, Logger, Compress
    └── server/             # Server setup utilities
```

**Type Generation**: OpenAPI spec → Go types (compile-time verified) + TS types

**Domain Layer Pattern**: Service returns domain types + domain errors → Handler maps to HTTP status

### Frontend (Next.js 16 App Router)

```
src/frontend/
├── app/[locale]/                       # i18n routing (next-intl)
│   ├── page.tsx                        # Home - URL input form
│   ├── layout.tsx                      # Locale layout with Header
│   └── analyze/[owner]/[repo]/
│       ├── page.tsx                    # Dashboard - test results
│       ├── error.tsx                   # Error boundary
│       └── loading.tsx                 # Loading skeleton
│
├── features/                           # Domain modules
│   ├── analysis/                       # Analysis feature
│   │   ├── components/                 # stats-card, test-list, etc.
│   │   └── index.ts                    # Barrel export
│   └── home/                           # Home feature
│       ├── components/                 # url-input-form
│       ├── lib/                        # github-url validation
│       └── index.ts
│
├── components/                         # Shared components
│   ├── ui/                             # shadcn/ui primitives
│   ├── layout/                         # header
│   ├── theme/                          # theme-provider, toggle, language-selector
│   └── feedback/                       # error-fallback, loading-fallback
│
├── lib/                                # Shared utilities
│   ├── api/                            # API client
│   │   ├── generated-types.ts          # Generated from OpenAPI (DO NOT EDIT)
│   │   ├── types.ts                    # Type re-exports for convenience
│   │   └── client.ts                   # API client implementation
│   ├── utils/                          # cn, formatAnalysisDate
│   └── styles/                         # framework-colors
│
├── i18n/                               # Internationalization config
└── messages/                           # i18n messages (en.json, ko.json)
```

#### Adding New Features

```typescript
// 1. Create feature folder
features/[feature-name]/
├── components/
├── api/           # (optional)
├── hooks/         # (optional)
└── index.ts       # Barrel export

// 2. Import from feature
import { Component } from "@/features/[feature-name]";
```

### Data Flow

1. User enters GitHub URL → validate → navigate to `/analyze/{owner}/{repo}`
2. Frontend calls `GET /api/analyze/{owner}/{repo}`
3. Backend fetches repo tree via GitHub API → filters test files → parses with specvital/core
4. Returns AnalysisResult with TestSuites and Summary

## Environment Variables

**Backend** (`src/backend/.env`):

- `GITHUB_TOKEN` - increases rate limit (60 → 5000/hour)
- `PORT` - default 8000
- `ALLOWED_ORIGINS` - CORS origins

**Frontend** (`src/frontend/.env`):

- `NEXT_PUBLIC_API_URL` - backend URL (default: http://localhost:8000)

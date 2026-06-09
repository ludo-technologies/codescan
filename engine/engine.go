// Package engine wires the codescan security-scan subsystem into a single unit
// that can be mounted onto any chi router. It is consumed both by the standalone
// server (cmd/server) and by hosts that embed the scan API in a larger service.
package engine

import (
	"database/sql"
	"fmt"

	"github.com/go-chi/chi/v5"

	"github.com/ludo-technologies/codescan/engine/github"
	"github.com/ludo-technologies/codescan/engine/httpapi"
	"github.com/ludo-technologies/codescan/engine/scan"
	"github.com/ludo-technologies/codescan/engine/scanner"
	"github.com/ludo-technologies/codescan/engine/store"
)

// Config holds the runtime configuration for the scan engine.
type Config struct {
	// BackendAPIKey gates the /api/scan endpoints. Required; the resource-intensive
	// scan path must never be exposed unauthenticated.
	BackendAPIKey string
	// GitHubPublicToken, when set, authenticates GitHub API calls to lift the
	// per-IP rate limit from 60/hr to 5000/hr. Optional.
	GitHubPublicToken string
	// CORSAllowedOrigins lists the browser origins permitted to call the API.
	CORSAllowedOrigins []string
	// TrustedProxyCount is the number of trusted reverse proxies in front of the
	// engine, used to resolve the real client IP from X-Forwarded-For.
	TrustedProxyCount int
}

// Engine bundles the scan controller, rate limiter, and middleware.
type Engine struct {
	db         *sql.DB
	controller *httpapi.Controller
	limiter    *httpapi.Limiter
	cors       *httpapi.CORSMiddleware
	bearer     *httpapi.BearerAuthMiddleware
}

// New builds a scan engine from the given config and database handle.
// It returns an error if required configuration is missing.
func New(cfg Config, db *sql.DB) (*Engine, error) {
	if cfg.BackendAPIKey == "" {
		return nil, fmt.Errorf("engine: BackendAPIKey is required")
	}
	if db == nil {
		return nil, fmt.Errorf("engine: db is required")
	}

	gh := github.New(github.WithToken(cfg.GitHubPublicToken))
	resultStore := store.NewCachedStore(store.NewPgStore(db))
	interactor := scan.NewInteractor(
		gh,
		scanner.NewSemgrepRunner(),
		scanner.NewGitleaksRunner(),
		scanner.NewTrivyRunner(),
		resultStore,
	)
	limiter := httpapi.NewLimiter()

	return &Engine{
		db:         db,
		controller: httpapi.NewController(interactor, resultStore, limiter, cfg.TrustedProxyCount),
		limiter:    limiter,
		cors:       httpapi.NewCORSMiddleware(cfg.CORSAllowedOrigins),
		bearer:     httpapi.NewBearerAuthMiddleware(cfg.BackendAPIKey),
	}, nil
}

// Migrate creates the scan_results table and indexes. Idempotent.
func (e *Engine) Migrate() error {
	return store.Migrate(e.db)
}

// Mount registers the scan API routes onto the given router. The bearer-protected
// endpoints are wrapped in CORS so the browser frontend can call them.
func (e *Engine) Mount(r chi.Router) {
	r.Group(func(r chi.Router) {
		r.Use(e.cors.Handler)
		r.With(e.bearer.Handler).Post("/api/scan", e.controller.HandleRequestScan)
		r.With(e.bearer.Handler).Get("/api/scan/{id}", e.controller.HandleGetScan)
		// Backs embeddable README badges; returns the latest public scan by repo.
		r.With(e.bearer.Handler).Get("/api/repo/{owner}/{repo}/scan", e.controller.HandleGetRepoScan)
	})
}

// Stop releases background resources held by the engine.
func (e *Engine) Stop() {
	e.limiter.Stop()
}

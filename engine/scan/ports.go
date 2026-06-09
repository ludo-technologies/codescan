package scan

import (
	"context"
	"io"
)

// GitHubRepository accesses GitHub repositories for scanning. When tokenOverride
// is non-empty, it is used instead of any configured token, enabling access to
// private repositories with a user-provided OAuth token.
type GitHubRepository interface {
	DownloadTarball(ctx context.Context, owner, repo, ref, tokenOverride string) (io.ReadCloser, error)
	// GetRepositoryInfo returns the repository's primary language (empty if none)
	// and whether it is private.
	GetRepositoryInfo(ctx context.Context, owner, repo, tokenOverride string) (language string, isPrivate bool, err error)
}

// SastScanner runs SAST analysis on a local directory (Semgrep).
type SastScanner interface {
	// Scan analyzes the directory using the appropriate ruleset for the language.
	Scan(ctx context.Context, dir, language string) (*SastFindings, error)
	// Version returns the scanner's reported version string.
	Version(ctx context.Context) string
}

// SecretsScanner detects committed secrets in a local directory (Gitleaks).
type SecretsScanner interface {
	Scan(ctx context.Context, dir string) (*SecretsFindings, error)
	Version(ctx context.Context) string
}

// DepsScanner detects vulnerable dependencies in a local directory (Trivy).
type DepsScanner interface {
	Scan(ctx context.Context, dir string) (*DepsFindings, error)
	Version(ctx context.Context) string
}

// ResultStore persists scan results.
type ResultStore interface {
	Create(ctx context.Context, req Request) (string, error)
	FindByID(ctx context.Context, id string) (*Result, error)
	FindByRepo(ctx context.Context, owner, repo string, requesterUserID int64) (*Result, error)
	// FindLatestPublicByRepo returns the most recent completed public scan for a
	// repo, ignoring the cache TTL. It backs embeddable README badges, which must
	// keep rendering long after a scan would have expired from the request cache.
	FindLatestPublicByRepo(ctx context.Context, owner, repo string) (*Result, error)
	UpdateRepositoryInfo(ctx context.Context, id, language string, isPrivate bool, requesterUserID int64) error
	UpdateStatus(ctx context.Context, id, status, errorMsg string) error
	UpdateResult(ctx context.Context, id string, result *Result) error
}

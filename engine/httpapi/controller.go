// Package httpapi exposes the scan engine over HTTP: the three /api/scan
// endpoints plus the CORS and bearer-auth middleware that guard them.
package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/ludo-technologies/codescan/engine/scan"
)

// Interactor defines the scan use case the controller drives.
type Interactor interface {
	RequestScan(ctx context.Context, req scan.Request) (string, bool, error)
}

// RateLimiter limits scan requests by client IP.
type RateLimiter interface {
	Allow(ip string) bool
}

// Controller handles scan API HTTP requests.
type Controller struct {
	interactor        Interactor
	scanStore         scan.ResultStore
	rateLimiter       RateLimiter
	trustedProxyCount int
}

// NewController creates a new scan controller.
func NewController(
	interactor Interactor,
	scanStore scan.ResultStore,
	rateLimiter RateLimiter,
	trustedProxyCount int,
) *Controller {
	return &Controller{
		interactor:        interactor,
		scanStore:         scanStore,
		rateLimiter:       rateLimiter,
		trustedProxyCount: trustedProxyCount,
	}
}

// clientIP derives the client IP used for rate limiting.
//
// X-Forwarded-For is only trusted when at least one proxy is configured as
// trusted: each proxy appends the IP it saw, so with N trusted proxies the
// real client sits N entries from the right. With no trusted proxy (count 0)
// the header is fully attacker-controlled and is ignored — we use the TCP peer
// address instead, which cannot be spoofed. The port is stripped so the key is
// stable across a client's connections.
func (c *Controller) clientIP(r *http.Request) string {
	if c.trustedProxyCount > 0 {
		if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
			parts := strings.Split(fwd, ",")
			idx := len(parts) - c.trustedProxyCount
			if idx < 0 {
				idx = 0
			}
			return strings.TrimSpace(parts[idx])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// scanRequest is the JSON request body for POST /api/scan.
type scanRequest struct {
	RepoURL         string `json:"repo_url"`
	GitHubToken     string `json:"github_token,omitempty"`
	RequesterUserID int64  `json:"requester_user_id,omitempty"`
}

// scanResponse is the JSON response for POST /api/scan.
type scanResponse struct {
	ScanID string `json:"scan_id"`
	Status string `json:"status"`
	Cached bool   `json:"cached"`
}

// scanResultResponse is the JSON response for GET /api/scan/{id}.
type scanResultResponse struct {
	ID              string                `json:"id"`
	Owner           string                `json:"owner"`
	Repo            string                `json:"repo"`
	Language        string                `json:"language,omitempty"`
	IsPrivate       bool                  `json:"is_private"`
	Status          string                `json:"status"`
	ErrorMessage    string                `json:"error_message,omitempty"`
	TotalScore      int                   `json:"total_score"`
	SAST            *scan.SastFindings    `json:"sast,omitempty"`
	Secrets         *scan.SecretsFindings `json:"secrets,omitempty"`
	Dependencies    *scan.DepsFindings    `json:"dependencies,omitempty"`
	ScannerVersions scan.ScannerVersions  `json:"scanner_versions"`
	RequestedAt     string                `json:"requested_at"`
	CompletedAt     *string               `json:"completed_at,omitempty"`
}

const (
	ownerMaxLen = 39
	repoMaxLen  = 100
)

// timestampLayout renders times as ISO-8601. The trailing Z is a literal, so the
// value must be normalized to UTC (.UTC()) before formatting or it would mislabel
// a non-UTC wall-clock time as UTC.
const timestampLayout = "2006-01-02T15:04:05Z"

var validNamePattern = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9._-]*$`)

// HandleRequestScan handles POST /api/scan.
func (c *Controller) HandleRequestScan(w http.ResponseWriter, r *http.Request) {
	// Rate limit by client IP.
	if !c.rateLimiter.Allow(c.clientIP(r)) {
		http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
		return
	}

	var req scanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	owner, repo, err := parseRepoURL(req.RepoURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	scanID, cached, err := c.interactor.RequestScan(r.Context(), scan.Request{
		Owner:           owner,
		Repo:            repo,
		GitHubToken:     strings.TrimSpace(req.GitHubToken),
		RequesterUserID: req.RequesterUserID,
	})
	if err != nil {
		if errors.Is(err, scan.ErrQueueFull) {
			http.Error(w, "Server is busy. Please try again later", http.StatusServiceUnavailable)
			return
		}
		log.Printf("ERROR: failed to request scan: %v", err)
		http.Error(w, "Failed to initiate scan", http.StatusInternalServerError)
		return
	}

	status := scan.StatusPending
	if cached {
		status = scan.StatusCompleted
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(scanResponse{
		ScanID: scanID,
		Status: status,
		Cached: cached,
	})
}

// HandleGetScan handles GET /api/scan/{id}.
func (c *Controller) HandleGetScan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Missing scan ID", http.StatusBadRequest)
		return
	}

	result, err := c.scanStore.FindByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Scan not found", http.StatusNotFound)
		return
	}

	// Private and token-authenticated reports must never be stored by shared
	// caches. Set this before the viewer check so even the 404 carries it.
	if result.IsPrivate || result.TokenAuthenticated {
		w.Header().Set("Cache-Control", "no-store")
	}

	// Private scan reports are only visible to the user who initiated the scan.
	// The frontend forwards the verified viewer's GitHub user ID; absent or
	// mismatched, we 404 so the report's existence is not disclosed.
	if result.IsPrivate {
		viewerID, _ := strconv.ParseInt(r.Header.Get("X-Viewer-User-ID"), 10, 64)
		if viewerID == 0 || viewerID != result.RequesterUserID {
			http.Error(w, "Scan not found", http.StatusNotFound)
			return
		}
	}

	// Public terminal results are immutable, so they are safely cacheable.
	if !result.IsPrivate && !result.TokenAuthenticated {
		if result.Status == scan.StatusCompleted || result.Status == scan.StatusFailed {
			w.Header().Set("Cache-Control", "public, max-age=86400")
		} else {
			w.Header().Set("Cache-Control", "no-store")
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(newScanResultResponse(result))
}

// HandleGetRepoScan handles GET /api/repo/{owner}/{repo}/scan. It returns the
// most recent completed public scan for a repo, ignoring the cache TTL, so that
// embeddable README badges keep rendering. Only public scans are ever returned.
func (c *Controller) HandleGetRepoScan(w http.ResponseWriter, r *http.Request) {
	owner := chi.URLParam(r, "owner")
	repo := chi.URLParam(r, "repo")
	if owner == "" || repo == "" {
		http.Error(w, "Missing owner or repo", http.StatusBadRequest)
		return
	}
	if len(owner) > ownerMaxLen || len(repo) > repoMaxLen ||
		!validNamePattern.MatchString(owner) || !validNamePattern.MatchString(repo) {
		http.Error(w, "Invalid owner or repo", http.StatusBadRequest)
		return
	}

	result, err := c.scanStore.FindLatestPublicByRepo(r.Context(), owner, repo)
	if err != nil || result == nil {
		http.Error(w, "Scan not found", http.StatusNotFound)
		return
	}

	// The query already excludes these, but a badge is public and cacheable, so
	// guard in depth against the filter ever relaxing.
	if result.IsPrivate || result.TokenAuthenticated || result.Status != scan.StatusCompleted {
		http.Error(w, "Scan not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(newScanResultResponse(result))
}

// newScanResultResponse maps a scan result to its public JSON shape.
func newScanResultResponse(result *scan.Result) scanResultResponse {
	resp := scanResultResponse{
		ID:              result.ID,
		Owner:           result.Owner,
		Repo:            result.Repo,
		Language:        result.Language,
		IsPrivate:       result.IsPrivate,
		Status:          result.Status,
		ErrorMessage:    result.ErrorMessage,
		TotalScore:      result.TotalScore,
		SAST:            result.SAST,
		Secrets:         result.Secrets,
		Dependencies:    result.Dependencies,
		ScannerVersions: result.ScannerVersions,
		RequestedAt:     result.RequestedAt.UTC().Format(timestampLayout),
	}
	if result.CompletedAt != nil {
		t := result.CompletedAt.UTC().Format(timestampLayout)
		resp.CompletedAt = &t
	}
	return resp
}

// parseRepoURL extracts owner and repo from a GitHub URL.
func parseRepoURL(repoURL string) (owner, repo string, err error) {
	repoURL = strings.TrimSpace(repoURL)
	if repoURL == "" {
		return "", "", fmt.Errorf("repo_url is required")
	}

	// Strip trailing slash and .git suffix.
	repoURL = strings.TrimSuffix(repoURL, "/")
	repoURL = strings.TrimSuffix(repoURL, ".git")

	const prefix = "https://github.com/"
	if !strings.HasPrefix(repoURL, prefix) {
		return "", "", fmt.Errorf("only https://github.com/{owner}/{repo} format is accepted")
	}

	path := strings.TrimPrefix(repoURL, prefix)
	parts := strings.SplitN(path, "/", 3)
	if len(parts) < 2 || parts[0] == "" || parts[1] == "" {
		return "", "", fmt.Errorf("invalid repository URL: must be https://github.com/{owner}/{repo}")
	}

	owner = parts[0]
	repo = parts[1]

	if len(owner) > ownerMaxLen || len(repo) > repoMaxLen {
		return "", "", fmt.Errorf("owner or repo name too long")
	}

	if !validNamePattern.MatchString(owner) || !validNamePattern.MatchString(repo) {
		return "", "", fmt.Errorf("invalid owner or repo name")
	}

	return owner, repo, nil
}

package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/ludo-technologies/codescan/engine/scan"
)

// stubInteractor is a minimal Interactor for tests.
type stubInteractor struct {
	scanID string
	cached bool
	err    error
	req    scan.Request
}

func (s *stubInteractor) RequestScan(_ context.Context, req scan.Request) (string, bool, error) {
	s.req = req
	return s.scanID, s.cached, s.err
}

// stubStore is a minimal scan.ResultStore for tests.
type stubStore struct {
	result   *scan.Result
	findErr  error
	notFound bool
}

func (s *stubStore) Create(_ context.Context, _ scan.Request) (string, error) {
	return "", nil
}
func (s *stubStore) FindByID(_ context.Context, _ string) (*scan.Result, error) {
	if s.notFound {
		return nil, errNotFound
	}
	return s.result, s.findErr
}
func (s *stubStore) FindByRepo(_ context.Context, _, _ string, _ int64) (*scan.Result, error) {
	return nil, nil
}
func (s *stubStore) FindLatestPublicByRepo(_ context.Context, _, _ string) (*scan.Result, error) {
	if s.notFound {
		return nil, errNotFound
	}
	return s.result, s.findErr
}
func (s *stubStore) UpdateRepositoryInfo(_ context.Context, _, _ string, _ bool, _ int64) error {
	return nil
}
func (s *stubStore) UpdateStatus(_ context.Context, _, _, _ string) error { return nil }
func (s *stubStore) UpdateResult(_ context.Context, _ string, _ *scan.Result) error {
	return nil
}

// stubRateLimiter always returns its configured verdict.
type stubRateLimiter struct{ allow bool }

func (s *stubRateLimiter) Allow(_ string) bool { return s.allow }

var errNotFound = &stringErr{"not found"}

type stringErr struct{ s string }

func (e *stringErr) Error() string { return e.s }

func TestParseRepoURL(t *testing.T) {
	tests := []struct {
		name, in, wantOwner, wantRepo string
		wantErr                       bool
	}{
		{"basic", "https://github.com/owner/repo", "owner", "repo", false},
		{"trailing slash", "https://github.com/owner/repo/", "owner", "repo", false},
		{".git suffix", "https://github.com/owner/repo.git", "owner", "repo", false},
		{"extra path", "https://github.com/owner/repo/tree/main", "owner", "repo", false},
		{"empty", "", "", "", true},
		{"non-github", "https://gitlab.com/owner/repo", "", "", true},
		{"missing repo", "https://github.com/owner", "", "", true},
		{"invalid name", "https://github.com/owner/.bad", "", "", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			owner, repo, err := parseRepoURL(tt.in)
			if (err != nil) != tt.wantErr {
				t.Fatalf("err=%v wantErr=%v", err, tt.wantErr)
			}
			if err != nil {
				return
			}
			if owner != tt.wantOwner || repo != tt.wantRepo {
				t.Fatalf("owner=%q repo=%q, want %q/%q", owner, repo, tt.wantOwner, tt.wantRepo)
			}
		})
	}
}

func TestClientIP(t *testing.T) {
	tests := []struct {
		name              string
		trustedProxyCount int
		remoteAddr        string
		xff               string
		want              string
	}{
		// No trusted proxy: XFF is attacker-controlled and must be ignored,
		// even when present — and must not panic (regression: parts[len(parts)]).
		{"no proxy ignores xff", 0, "203.0.113.7:54321", "1.2.3.4", "203.0.113.7"},
		{"no proxy no xff", 0, "203.0.113.7:54321", "", "203.0.113.7"},
		// One trusted proxy: real client is the rightmost entry.
		{"one proxy", 1, "10.0.0.1:1234", "1.2.3.4, 10.0.0.1", "10.0.0.1"},
		// Spoofed extra entries don't help: still take rightmost-N.
		{"two proxies", 2, "10.0.0.1:1234", "9.9.9.9, 1.2.3.4, 10.0.0.1", "1.2.3.4"},
		// More trusted proxies than entries: clamp to the leftmost entry.
		{"count exceeds entries", 5, "10.0.0.1:1234", "1.2.3.4", "1.2.3.4"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := NewController(&stubInteractor{}, &stubStore{}, &stubRateLimiter{allow: true}, tt.trustedProxyCount)
			req := httptest.NewRequest(http.MethodPost, "/api/scan", nil)
			req.RemoteAddr = tt.remoteAddr
			if tt.xff != "" {
				req.Header.Set("X-Forwarded-For", tt.xff)
			}
			if got := c.clientIP(req); got != tt.want {
				t.Fatalf("clientIP() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestHandleRequestScan_Success(t *testing.T) {
	c := NewController(
		&stubInteractor{scanID: "scan-1", cached: false},
		&stubStore{},
		&stubRateLimiter{allow: true},
		0,
	)

	body := strings.NewReader(`{"repo_url":"https://github.com/owner/repo"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/scan", body)
	rec := httptest.NewRecorder()

	c.HandleRequestScan(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	var got scanResponse
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.ScanID != "scan-1" || got.Cached || got.Status != scan.StatusPending {
		t.Fatalf("unexpected response: %+v", got)
	}
}

func TestHandleRequestScan_PassesTrimmedGitHubToken(t *testing.T) {
	stub := &stubInteractor{scanID: "scan-1", cached: false}
	c := NewController(
		stub,
		&stubStore{},
		&stubRateLimiter{allow: true},
		0,
	)

	body := strings.NewReader(`{"repo_url":"https://github.com/owner/repo","github_token":"  ghp_test  "}`)
	req := httptest.NewRequest(http.MethodPost, "/api/scan", body)
	rec := httptest.NewRecorder()

	c.HandleRequestScan(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	if stub.req.GitHubToken != "ghp_test" {
		t.Fatalf("GitHubToken = %q, want trimmed token", stub.req.GitHubToken)
	}
}

func TestHandleRequestScan_RateLimited(t *testing.T) {
	c := NewController(
		&stubInteractor{},
		&stubStore{},
		&stubRateLimiter{allow: false},
		0,
	)
	req := httptest.NewRequest(http.MethodPost, "/api/scan",
		strings.NewReader(`{"repo_url":"https://github.com/owner/repo"}`))
	rec := httptest.NewRecorder()
	c.HandleRequestScan(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rec.Code)
	}
}

func TestHandleGetScan_NewContract(t *testing.T) {
	completed := time.Now()
	result := &scan.Result{
		ID:         "scan-1",
		Owner:      "owner",
		Repo:       "repo",
		Language:   "Python",
		Status:     scan.StatusCompleted,
		TotalScore: 75,
		SAST: &scan.SastFindings{
			ErrorCount: 1, WarningCount: 2, InfoCount: 5,
			Findings: []scan.SastFinding{{File: "app.py", Line: 10, RuleID: "r", Severity: "ERROR", Message: "m"}},
		},
		Secrets: &scan.SecretsFindings{
			CriticalCount: 0,
			Findings:      []scan.SecretFinding{},
		},
		Dependencies: &scan.DepsFindings{
			HighCount: 1,
			Findings:  []scan.DepFinding{{Package: "django", InstalledVersion: "1.11.0", Severity: "HIGH", CVE: "CVE-X", Title: "t"}},
		},
		ScannerVersions: scan.ScannerVersions{Semgrep: "1.0", Gitleaks: "8.0", Trivy: "0.50"},
		RequestedAt:     time.Now(),
		CompletedAt:     &completed,
	}

	c := NewController(
		&stubInteractor{},
		&stubStore{result: result},
		&stubRateLimiter{allow: true},
		0,
	)

	// Route via chi so URLParam works.
	r := chi.NewRouter()
	r.Get("/api/scan/{id}", c.HandleGetScan)

	req := httptest.NewRequest(http.MethodGet, "/api/scan/scan-1", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}

	var got scanResultResponse
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.TotalScore != 75 {
		t.Errorf("TotalScore: got %d, want 75", got.TotalScore)
	}
	if got.SAST == nil || got.SAST.ErrorCount != 1 || got.SAST.WarningCount != 2 {
		t.Errorf("SAST shape mismatch: %+v", got.SAST)
	}
	if got.Dependencies == nil || got.Dependencies.HighCount != 1 {
		t.Errorf("Dependencies shape mismatch: %+v", got.Dependencies)
	}
	if got.ScannerVersions.Semgrep == "" {
		t.Error("ScannerVersions.Semgrep should not be empty")
	}

	// Cache header for terminal state.
	if !strings.Contains(rec.Header().Get("Cache-Control"), "max-age") {
		t.Errorf("Cache-Control should be cached for completed; got %q", rec.Header().Get("Cache-Control"))
	}
}

func TestHandleGetScan_PrivateResultUsesNoStoreCache(t *testing.T) {
	completed := time.Now()
	result := &scan.Result{
		ID:              "scan-1",
		Owner:           "owner",
		Repo:            "repo",
		IsPrivate:       true,
		RequesterUserID: 42,
		Status:          scan.StatusCompleted,
		RequestedAt:     time.Now(),
		CompletedAt:     &completed,
	}

	c := NewController(
		&stubInteractor{},
		&stubStore{result: result},
		&stubRateLimiter{allow: true},
		0,
	)
	r := chi.NewRouter()
	r.Get("/api/scan/{id}", c.HandleGetScan)

	req := httptest.NewRequest(http.MethodGet, "/api/scan/scan-1", nil)
	req.Header.Set("X-Viewer-User-ID", "42")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	if got := rec.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", got)
	}
}

func TestHandleGetScan_PrivateResultRequiresRequester(t *testing.T) {
	result := &scan.Result{
		ID:              "scan-1",
		Owner:           "owner",
		Repo:            "repo",
		IsPrivate:       true,
		RequesterUserID: 42,
		Status:          scan.StatusCompleted,
		RequestedAt:     time.Now(),
	}

	c := NewController(
		&stubInteractor{},
		&stubStore{result: result},
		&stubRateLimiter{allow: true},
		0,
	)
	r := chi.NewRouter()
	r.Get("/api/scan/{id}", c.HandleGetScan)

	req := httptest.NewRequest(http.MethodGet, "/api/scan/scan-1", nil)
	req.Header.Set("X-Viewer-User-ID", "7")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
	if got := rec.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", got)
	}
}

func TestHandleGetScan_TokenAuthenticatedResultUsesNoStoreCache(t *testing.T) {
	result := &scan.Result{
		ID:                 "scan-1",
		Owner:              "owner",
		Repo:               "repo",
		TokenAuthenticated: true,
		Status:             scan.StatusFailed,
		RequestedAt:        time.Now(),
	}

	c := NewController(
		&stubInteractor{},
		&stubStore{result: result},
		&stubRateLimiter{allow: true},
		0,
	)
	r := chi.NewRouter()
	r.Get("/api/scan/{id}", c.HandleGetScan)

	req := httptest.NewRequest(http.MethodGet, "/api/scan/scan-1", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	if got := rec.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", got)
	}
}

func TestHandleGetScan_NotFound(t *testing.T) {
	c := NewController(
		&stubInteractor{},
		&stubStore{notFound: true},
		&stubRateLimiter{allow: true},
		0,
	)
	r := chi.NewRouter()
	r.Get("/api/scan/{id}", c.HandleGetScan)

	req := httptest.NewRequest(http.MethodGet, "/api/scan/missing", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
}

// Package github accesses GitHub repositories (tarball download + metadata) for
// the scan engine. It implements scan.GitHubRepository.
package github

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	apiBaseURL = "https://api.github.com"
	timeout    = 60 * time.Second
)

// ErrInvalidRef is returned when a git ref contains dangerous characters.
var ErrInvalidRef = errors.New("invalid git ref")

// Gateway accesses GitHub repositories. If an access token is configured,
// authenticated requests are used to raise GitHub's per-IP rate limit from
// 60/hr (unauthenticated) to 5000/hr (authenticated).
type Gateway struct {
	httpClient *http.Client
	baseURL    string
	token      string
}

// Option configures a Gateway.
type Option func(*Gateway)

// WithToken sets a GitHub access token used to authenticate API calls.
// Pass an empty string (or omit the option) to keep unauthenticated behaviour.
func WithToken(token string) Option {
	return func(g *Gateway) { g.token = token }
}

// New creates a new GitHub gateway.
func New(opts ...Option) *Gateway {
	g := &Gateway{
		httpClient: &http.Client{Timeout: timeout},
		baseURL:    apiBaseURL,
	}
	for _, opt := range opts {
		opt(g)
	}
	return g
}

// setCommonHeaders attaches the standard GitHub API headers and an Authorization
// header. tokenOverride takes precedence over the gateway's configured token.
func (g *Gateway) setCommonHeaders(req *http.Request, tokenOverride string) {
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	token := strings.TrimSpace(tokenOverride)
	if token == "" {
		token = strings.TrimSpace(g.token)
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
}

func isRateLimited(resp *http.Response) bool {
	return resp.Header.Get("X-RateLimit-Remaining") == "0"
}

// validateRef checks that a git ref doesn't contain dangerous characters.
func validateRef(ref string) error {
	if ref == "" {
		return nil
	}
	// Reject path traversal.
	if strings.Contains(ref, "..") {
		return ErrInvalidRef
	}
	// Reject null bytes (can cause truncation in C-based systems).
	if strings.ContainsRune(ref, '\x00') {
		return ErrInvalidRef
	}
	return nil
}

// DownloadTarball downloads a repository as a gzipped tarball.
// If tokenOverride is non-empty it is used for authentication, enabling private repo access.
func (g *Gateway) DownloadTarball(ctx context.Context, owner, repo, ref, tokenOverride string) (io.ReadCloser, error) {
	if err := validateRef(ref); err != nil {
		return nil, err
	}

	apiURL := fmt.Sprintf("%s/repos/%s/%s/tarball", g.baseURL, owner, repo)
	if ref != "" {
		apiURL += "/" + url.PathEscape(ref)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	g.setCommonHeaders(req, tokenOverride)

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to download tarball: %w", err)
	}

	switch resp.StatusCode {
	case http.StatusOK:
		return resp.Body, nil
	case http.StatusUnauthorized:
		resp.Body.Close()
		return nil, fmt.Errorf("GitHub authentication failed")
	case http.StatusNotFound:
		resp.Body.Close()
		return nil, fmt.Errorf("repository not found or private: %s/%s", owner, repo)
	case http.StatusForbidden:
		resp.Body.Close()
		if isRateLimited(resp) {
			return nil, fmt.Errorf("GitHub API rate limit exceeded")
		}
		return nil, fmt.Errorf("GitHub token lacks access to repository: %s/%s", owner, repo)
	default:
		resp.Body.Close()
		return nil, fmt.Errorf("failed to download tarball: status %d", resp.StatusCode)
	}
}

// GetRepositoryInfo returns the primary language of a repository (empty string if
// none is detected) and whether the repository is private, via the GitHub API.
func (g *Gateway) GetRepositoryInfo(ctx context.Context, owner, repo, tokenOverride string) (string, bool, error) {
	apiURL := fmt.Sprintf("%s/repos/%s/%s", g.baseURL, url.PathEscape(owner), url.PathEscape(repo))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return "", false, fmt.Errorf("failed to create request: %w", err)
	}

	g.setCommonHeaders(req, tokenOverride)

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", false, fmt.Errorf("failed to fetch repository info: %w", err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		// OK
	case http.StatusUnauthorized:
		return "", false, fmt.Errorf("GitHub authentication failed")
	case http.StatusNotFound:
		return "", false, fmt.Errorf("repository not found or private: %s/%s", owner, repo)
	case http.StatusForbidden:
		if isRateLimited(resp) {
			return "", false, fmt.Errorf("GitHub API rate limit exceeded")
		}
		return "", false, fmt.Errorf("GitHub token lacks access to repository: %s/%s", owner, repo)
	default:
		return "", false, fmt.Errorf("failed to fetch repository info: status %d", resp.StatusCode)
	}

	var repoInfo struct {
		Language *string `json:"language"`
		Private  bool    `json:"private"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&repoInfo); err != nil {
		return "", false, fmt.Errorf("failed to decode repository info: %w", err)
	}

	language := ""
	if repoInfo.Language != nil {
		language = *repoInfo.Language
	}
	return language, repoInfo.Private, nil
}

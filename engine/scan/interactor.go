package scan

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

const (
	maxTarballSize = 100 * 1024 * 1024 // 100MB cap on the compressed download
	// maxExtractedSize and maxExtractedFiles bound decompression so a crafted
	// (highly compressible) tarball cannot exhaust disk or inodes during extract.
	maxExtractedSize  = 500 * 1024 * 1024 // 500MB total uncompressed
	maxExtractedFiles = 50000             // total regular files
	tempDirPrefix     = "codescan-"
	// One scan at a time: each scan already runs three analyzers in parallel,
	// and the production host (2GB / 1 CPU, shared with other workloads) cannot
	// absorb two concurrent scans without timeouts and OOM kills.
	maxConcurrentScans = 1
	maxPendingScans    = 10
	scanTimeout        = 10 * time.Minute
	// persistTimeout bounds DB writes that must succeed even after the scan
	// context has expired (e.g. recording a timed-out scan as failed).
	persistTimeout = 30 * time.Second
)

// ErrQueueFull is returned when the scan queue has reached its capacity.
var ErrQueueFull = fmt.Errorf("scan queue is full")

// skippedDirNames are vendored or generated directories dropped at extraction
// time. Scanners produce no actionable findings from them, and on large repos
// they are what exhausts the file-count and size budgets: Trivy reads lockfiles
// at the project root, Semgrep ignores these paths by default, and Gitleaks
// only wastes I/O re-scanning third-party code.
var skippedDirNames = map[string]struct{}{
	"node_modules":     {},
	"vendor":           {},
	"bower_components": {},
	"dist":             {},
	"build":            {},
	".next":            {},
	"target":           {},
	"__pycache__":      {},
	"venv":             {},
	".venv":            {},
}

// skippedExtensions are binary or generated formats no scanner extracts findings from.
var skippedExtensions = map[string]struct{}{
	".png": {}, ".jpg": {}, ".jpeg": {}, ".gif": {}, ".ico": {}, ".webp": {}, ".bmp": {},
	".woff": {}, ".woff2": {}, ".ttf": {}, ".otf": {}, ".eot": {},
	".mp3": {}, ".mp4": {}, ".mov": {}, ".avi": {}, ".webm": {}, ".ogg": {}, ".wav": {},
	".pdf": {}, ".wasm": {}, ".map": {},
}

// skipEntry reports whether a tarball entry should be dropped at extraction
// time. name is the raw tar header path with the archive root prefix included;
// the root segment is a GitHub-generated "owner-repo-sha" name, so matching
// skippedDirNames against every segment is safe.
func skipEntry(name string) bool {
	for _, seg := range strings.Split(strings.Trim(name, "/"), "/") {
		if _, ok := skippedDirNames[seg]; ok {
			return true
		}
	}
	base := strings.ToLower(path.Base(name))
	if strings.HasSuffix(base, ".min.js") || strings.HasSuffix(base, ".min.css") {
		return true
	}
	if _, ok := skippedExtensions[path.Ext(base)]; ok {
		return true
	}
	return false
}

// Interactor coordinates a security scan: download tarball, run Semgrep/Gitleaks/Trivy
// in parallel, compute the total score, and persist the result.
type Interactor struct {
	gh          GitHubRepository
	sastScan    SastScanner
	secretsScan SecretsScanner
	depsScan    DepsScanner
	scanStore   ResultStore
	sem         chan struct{}
	pending     chan struct{}
}

// NewInteractor creates a new scan interactor.
func NewInteractor(
	gh GitHubRepository,
	sastScan SastScanner,
	secretsScan SecretsScanner,
	depsScan DepsScanner,
	scanStore ResultStore,
) *Interactor {
	return &Interactor{
		gh:          gh,
		sastScan:    sastScan,
		secretsScan: secretsScan,
		depsScan:    depsScan,
		scanStore:   scanStore,
		sem:         make(chan struct{}, maxConcurrentScans),
		pending:     make(chan struct{}, maxPendingScans),
	}
}

// RequestScan initiates a scan for a repository.
// Returns (scanID, cached, error). If a cached result exists, cached=true.
func (i *Interactor) RequestScan(ctx context.Context, req Request) (string, bool, error) {
	req.GitHubToken = strings.TrimSpace(req.GitHubToken)

	if req.GitHubToken == "" {
		cached, err := i.scanStore.FindByRepo(ctx, req.Owner, req.Repo, req.RequesterUserID)
		if err == nil && cached != nil {
			return cached.ID, true, nil
		}
	}

	scanID, err := i.scanStore.Create(ctx, req)
	if err != nil {
		return "", false, fmt.Errorf("failed to create scan record: %w", err)
	}

	select {
	case i.pending <- struct{}{}:
	default:
		_ = i.scanStore.UpdateStatus(ctx, scanID, StatusFailed, "Server is busy. Please try again later")
		return "", false, ErrQueueFull
	}

	go i.runScan(scanID, req)

	return scanID, false, nil
}

func (i *Interactor) runScan(scanID string, req Request) {
	defer func() { <-i.pending }()

	i.sem <- struct{}{}
	defer func() { <-i.sem }()

	ctx, cancel := context.WithTimeout(context.Background(), scanTimeout)
	defer cancel()

	if err := i.scanStore.UpdateStatus(ctx, scanID, StatusRunning, ""); err != nil {
		log.Printf("ERROR: failed to update scan status to running: %v", err)
		return
	}

	// Primary language is used only to pick the Semgrep ruleset.
	// Empty / unsupported languages fall back to p/default — the scan still runs.
	language, isPrivate, err := i.gh.GetRepositoryInfo(ctx, req.Owner, req.Repo, req.GitHubToken)
	if err != nil {
		log.Printf("ERROR: scan %s language detection failed: %v", scanID, err)
		i.markFailed(scanID, userSafeError(err))
		return
	}
	if err := i.scanStore.UpdateRepositoryInfo(ctx, scanID, language, isPrivate, req.RequesterUserID); err != nil {
		log.Printf("ERROR: scan %s failed to persist repository metadata: %v", scanID, err)
		i.markFailed(scanID, userSafeError(err))
		return
	}

	extractDir, commitSHA, cleanup, err := i.downloadAndExtract(ctx, req)
	if err != nil {
		log.Printf("ERROR: scan %s download failed: %v", scanID, err)
		i.markFailed(scanID, userSafeError(err))
		return
	}
	defer cleanup()

	sastResult, secretsResult, depsResult, err := i.runScanners(ctx, scanID, extractDir, language)
	if err != nil {
		log.Printf("ERROR: scan %s scanner execution failed: %v", scanID, err)
		i.markFailed(scanID, userSafeError(err))
		return
	}

	totalScore := calculateTotalScore(sastResult, secretsResult, depsResult)

	// The scan context may be at (or past) its deadline by now; persisting the
	// finished result must not be cancelled by it.
	persistCtx, cancelPersist := context.WithTimeout(context.Background(), persistTimeout)
	defer cancelPersist()

	result := &Result{
		CommitSHA:       commitSHA,
		Language:        language,
		IsPrivate:       isPrivate,
		RequesterUserID: req.RequesterUserID,
		TotalScore:      totalScore,
		SAST:            sastResult,
		Secrets:         secretsResult,
		Dependencies:    depsResult,
		ScannerVersions: ScannerVersions{
			Semgrep:  i.sastScan.Version(persistCtx),
			Gitleaks: i.secretsScan.Version(persistCtx),
			Trivy:    i.depsScan.Version(persistCtx),
		},
	}

	if err := i.scanStore.UpdateResult(persistCtx, scanID, result); err != nil {
		log.Printf("ERROR: scan %s failed to save result: %v", scanID, err)
		i.markFailed(scanID, "Failed to save scan results")
		return
	}

	log.Printf("INFO: scan %s completed for %s/%s (lang=%s, score=%d)",
		scanID, req.Owner, req.Repo, language, totalScore)
}

// markFailed records a failed status using a fresh context. The scan context
// must never be used here: when a scan times out it is already expired, so an
// UpdateStatus call carrying it fails immediately and the row would be stuck
// in "running" forever while clients keep polling.
func (i *Interactor) markFailed(scanID, msg string) {
	ctx, cancel := context.WithTimeout(context.Background(), persistTimeout)
	defer cancel()
	if err := i.scanStore.UpdateStatus(ctx, scanID, StatusFailed, msg); err != nil {
		log.Printf("ERROR: scan %s failed to record failed status: %v", scanID, err)
	}
}

// runScanners runs the three scanners one after another and returns their results.
//
// Serial (not parallel) execution is deliberate: on the 2GB / 1-CPU production
// host with no swap, running Semgrep, Gitleaks and Trivy concurrently makes their
// peak memory add up and the kernel OOM-kills one of them, which previously failed
// the whole scan. Running them in sequence caps peak memory at the largest single
// scanner instead of the sum, so memory-heavy repos complete. The host has a single
// core anyway, so the wall-clock cost of serializing is small.
//
// Graceful degradation: a single scanner failing (e.g. an OOM or per-file timeout
// on a pathological input) no longer discards the other two scanners' results. The
// whole scan is failed only when *every* scanner failed — which is also what a
// global scan timeout looks like, since all three then return context errors.
func (i *Interactor) runScanners(ctx context.Context, scanID, dir, language string) (
	*SastFindings, *SecretsFindings, *DepsFindings, error,
) {
	sastResult, sastErr := i.sastScan.Scan(ctx, dir, language)
	if sastErr != nil {
		log.Printf("WARN: scan %s sast scanner failed: %v", scanID, sastErr)
	}

	secretsResult, secretsErr := i.secretsScan.Scan(ctx, dir)
	if secretsErr != nil {
		log.Printf("WARN: scan %s secrets scanner failed: %v", scanID, secretsErr)
	}

	depsResult, depsErr := i.depsScan.Scan(ctx, dir)
	if depsErr != nil {
		log.Printf("WARN: scan %s deps scanner failed: %v", scanID, depsErr)
	}

	if sastErr != nil && secretsErr != nil && depsErr != nil {
		// Every scanner failed: this is a genuine failure (typically the global
		// scan timeout, which surfaces as a context error in all three).
		return nil, nil, nil, fmt.Errorf("all scanners failed: sast: %w; secrets: %v; deps: %v",
			sastErr, secretsErr, depsErr)
	}

	return sastResult, secretsResult, depsResult, nil
}

// calculateTotalScore applies the penalty rules.
func calculateTotalScore(
	sast *SastFindings,
	secrets *SecretsFindings,
	deps *DepsFindings,
) int {
	penalty := 0

	if sast != nil {
		penalty += sast.ErrorCount * PenaltySastError
		penalty += sast.WarningCount * PenaltySastWarning
		// INFO: -0 (no penalty)
	}

	if secrets != nil {
		penalty += secrets.CriticalCount * PenaltySecretCritical
	}

	if deps != nil {
		penalty += deps.CriticalCount * PenaltyDepCritical
		penalty += deps.HighCount * PenaltyDepHigh
		penalty += deps.MediumCount * PenaltyDepMedium
		penalty += deps.LowCount * PenaltyDepLow
	}

	score := BaseScore - penalty
	if score < MinScore {
		return MinScore
	}
	return score
}

func (i *Interactor) downloadAndExtract(ctx context.Context, req Request) (extractDir string, commitSHA string, cleanup func(), err error) {
	tarballReader, err := i.gh.DownloadTarball(ctx, req.Owner, req.Repo, req.Ref, req.GitHubToken)
	if err != nil {
		return "", "", nil, fmt.Errorf("failed to download tarball: %w", err)
	}
	defer tarballReader.Close()

	tmpDir, err := os.MkdirTemp("", tempDirPrefix)
	if err != nil {
		return "", "", nil, fmt.Errorf("failed to create temp directory: %w", err)
	}

	cleanup = func() {
		os.RemoveAll(tmpDir)
	}

	extractDir, commitSHA, err = extractTarball(tarballReader, tmpDir)
	if err != nil {
		cleanup()
		return "", "", nil, fmt.Errorf("failed to extract tarball: %w", err)
	}

	return extractDir, commitSHA, cleanup, nil
}

func extractTarball(reader io.Reader, targetDir string) (extractDir string, commitSHA string, err error) {
	limitedReader := io.LimitReader(reader, maxTarballSize)

	gzReader, err := gzip.NewReader(limitedReader)
	if err != nil {
		return "", "", fmt.Errorf("failed to create gzip reader: %w", err)
	}
	defer gzReader.Close()

	tarReader := tar.NewReader(gzReader)
	var (
		rootDir      string
		totalWritten int64
		fileCount    int
		skippedCount int
	)

	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", "", fmt.Errorf("failed to read tar header: %w", err)
		}

		if header.Typeflag == tar.TypeXGlobalHeader || header.Typeflag == tar.TypeXHeader {
			continue
		}

		if rootDir == "" && header.Typeflag == tar.TypeDir {
			parts := strings.SplitN(header.Name, "/", 2)
			if len(parts) > 0 {
				rootDir = parts[0]
			}
		}

		targetPath := filepath.Join(targetDir, header.Name)
		if !strings.HasPrefix(targetPath, filepath.Clean(targetDir)+string(os.PathSeparator)) {
			return "", "", fmt.Errorf("invalid file path in tarball: %s", header.Name)
		}

		switch header.Typeflag {
		case tar.TypeDir:
			if skipEntry(header.Name) {
				continue
			}
			if err := os.MkdirAll(targetPath, 0755); err != nil {
				return "", "", fmt.Errorf("failed to create directory: %w", err)
			}
		case tar.TypeReg:
			// Skipped entries bypass the file/size budgets so vendored bulk
			// doesn't crowd out the code the scanners should actually see.
			if skipEntry(header.Name) {
				skippedCount++
				continue
			}
			fileCount++
			if fileCount > maxExtractedFiles {
				return "", "", fmt.Errorf("tarball exceeds the %d-file extraction limit", maxExtractedFiles)
			}

			if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
				return "", "", fmt.Errorf("failed to create parent directory: %w", err)
			}

			outFile, err := os.Create(targetPath)
			if err != nil {
				return "", "", fmt.Errorf("failed to create file: %w", err)
			}

			// Read one byte past the remaining budget so an over-limit file is
			// detected rather than silently truncated.
			remaining := maxExtractedSize - totalWritten
			n, err := io.Copy(outFile, io.LimitReader(tarReader, remaining+1))
			outFile.Close()
			if err != nil {
				return "", "", fmt.Errorf("failed to write file: %w", err)
			}
			totalWritten += n
			if totalWritten > maxExtractedSize {
				return "", "", fmt.Errorf("tarball exceeds the %d-byte extraction limit", maxExtractedSize)
			}
		}
	}

	if rootDir == "" {
		return "", "", fmt.Errorf("empty tarball")
	}

	if skippedCount > 0 {
		log.Printf("extract: skipped %d vendored/binary entries (%d files extracted)", skippedCount, fileCount)
	}

	if lastDash := strings.LastIndex(rootDir, "-"); lastDash != -1 {
		commitSHA = rootDir[lastDash+1:]
	}

	return filepath.Join(targetDir, rootDir), commitSHA, nil
}

// userSafeError returns a safe error message for user-facing responses.
// Internal details (file paths, connection strings, etc.) are logged but not exposed.
func userSafeError(err error) string {
	msg := err.Error()
	switch {
	case strings.Contains(msg, "repository not found or private"):
		return "Repository not found or is private"
	case strings.Contains(msg, "authentication failed"):
		return "GitHub authentication failed. Please check the token"
	case strings.Contains(msg, "token lacks access"):
		return "GitHub token does not have access to the repository"
	case strings.Contains(msg, "rate limit"):
		return "GitHub API rate limit exceeded. Please try again later"
	case strings.Contains(msg, "tarball"):
		return "Failed to download repository"
	case strings.Contains(msg, "context deadline exceeded"), strings.Contains(msg, "context canceled"):
		return "Analysis timed out. The repository may be too large"
	case strings.Contains(msg, "sast:"):
		return "SAST analysis failed. Please try again later"
	case strings.Contains(msg, "secrets:"):
		return "Secret detection failed. Please try again later"
	case strings.Contains(msg, "deps:"):
		return "Dependency vulnerability scan failed. Please try again later"
	default:
		return "Analysis failed. Please try again later"
	}
}

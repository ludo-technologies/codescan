package scanner

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/ludo-technologies/codescan/engine/scan"
)

// GitleaksRunner executes Gitleaks against a local directory.
type GitleaksRunner struct {
	gitleaksPath string
	cmdExecutor  CommandExecutor
}

// GitleaksOption configures a GitleaksRunner.
type GitleaksOption func(*GitleaksRunner)

// WithGitleaksPath overrides the gitleaks executable path.
func WithGitleaksPath(path string) GitleaksOption {
	return func(g *GitleaksRunner) { g.gitleaksPath = path }
}

// WithGitleaksCommandExecutor injects a CommandExecutor (for testing).
func WithGitleaksCommandExecutor(exec CommandExecutor) GitleaksOption {
	return func(g *GitleaksRunner) { g.cmdExecutor = exec }
}

// NewGitleaksRunner creates a new GitleaksRunner with sensible defaults.
func NewGitleaksRunner(opts ...GitleaksOption) *GitleaksRunner {
	g := &GitleaksRunner{
		gitleaksPath: "gitleaks",
		cmdExecutor:  &realCommandExecutor{},
	}
	for _, opt := range opts {
		opt(g)
	}
	return g
}

// gitleaksFinding is the JSON shape of a single Gitleaks finding.
// `Match` and `Secret` are intentionally NOT decoded; those raw secret values must
// never be persisted or surfaced through the API.
type gitleaksFinding struct {
	RuleID      string `json:"RuleID"`
	Description string `json:"Description"`
	StartLine   int    `json:"StartLine"`
	File        string `json:"File"`
}

// Scan runs Gitleaks against the directory in no-git mode and parses the report.
func (g *GitleaksRunner) Scan(ctx context.Context, dir string) (*scan.SecretsFindings, error) {
	reportFile, err := os.CreateTemp("", "gitleaks-report-*.json")
	if err != nil {
		return nil, fmt.Errorf("create gitleaks report file: %w", err)
	}
	reportPath := reportFile.Name()
	reportFile.Close()
	defer os.Remove(reportPath)

	cmd := g.cmdExecutor.CommandContext(ctx, g.gitleaksPath,
		"detect",
		"--no-git",
		"--no-banner",
		"--source", dir,
		"--report-format", "json",
		"--report-path", reportPath,
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	// Gitleaks exits with code 1 when leaks are found; all other execution
	// errors mean the scan did not complete and must not be reported as clean.
	leaksFound := false
	if err := cmd.Run(); err != nil {
		var exitErr *exec.ExitError
		if !errors.As(err, &exitErr) || exitErr.ExitCode() != 1 {
			return nil, fmt.Errorf("run gitleaks: %w (stderr: %s)", err, truncate(stderr.String()))
		}
		leaksFound = true
	}

	data, err := os.ReadFile(reportPath)
	if err != nil {
		return nil, fmt.Errorf("read gitleaks report: %w (stderr: %s)", err, truncate(stderr.String()))
	}
	if leaksFound && len(bytes.TrimSpace(data)) == 0 {
		return nil, fmt.Errorf("gitleaks reported leaks but wrote an empty report (stderr: %s)", truncate(stderr.String()))
	}

	return parseGitleaksOutput(data, dir)
}

// Version returns the Gitleaks version string.
func (g *GitleaksRunner) Version(ctx context.Context) string {
	cmd := g.cmdExecutor.CommandContext(ctx, g.gitleaksPath, "version")
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	if err := cmd.Run(); err != nil {
		return ""
	}
	return strings.TrimSpace(stdout.String())
}

// parseGitleaksOutput parses Gitleaks JSON output and strips tmpDir from file paths.
// All findings are treated as CRITICAL because Gitleaks does not classify severity.
// The raw secret value is intentionally dropped.
func parseGitleaksOutput(data []byte, tmpDir string) (*scan.SecretsFindings, error) {
	// An empty report file is a valid "no findings" outcome.
	if len(bytes.TrimSpace(data)) == 0 {
		return &scan.SecretsFindings{Findings: []scan.SecretFinding{}}, nil
	}

	var raw []gitleaksFinding
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parse gitleaks output: %w", err)
	}

	findings := &scan.SecretsFindings{
		CriticalCount: len(raw),
		Findings:      make([]scan.SecretFinding, 0, len(raw)),
	}
	for _, r := range raw {
		findings.Findings = append(findings.Findings, scan.SecretFinding{
			File:        stripTmpPrefix(r.File, tmpDir),
			Line:        r.StartLine,
			RuleID:      r.RuleID,
			Description: r.Description,
		})
	}
	return findings, nil
}

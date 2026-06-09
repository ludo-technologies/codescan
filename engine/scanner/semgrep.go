package scanner

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/ludo-technologies/codescan/engine/scan"
)

// SemgrepRunner executes Semgrep CE against a local directory.
type SemgrepRunner struct {
	semgrepPath string
	cmdExecutor CommandExecutor
}

// SemgrepOption configures a SemgrepRunner.
type SemgrepOption func(*SemgrepRunner)

// WithSemgrepPath overrides the semgrep executable path.
func WithSemgrepPath(path string) SemgrepOption {
	return func(g *SemgrepRunner) { g.semgrepPath = path }
}

// WithSemgrepCommandExecutor injects a CommandExecutor (for testing).
func WithSemgrepCommandExecutor(exec CommandExecutor) SemgrepOption {
	return func(g *SemgrepRunner) { g.cmdExecutor = exec }
}

// NewSemgrepRunner creates a new SemgrepRunner with sensible defaults.
func NewSemgrepRunner(opts ...SemgrepOption) *SemgrepRunner {
	g := &SemgrepRunner{
		semgrepPath: "semgrep",
		cmdExecutor: &realCommandExecutor{},
	}
	for _, opt := range opts {
		opt(g)
	}
	return g
}

// semgrepOutput represents the relevant portion of Semgrep's JSON output.
type semgrepOutput struct {
	Results []semgrepResult `json:"results"`
}

type semgrepResult struct {
	CheckID string             `json:"check_id"`
	Path    string             `json:"path"`
	Start   semgrepPosition    `json:"start"`
	Extra   semgrepResultExtra `json:"extra"`
}

type semgrepPosition struct {
	Line int `json:"line"`
}

type semgrepResultExtra struct {
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

// Scan runs Semgrep against the directory using the pack for the given language.
func (g *SemgrepRunner) Scan(ctx context.Context, dir, language string) (*scan.SastFindings, error) {
	pack := scan.SemgrepConfigFor(language)
	cmd := g.cmdExecutor.CommandContext(ctx, g.semgrepPath,
		"--config="+pack,
		"--json", "--quiet",
		"--no-rewrite-rule-ids",
		dir,
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("semgrep execution failed: %w (stderr: %s)", err, truncate(stderr.String()))
	}

	return parseSemgrepOutput(stdout.Bytes(), dir)
}

// Version returns the Semgrep version string.
func (g *SemgrepRunner) Version(ctx context.Context) string {
	cmd := g.cmdExecutor.CommandContext(ctx, g.semgrepPath, "--version")
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	if err := cmd.Run(); err != nil {
		return ""
	}
	return strings.TrimSpace(stdout.String())
}

// parseSemgrepOutput parses Semgrep JSON output, strips tmpDir prefix from file paths,
// and aggregates counts. INFO-severity findings are excluded from the Findings slice but
// still counted in InfoCount.
func parseSemgrepOutput(data []byte, tmpDir string) (*scan.SastFindings, error) {
	var raw semgrepOutput
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parse semgrep output: %w", err)
	}

	findings := &scan.SastFindings{Findings: make([]scan.SastFinding, 0, len(raw.Results))}

	for _, r := range raw.Results {
		switch r.Extra.Severity {
		case scan.SastSeverityError:
			findings.ErrorCount++
		case scan.SastSeverityWarning:
			findings.WarningCount++
		case scan.SastSeverityInfo:
			findings.InfoCount++
			continue
		default:
			// Unknown severities are skipped from both counts and findings.
			continue
		}

		findings.Findings = append(findings.Findings, scan.SastFinding{
			File:     stripTmpPrefix(r.Path, tmpDir),
			Line:     r.Start.Line,
			RuleID:   r.CheckID,
			Severity: r.Extra.Severity,
			Message:  r.Extra.Message,
		})
	}

	return findings, nil
}

package scanner

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/ludo-technologies/codescan/engine/scan"
)

// TrivyRunner executes Trivy fs scan against a local directory.
type TrivyRunner struct {
	trivyPath   string
	cmdExecutor CommandExecutor
}

// TrivyOption configures a TrivyRunner.
type TrivyOption func(*TrivyRunner)

// WithTrivyPath overrides the trivy executable path.
func WithTrivyPath(path string) TrivyOption {
	return func(g *TrivyRunner) { g.trivyPath = path }
}

// WithTrivyCommandExecutor injects a CommandExecutor (for testing).
func WithTrivyCommandExecutor(exec CommandExecutor) TrivyOption {
	return func(g *TrivyRunner) { g.cmdExecutor = exec }
}

// NewTrivyRunner creates a new TrivyRunner with sensible defaults.
func NewTrivyRunner(opts ...TrivyOption) *TrivyRunner {
	g := &TrivyRunner{
		trivyPath:   "trivy",
		cmdExecutor: &realCommandExecutor{},
	}
	for _, opt := range opts {
		opt(g)
	}
	return g
}

type trivyOutput struct {
	Results []trivyResult `json:"Results"`
}

type trivyResult struct {
	Target          string               `json:"Target"`
	Vulnerabilities []trivyVulnerability `json:"Vulnerabilities"`
}

type trivyVulnerability struct {
	VulnerabilityID  string `json:"VulnerabilityID"`
	PkgName          string `json:"PkgName"`
	InstalledVersion string `json:"InstalledVersion"`
	FixedVersion     string `json:"FixedVersion"`
	Severity         string `json:"Severity"`
	Title            string `json:"Title"`
}

// Scan runs Trivy fs scan against the directory and parses CVE results.
func (g *TrivyRunner) Scan(ctx context.Context, dir string) (*scan.DepsFindings, error) {
	cmd := g.cmdExecutor.CommandContext(ctx, g.trivyPath,
		"fs",
		"--scanners", "vuln",
		"--format", "json",
		"--severity", "CRITICAL,HIGH,MEDIUM,LOW",
		"--quiet",
		dir,
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("trivy execution failed: %w (stderr: %s)", err, truncate(stderr.String()))
	}

	return parseTrivyOutput(stdout.Bytes(), dir)
}

// Version returns the Trivy version string.
func (g *TrivyRunner) Version(ctx context.Context) string {
	cmd := g.cmdExecutor.CommandContext(ctx, g.trivyPath, "--version")
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	if err := cmd.Run(); err != nil {
		return ""
	}
	// Trivy's --version prints multiple lines; take the first.
	line := strings.SplitN(strings.TrimSpace(stdout.String()), "\n", 2)[0]
	return line
}

// parseTrivyOutput parses Trivy JSON output, aggregates severity counts, and excludes
// LOW-severity findings from the Findings slice (still counted in LowCount).
func parseTrivyOutput(data []byte, tmpDir string) (*scan.DepsFindings, error) {
	var raw trivyOutput
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("parse trivy output: %w", err)
	}

	findings := &scan.DepsFindings{Findings: make([]scan.DepFinding, 0)}

	for _, res := range raw.Results {
		for _, v := range res.Vulnerabilities {
			switch v.Severity {
			case scan.SeverityCritical:
				findings.CriticalCount++
			case scan.SeverityHigh:
				findings.HighCount++
			case scan.SeverityMedium:
				findings.MediumCount++
			case scan.SeverityLow:
				findings.LowCount++
				continue
			default:
				// Unknown severities are ignored.
				continue
			}

			findings.Findings = append(findings.Findings, scan.DepFinding{
				Package:          v.PkgName,
				InstalledVersion: v.InstalledVersion,
				FixedVersion:     v.FixedVersion,
				CVE:              v.VulnerabilityID,
				Severity:         v.Severity,
				Title:            v.Title,
			})
		}
	}

	return findings, nil
}

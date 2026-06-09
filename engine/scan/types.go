// Package scan holds the codescan security-scan domain: the result/finding types,
// the scoring rules, and the interactor that orchestrates a scan (download repo,
// run Semgrep/Gitleaks/Trivy, score, persist).
package scan

import "time"

// Scan status constants.
const (
	StatusPending   = "pending"
	StatusRunning   = "running"
	StatusCompleted = "completed"
	StatusFailed    = "failed"
)

// CacheTTL is the duration for which a scan result is considered fresh.
const CacheTTL = 24 * time.Hour

// SAST severity levels (from Semgrep).
const (
	SastSeverityError   = "ERROR"
	SastSeverityWarning = "WARNING"
	SastSeverityInfo    = "INFO"
)

// CVE / Secret severity levels (from Trivy + uniform Secrets severity).
const (
	SeverityCritical = "CRITICAL"
	SeverityHigh     = "HIGH"
	SeverityMedium   = "MEDIUM"
	SeverityLow      = "LOW"
)

// Score penalty constants. Secrets carry the heaviest penalty since a leaked
// credential is an immediate breach; dependency CVEs are weighted lower because
// they are context-dependent and frequently not exploitable in practice.
const (
	BaseScore = 100
	MinScore  = 0

	// Secrets: all Gitleaks findings are treated as critical.
	PenaltySecretCritical = 30

	// Dependencies (Trivy CVEs).
	PenaltyDepCritical = 10
	PenaltyDepHigh     = 3
	PenaltyDepMedium   = 1
	PenaltyDepLow      = 0

	// SAST (Semgrep). INFO is excluded entirely.
	PenaltySastError   = 3
	PenaltySastWarning = 1
)

// Primary-language identifiers (as reported by the GitHub API) that select a
// language-specific Semgrep pack.
const (
	LanguagePython     = "Python"
	LanguageJavaScript = "JavaScript"
	LanguageTypeScript = "TypeScript"
	LanguageGo         = "Go"
	LanguageJava       = "Java"
	LanguageRuby       = "Ruby"
)

// Semgrep pack identifiers used in --config.
const (
	SemgrepPackPython     = "p/python"
	SemgrepPackJavaScript = "p/javascript"
	SemgrepPackTypeScript = "p/typescript"
	SemgrepPackGolang     = "p/golang"
	SemgrepPackJava       = "p/java"
	SemgrepPackRuby       = "p/ruby"
	SemgrepPackDefault    = "p/default"
)

// SemgrepConfigFor maps a GitHub primary language to a Semgrep config pack.
// Unsupported / unknown languages fall back to the default pack.
func SemgrepConfigFor(language string) string {
	switch language {
	case LanguagePython:
		return SemgrepPackPython
	case LanguageJavaScript:
		return SemgrepPackJavaScript
	case LanguageTypeScript:
		return SemgrepPackTypeScript
	case LanguageGo:
		return SemgrepPackGolang
	case LanguageJava:
		return SemgrepPackJava
	case LanguageRuby:
		return SemgrepPackRuby
	default:
		return SemgrepPackDefault
	}
}

// Request represents a request to scan a repository.
type Request struct {
	Owner       string
	Repo        string
	Ref         string
	Language    string
	GitHubToken string
	// RequesterUserID is the GitHub user ID of the signed-in user who initiated
	// the scan, or 0 for anonymous public scans. Private scan reports are only
	// returned to this user.
	RequesterUserID int64
}

// SastFinding represents a single SAST (Semgrep) finding.
type SastFinding struct {
	File     string `json:"file"`
	Line     int    `json:"line"`
	RuleID   string `json:"rule_id"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
}

// SastFindings aggregates SAST scan results.
// Counts reflect ALL findings; the Findings slice excludes INFO severity.
type SastFindings struct {
	ErrorCount   int           `json:"error_count"`
	WarningCount int           `json:"warning_count"`
	InfoCount    int           `json:"info_count"`
	Findings     []SastFinding `json:"findings"`
}

// SecretFinding represents a single Gitleaks finding.
// The actual secret value is intentionally omitted from this struct.
type SecretFinding struct {
	File        string `json:"file"`
	Line        int    `json:"line"`
	RuleID      string `json:"rule_id"`
	Description string `json:"description"`
}

// SecretsFindings aggregates secret scan results.
// All findings are treated as CRITICAL (Gitleaks does not classify severity).
type SecretsFindings struct {
	CriticalCount int             `json:"critical_count"`
	Findings      []SecretFinding `json:"findings"`
}

// DepFinding represents a single dependency vulnerability (Trivy).
type DepFinding struct {
	Package          string `json:"package"`
	InstalledVersion string `json:"installed_version"`
	FixedVersion     string `json:"fixed_version,omitempty"`
	CVE              string `json:"cve"`
	Severity         string `json:"severity"`
	Title            string `json:"title"`
}

// DepsFindings aggregates dependency scan results.
// Counts reflect ALL findings; the Findings slice excludes LOW severity.
type DepsFindings struct {
	CriticalCount int          `json:"critical_count"`
	HighCount     int          `json:"high_count"`
	MediumCount   int          `json:"medium_count"`
	LowCount      int          `json:"low_count"`
	Findings      []DepFinding `json:"findings"`
}

// ScannerVersions records the version of each scanner used for a scan.
type ScannerVersions struct {
	Semgrep  string `json:"semgrep,omitempty"`
	Gitleaks string `json:"gitleaks,omitempty"`
	Trivy    string `json:"trivy,omitempty"`
}

// Result represents the outcome of a security scan run on a repository.
type Result struct {
	ID                 string
	Owner              string
	Repo               string
	Ref                string
	CommitSHA          string
	Language           string
	TokenAuthenticated bool
	IsPrivate          bool
	RequesterUserID    int64
	Status             string
	ErrorMessage       string
	TotalScore         int
	SAST               *SastFindings
	Secrets            *SecretsFindings
	Dependencies       *DepsFindings
	ScannerVersions    ScannerVersions
	RequestedAt        time.Time
	CompletedAt        *time.Time
}

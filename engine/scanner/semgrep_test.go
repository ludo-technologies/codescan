package scanner

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/ludo-technologies/codescan/engine/scan"
)

// recordingSemgrepExecutor captures the args Scan passes to the binary and runs
// a helper process that emits an empty (valid) Semgrep JSON document so Scan
// completes successfully.
type recordingSemgrepExecutor struct {
	args []string
}

func (r *recordingSemgrepExecutor) CommandContext(ctx context.Context, name string, arg ...string) *exec.Cmd {
	r.args = append([]string{name}, arg...)
	cmd := exec.CommandContext(ctx, os.Args[0], "-test.run=TestSemgrepHelperProcess", "--")
	cmd.Env = append(os.Environ(), "GO_WANT_SEMGREP_HELPER=1")
	return cmd
}

func TestSemgrepHelperProcess(t *testing.T) {
	if os.Getenv("GO_WANT_SEMGREP_HELPER") != "1" {
		return
	}
	if _, err := os.Stdout.WriteString(`{"results":[]}`); err != nil {
		os.Exit(1)
	}
	os.Exit(0)
}

// The host over-reports CPUs to Semgrep inside a 1-CPU container, so the scan
// must pin --jobs=1 (one worker, flat memory) and cap per-file memory to stay
// under the 2GB container budget. Regressing either flag reintroduces the OOM.
func TestSemgrepScan_PinsJobsAndMemory(t *testing.T) {
	rec := &recordingSemgrepExecutor{}
	runner := NewSemgrepRunner(WithSemgrepCommandExecutor(rec))

	if _, err := runner.Scan(context.Background(), "/src", "Python"); err != nil {
		t.Fatalf("Scan: %v", err)
	}

	want := map[string]bool{
		"--jobs=" + semgrepJobs:              false,
		"--max-memory=" + semgrepMaxMemoryMB: false,
		"--exclude=tests":                    false, // a representative non-source exclusion
	}
	for _, a := range rec.args {
		if _, ok := want[a]; ok {
			want[a] = true
		}
	}
	for flag, seen := range want {
		if !seen {
			t.Errorf("semgrep args missing %q; got %v", flag, rec.args)
		}
	}
}

func TestParseSemgrepOutput_Fixture(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("testdata", "semgrep_sample.json"))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}

	findings, err := parseSemgrepOutput(data, "/src")
	if err != nil {
		t.Fatalf("parse: %v", err)
	}

	if findings.ErrorCount != 1 {
		t.Errorf("ErrorCount: got %d, want 1", findings.ErrorCount)
	}
	if findings.WarningCount != 0 {
		t.Errorf("WarningCount: got %d, want 0", findings.WarningCount)
	}
	if findings.InfoCount != 0 {
		t.Errorf("InfoCount: got %d, want 0", findings.InfoCount)
	}
	if len(findings.Findings) != 1 {
		t.Fatalf("Findings length: got %d, want 1", len(findings.Findings))
	}

	f := findings.Findings[0]
	if f.File != "app.py" {
		t.Errorf("File: got %q, want %q", f.File, "app.py")
	}
	if f.Line != 15 {
		t.Errorf("Line: got %d, want 15", f.Line)
	}
	if f.Severity != scan.SastSeverityError {
		t.Errorf("Severity: got %q, want %q", f.Severity, scan.SastSeverityError)
	}
	if f.RuleID == "" {
		t.Error("RuleID must not be empty")
	}
	if f.Message == "" {
		t.Error("Message must not be empty")
	}
}

func TestParseSemgrepOutput_InfoExcludedFromFindings(t *testing.T) {
	const data = `{"results":[
		{"check_id":"r1","path":"/src/x.py","start":{"line":1},"extra":{"severity":"INFO","message":"info msg"}},
		{"check_id":"r2","path":"/src/x.py","start":{"line":2},"extra":{"severity":"WARNING","message":"warn msg"}}
	]}`
	findings, err := parseSemgrepOutput([]byte(data), "/src")
	if err != nil {
		t.Fatal(err)
	}
	if findings.InfoCount != 1 {
		t.Errorf("InfoCount: got %d, want 1", findings.InfoCount)
	}
	if findings.WarningCount != 1 {
		t.Errorf("WarningCount: got %d, want 1", findings.WarningCount)
	}
	if len(findings.Findings) != 1 {
		t.Errorf("Findings length: got %d, want 1 (INFO must be excluded)", len(findings.Findings))
	}
	if findings.Findings[0].Severity != scan.SastSeverityWarning {
		t.Errorf("only WARNING should remain, got %q", findings.Findings[0].Severity)
	}
}

func TestParseSemgrepOutput_PathStripping(t *testing.T) {
	const data = `{"results":[
		{"check_id":"r1","path":"/tmp/codescan-abc/repo/src/x.py","start":{"line":3},"extra":{"severity":"ERROR","message":"m"}}
	]}`
	findings, err := parseSemgrepOutput([]byte(data), "/tmp/codescan-abc/repo")
	if err != nil {
		t.Fatal(err)
	}
	got := findings.Findings[0].File
	want := filepath.Join("src", "x.py")
	if got != want {
		t.Errorf("File: got %q, want %q", got, want)
	}
}

func TestParseSemgrepOutput_EmptyResults(t *testing.T) {
	findings, err := parseSemgrepOutput([]byte(`{"results":[]}`), "/src")
	if err != nil {
		t.Fatal(err)
	}
	if findings.ErrorCount != 0 || findings.WarningCount != 0 || findings.InfoCount != 0 {
		t.Errorf("empty results should yield zero counts, got %+v", findings)
	}
	if len(findings.Findings) != 0 {
		t.Errorf("empty results should yield empty Findings, got %d", len(findings.Findings))
	}
}

func TestParseSemgrepOutput_InvalidJSON(t *testing.T) {
	_, err := parseSemgrepOutput([]byte(`not json`), "")
	if err == nil {
		t.Error("expected error on invalid JSON")
	}
}

package scanner

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"testing"
)

type mockGitleaksCommandExecutor struct {
	exitCode int
	output   string
}

func (m mockGitleaksCommandExecutor) CommandContext(ctx context.Context, name string, arg ...string) *exec.Cmd {
	args := []string{"-test.run=TestGitleaksHelperProcess", "--", "gitleaks-helper"}
	args = append(args, arg...)
	cmd := exec.CommandContext(ctx, os.Args[0], args...)
	cmd.Env = append(os.Environ(),
		"GO_WANT_GITLEAKS_HELPER_PROCESS=1",
		"GITLEAKS_HELPER_EXIT_CODE="+strconv.Itoa(m.exitCode),
		"GITLEAKS_HELPER_OUTPUT="+m.output,
	)
	return cmd
}

func TestGitleaksHelperProcess(t *testing.T) {
	if os.Getenv("GO_WANT_GITLEAKS_HELPER_PROCESS") != "1" {
		return
	}

	reportPath := ""
	for i, arg := range os.Args {
		if arg == "--report-path" && i+1 < len(os.Args) {
			reportPath = os.Args[i+1]
			break
		}
	}
	if reportPath != "" {
		if err := os.WriteFile(reportPath, []byte(os.Getenv("GITLEAKS_HELPER_OUTPUT")), 0o600); err != nil {
			os.Exit(3)
		}
	}

	switch os.Getenv("GITLEAKS_HELPER_EXIT_CODE") {
	case "0":
		os.Exit(0)
	case "1":
		os.Exit(1)
	default:
		os.Exit(2)
	}
}

func TestGitleaksScan_AllowsExitCodeOneWithReport(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("testdata", "gitleaks_sample.json"))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}
	runner := NewGitleaksRunner(WithGitleaksCommandExecutor(mockGitleaksCommandExecutor{
		exitCode: 1,
		output:   string(data),
	}))

	findings, err := runner.Scan(context.Background(), "/src")
	if err != nil {
		t.Fatalf("Scan() error = %v, want nil", err)
	}
	if findings.CriticalCount != 1 {
		t.Errorf("CriticalCount: got %d, want 1", findings.CriticalCount)
	}
}

func TestGitleaksScan_RejectsExecutionFailure(t *testing.T) {
	runner := NewGitleaksRunner(WithGitleaksCommandExecutor(mockGitleaksCommandExecutor{
		exitCode: 2,
		output:   "",
	}))

	_, err := runner.Scan(context.Background(), "/src")
	if err == nil {
		t.Fatal("Scan() error = nil, want execution error")
	}
	if !contains(err.Error(), "run gitleaks") {
		t.Errorf("Scan() error = %q, want run gitleaks context", err.Error())
	}
}

func TestGitleaksScan_RejectsExitCodeOneWithEmptyReport(t *testing.T) {
	runner := NewGitleaksRunner(WithGitleaksCommandExecutor(mockGitleaksCommandExecutor{
		exitCode: 1,
		output:   "",
	}))

	_, err := runner.Scan(context.Background(), "/src")
	if err == nil {
		t.Fatal("Scan() error = nil, want empty report error")
	}
	if !contains(err.Error(), "empty report") {
		t.Errorf("Scan() error = %q, want empty report context", err.Error())
	}
}

func TestParseGitleaksOutput_Fixture(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("testdata", "gitleaks_sample.json"))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}

	findings, err := parseGitleaksOutput(data, "/src")
	if err != nil {
		t.Fatalf("parse: %v", err)
	}

	if findings.CriticalCount != 1 {
		t.Errorf("CriticalCount: got %d, want 1", findings.CriticalCount)
	}
	if len(findings.Findings) != 1 {
		t.Fatalf("Findings length: got %d, want 1", len(findings.Findings))
	}

	f := findings.Findings[0]
	if f.File != "secrets.py" {
		t.Errorf("File: got %q, want %q", f.File, "secrets.py")
	}
	if f.Line != 9 {
		t.Errorf("Line: got %d, want 9", f.Line)
	}
	if f.RuleID != "stripe-access-token" {
		t.Errorf("RuleID: got %q, want %q", f.RuleID, "stripe-access-token")
	}
	if f.Description == "" {
		t.Error("Description must not be empty")
	}
}

func TestParseGitleaksOutput_NoSecretFieldLeakage(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("testdata", "gitleaks_sample.json"))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}
	findings, err := parseGitleaksOutput(data, "/src")
	if err != nil {
		t.Fatal(err)
	}

	// Marshal back to JSON and confirm raw secret/match fields are absent.
	out, err := json.Marshal(findings)
	if err != nil {
		t.Fatal(err)
	}
	for _, banned := range []string{"\"Secret\"", "\"Match\"", "\"secret\"", "\"match\""} {
		if got := string(out); contains(got, banned) {
			t.Errorf("output must not contain raw secret/match field %s; got: %s", banned, got)
		}
	}
}

func TestParseGitleaksOutput_EmptyReport(t *testing.T) {
	findings, err := parseGitleaksOutput([]byte(""), "/src")
	if err != nil {
		t.Fatal(err)
	}
	if findings.CriticalCount != 0 {
		t.Errorf("empty report must yield 0 critical, got %d", findings.CriticalCount)
	}
	if len(findings.Findings) != 0 {
		t.Errorf("empty report must yield 0 findings, got %d", len(findings.Findings))
	}
}

func TestParseGitleaksOutput_EmptyArray(t *testing.T) {
	findings, err := parseGitleaksOutput([]byte("[]"), "/src")
	if err != nil {
		t.Fatal(err)
	}
	if findings.CriticalCount != 0 {
		t.Errorf("[] must yield 0 critical, got %d", findings.CriticalCount)
	}
}

func TestParseGitleaksOutput_InvalidJSON(t *testing.T) {
	_, err := parseGitleaksOutput([]byte(`not json`), "")
	if err == nil {
		t.Error("expected error on invalid JSON")
	}
}

// contains reports whether substr is within s; tiny helper to avoid importing strings.
func contains(s, substr string) bool {
	for i := 0; i+len(substr) <= len(s); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

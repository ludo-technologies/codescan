package scanner

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/ludo-technologies/codescan/engine/scan"
)

func TestParseTrivyOutput_Fixture(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("testdata", "trivy_sample.json"))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}

	findings, err := parseTrivyOutput(data, "/src")
	if err != nil {
		t.Fatalf("parse: %v", err)
	}

	// PoC observed distribution: CRITICAL=6, HIGH=13, MEDIUM=12, LOW=2 (total 33)
	if findings.CriticalCount != 6 {
		t.Errorf("CriticalCount: got %d, want 6", findings.CriticalCount)
	}
	if findings.HighCount != 13 {
		t.Errorf("HighCount: got %d, want 13", findings.HighCount)
	}
	if findings.MediumCount != 12 {
		t.Errorf("MediumCount: got %d, want 12", findings.MediumCount)
	}
	if findings.LowCount != 2 {
		t.Errorf("LowCount: got %d, want 2", findings.LowCount)
	}

	// LOW must NOT appear in the Findings slice.
	if got, want := len(findings.Findings), 6+13+12; got != want {
		t.Errorf("Findings length (excl. LOW): got %d, want %d", got, want)
	}
	for _, f := range findings.Findings {
		if f.Severity == scan.SeverityLow {
			t.Errorf("LOW severity must be excluded from Findings, got %+v", f)
		}
	}
}

func TestParseTrivyOutput_FindingShape(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("testdata", "trivy_sample.json"))
	if err != nil {
		t.Fatal(err)
	}
	findings, _ := parseTrivyOutput(data, "/src")

	// Find at least one CRITICAL finding and inspect required fields.
	var first *scan.DepFinding
	for i := range findings.Findings {
		if findings.Findings[i].Severity == scan.SeverityCritical {
			first = &findings.Findings[i]
			break
		}
	}
	if first == nil {
		t.Fatal("expected at least one CRITICAL finding")
	}
	if first.CVE == "" {
		t.Error("CVE must not be empty")
	}
	if first.Package == "" {
		t.Error("Package must not be empty")
	}
	if first.InstalledVersion == "" {
		t.Error("InstalledVersion must not be empty")
	}
	if first.Title == "" {
		t.Error("Title must not be empty")
	}
}

func TestParseTrivyOutput_EmptyResults(t *testing.T) {
	findings, err := parseTrivyOutput([]byte(`{"Results":[]}`), "/src")
	if err != nil {
		t.Fatal(err)
	}
	if findings.CriticalCount+findings.HighCount+findings.MediumCount+findings.LowCount != 0 {
		t.Errorf("empty Results must yield zero counts, got %+v", findings)
	}
	if len(findings.Findings) != 0 {
		t.Errorf("empty Results must yield zero Findings, got %d", len(findings.Findings))
	}
}

func TestParseTrivyOutput_NoVulnerabilitiesField(t *testing.T) {
	// Some Trivy results entries have no Vulnerabilities field (e.g., language-only files).
	findings, err := parseTrivyOutput([]byte(`{"Results":[{"Target":"requirements.txt"}]}`), "/src")
	if err != nil {
		t.Fatal(err)
	}
	if len(findings.Findings) != 0 {
		t.Errorf("missing Vulnerabilities should yield 0 findings, got %d", len(findings.Findings))
	}
}

func TestParseTrivyOutput_InvalidJSON(t *testing.T) {
	_, err := parseTrivyOutput([]byte(`not json`), "")
	if err == nil {
		t.Error("expected error on invalid JSON")
	}
}

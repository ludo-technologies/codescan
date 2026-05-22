import { describe, expect, it } from "vitest";
import { buildSecurityReport } from "@/lib/security-report";
import type { ScanResult } from "@/types/scan";

const scanResult: ScanResult = {
	id: "scan-123",
	owner: "testowner",
	repo: "testrepo",
	status: "completed",
	total_score: 67,
	requested_at: "2026-05-22T01:00:00Z",
	completed_at: "2026-05-22T01:02:00Z",
	scanner_versions: {
		semgrep: "1.2.3",
		gitleaks: "8.0.0",
		trivy: "0.60.0",
	},
	sast: {
		error_count: 1,
		warning_count: 0,
		info_count: 0,
		findings: [
			{
				file: "src/auth.ts",
				line: 42,
				rule_id: "typescript.security",
				severity: "ERROR",
				message: "Unsanitized input\nreaches a query.",
			},
		],
	},
	secrets: {
		critical_count: 1,
		findings: [
			{
				file: ".env",
				line: 3,
				rule_id: "generic-api-key",
				description: "Possible API key",
			},
		],
	},
	dependencies: {
		critical_count: 0,
		high_count: 1,
		medium_count: 0,
		low_count: 0,
		findings: [
			{
				package: "left-pad",
				installed_version: "1.0.0",
				fixed_version: "1.1.0",
				cve: "CVE-2026-1234",
				severity: "HIGH",
				title: "Example dependency issue",
			},
		],
	},
};

describe("buildSecurityReport", () => {
	it("includes scan metadata, summaries, and detailed findings", () => {
		const report = buildSecurityReport(scanResult);

		expect(report).toContain("# codescan Security Report");
		expect(report).toContain("Repository: testowner/testrepo");
		expect(report).toContain("- Security grade: B (Good)");
		expect(report).toContain("- SAST: 1 errors, 0 warnings, 0 info");
		expect(report).toContain(
			"### 1. ERROR - src/auth.ts:42\n\n- Rule: typescript.security\n- Message: Unsanitized input reaches a query.",
		);
		expect(report).toContain(
			"### 1. CRITICAL - .env:3\n\n- Rule: generic-api-key\n- Description: Possible API key",
		);
		expect(report).toContain(
			"### 1. HIGH - left-pad 1.0.0\n\n- CVE: CVE-2026-1234\n- Title: Example dependency issue\n- Fixed version: 1.1.0",
		);
	});

	it("marks scanner categories as unavailable when the result omits them", () => {
		const report = buildSecurityReport({
			...scanResult,
			sast: undefined,
			secrets: undefined,
			dependencies: undefined,
			scanner_versions: {},
		});

		expect(report).toContain("- SAST: Not available");
		expect(report).toContain("SAST scan data is not available.");
		expect(report).toContain("- Semgrep: N/A");
		expect(report).toContain("Dependency scan data is not available.");
	});
});

import { getGrade, getGradeLabel } from "@/lib/score-utils";
import type {
	DepFinding,
	SastFinding,
	ScanResult,
	SecretFinding,
} from "@/types/scan";

function inlineText(value: string | undefined): string {
	const text = value?.replace(/\s+/g, " ").trim();
	return text || "N/A";
}

function formatSastSummary(result: ScanResult): string {
	if (!result.sast) return "Not available";

	return [
		`${result.sast.error_count} errors`,
		`${result.sast.warning_count} warnings`,
		`${result.sast.info_count} info`,
	].join(", ");
}

function formatSecretsSummary(result: ScanResult): string {
	if (!result.secrets) return "Not available";

	return `${result.secrets.critical_count} critical`;
}

function formatDependenciesSummary(result: ScanResult): string {
	if (!result.dependencies) return "Not available";

	return [
		`${result.dependencies.critical_count} critical`,
		`${result.dependencies.high_count} high`,
		`${result.dependencies.medium_count} medium`,
		`${result.dependencies.low_count} low`,
	].join(", ");
}

function appendNoFindings(lines: string[], category: string) {
	lines.push(`No ${category} findings were reported.`, "");
}

function appendSastFinding(
	lines: string[],
	finding: SastFinding,
	index: number,
) {
	lines.push(
		`### ${index + 1}. ${inlineText(finding.severity)} - ${inlineText(finding.file)}:${finding.line}`,
		"",
		`- Rule: ${inlineText(finding.rule_id)}`,
		`- Message: ${inlineText(finding.message)}`,
		"",
	);
}

function appendSecretFinding(
	lines: string[],
	finding: SecretFinding,
	index: number,
) {
	lines.push(
		`### ${index + 1}. CRITICAL - ${inlineText(finding.file)}:${finding.line}`,
		"",
		`- Rule: ${inlineText(finding.rule_id)}`,
		`- Description: ${inlineText(finding.description)}`,
		"",
	);
}

function appendDependencyFinding(
	lines: string[],
	finding: DepFinding,
	index: number,
) {
	lines.push(
		`### ${index + 1}. ${inlineText(finding.severity)} - ${inlineText(finding.package)} ${inlineText(finding.installed_version)}`,
		"",
		`- CVE: ${inlineText(finding.cve)}`,
		`- Title: ${inlineText(finding.title)}`,
		`- Fixed version: ${inlineText(finding.fixed_version)}`,
		"",
	);
}

export function buildSecurityReport(result: ScanResult): string {
	const grade = getGrade(result.total_score);
	const gradeLabel = getGradeLabel(result.total_score);
	const lines = [
		"# codescan Security Report",
		"",
		`Repository: ${inlineText(result.owner)}/${inlineText(result.repo)}`,
		`Scan ID: ${inlineText(result.id)}`,
		`Status: ${inlineText(result.status)}`,
		`Requested at: ${inlineText(result.requested_at)}`,
		`Completed at: ${inlineText(result.completed_at)}`,
		"",
		"## Score",
		"",
		`- Total score: ${result.total_score}/100`,
		`- Security grade: ${grade} (${gradeLabel})`,
		"",
		"## Summary",
		"",
		`- SAST: ${formatSastSummary(result)}`,
		`- Secrets: ${formatSecretsSummary(result)}`,
		`- Dependencies: ${formatDependenciesSummary(result)}`,
		"",
		"## Scanner Versions",
		"",
		`- Semgrep: ${inlineText(result.scanner_versions.semgrep)}`,
		`- Gitleaks: ${inlineText(result.scanner_versions.gitleaks)}`,
		`- Trivy: ${inlineText(result.scanner_versions.trivy)}`,
		"",
		"## SAST Findings",
		"",
	];

	if (!result.sast) {
		lines.push("SAST scan data is not available.", "");
	} else if (result.sast.findings.length === 0) {
		appendNoFindings(lines, "SAST");
	} else {
		result.sast.findings.forEach((finding, index) => {
			appendSastFinding(lines, finding, index);
		});
	}

	lines.push("## Secret Findings", "");

	if (!result.secrets) {
		lines.push("Secret scan data is not available.", "");
	} else if (result.secrets.findings.length === 0) {
		appendNoFindings(lines, "secret");
	} else {
		result.secrets.findings.forEach((finding, index) => {
			appendSecretFinding(lines, finding, index);
		});
	}

	lines.push("## Dependency Findings", "");

	if (!result.dependencies) {
		lines.push("Dependency scan data is not available.", "");
	} else if (result.dependencies.findings.length === 0) {
		appendNoFindings(lines, "dependency");
	} else {
		result.dependencies.findings.forEach((finding, index) => {
			appendDependencyFinding(lines, finding, index);
		});
	}

	return `${lines.join("\n").trimEnd()}\n`;
}

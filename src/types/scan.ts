export interface ScanResponse {
	scan_id: string;
	status: string;
	cached: boolean;
}

export type SastSeverity = "ERROR" | "WARNING" | "INFO";

export interface SastFinding {
	file: string;
	line: number;
	rule_id: string;
	severity: SastSeverity;
	message: string;
}

export interface SastFindings {
	error_count: number;
	warning_count: number;
	info_count: number;
	findings: SastFinding[];
}

export interface SecretFinding {
	file: string;
	line: number;
	rule_id: string;
	description: string;
}

export interface SecretsFindings {
	critical_count: number;
	findings: SecretFinding[];
}

export type CveSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface DepFinding {
	package: string;
	installed_version: string;
	fixed_version?: string;
	cve: string;
	severity: CveSeverity;
	title: string;
}

export interface DepsFindings {
	critical_count: number;
	high_count: number;
	medium_count: number;
	low_count: number;
	findings: DepFinding[];
}

export interface ScannerVersions {
	semgrep?: string;
	gitleaks?: string;
	trivy?: string;
}

export type ScanStatus = "pending" | "running" | "completed" | "failed";

export interface ScanResult {
	id: string;
	owner: string;
	repo: string;
	language?: string;
	is_private?: boolean;
	status: ScanStatus;
	error_message?: string;
	total_score: number;
	sast?: SastFindings;
	secrets?: SecretsFindings;
	dependencies?: DepsFindings;
	scanner_versions: ScannerVersions;
	requested_at: string;
	completed_at?: string;
}

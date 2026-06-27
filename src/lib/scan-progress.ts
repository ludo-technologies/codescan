import type { ScanStatus } from "@/types/scan";

// Production engine runs on a ~$20 Render instance: 2 GB RAM, 1 shared CPU,
// one scan at a time with Gitleaks → Trivy → Semgrep executed serially.
export const DEFAULT_SCAN_DURATION_MS = 60_000;
export const MAX_SCAN_DURATION_MS = 12 * 60_000;
export const QUEUE_WAIT_MS = 30_000;

export type ScanPhase =
	| "queued"
	| "downloading"
	| "secrets"
	| "dependencies"
	| "sast"
	| "finalizing";

export interface ScanPhaseInfo {
	id: ScanPhase;
	label: string;
	weight: number;
}

export const SCAN_PHASES: ScanPhaseInfo[] = [
	{ id: "downloading", label: "Downloading repository", weight: 0.12 },
	{ id: "secrets", label: "Scanning for exposed keys", weight: 0.15 },
	{
		id: "dependencies",
		label: "Checking package vulnerabilities",
		weight: 0.2,
	},
	{ id: "sast", label: "Analyzing code patterns", weight: 0.48 },
	{ id: "finalizing", label: "Preparing report", weight: 0.05 },
];

const RUNNING_PHASE_ORDER: ScanPhase[] = SCAN_PHASES.map((phase) => phase.id);

export interface ScanProgressState {
	phase: ScanPhase;
	phaseLabel: string;
	progressPercent: number;
	estimatedTotalMs: number;
	remainingMs: number;
	remainingLabel: string;
}

function estimateTotalDurationMs(elapsedMs: number): number {
	if (elapsedMs <= DEFAULT_SCAN_DURATION_MS) {
		return DEFAULT_SCAN_DURATION_MS;
	}

	const overrun = elapsedMs - DEFAULT_SCAN_DURATION_MS;
	return Math.min(
		MAX_SCAN_DURATION_MS,
		DEFAULT_SCAN_DURATION_MS + overrun * 0.6,
	);
}

function formatRemaining(ms: number): string {
	const seconds = Math.max(0, Math.ceil(ms / 1000));
	if (seconds < 5) return "Almost done";
	if (seconds < 60) return `About ${seconds} sec remaining`;
	const minutes = Math.ceil(seconds / 60);
	return minutes === 1
		? "About 1 min remaining"
		: `About ${minutes} min remaining`;
}

function phaseAtProgress(progress: number): ScanPhaseInfo {
	let cumulative = 0;
	for (const phase of SCAN_PHASES) {
		cumulative += phase.weight;
		if (progress <= cumulative) return phase;
	}
	return SCAN_PHASES[SCAN_PHASES.length - 1];
}

function runningProgress(elapsedMs: number, estimatedTotalMs: number): number {
	const ratio = Math.min(0.95, elapsedMs / estimatedTotalMs);
	let cumulative = 0;

	for (const phase of SCAN_PHASES) {
		const next = cumulative + phase.weight;
		if (ratio <= next) {
			const phaseRatio = (ratio - cumulative) / phase.weight;
			return (cumulative + phaseRatio * phase.weight) * 100;
		}
		cumulative = next;
	}

	return 95;
}

export function computeScanProgress(
	status: ScanStatus | undefined,
	totalElapsedMs: number,
	runningElapsedMs: number,
): ScanProgressState {
	if (status === "pending") {
		const queueRatio = Math.min(0.1, totalElapsedMs / QUEUE_WAIT_MS);
		const remainingMs = Math.max(0, QUEUE_WAIT_MS - totalElapsedMs);
		return {
			phase: "queued",
			phaseLabel: "Waiting for an available worker",
			progressPercent: queueRatio * 100,
			estimatedTotalMs: QUEUE_WAIT_MS + DEFAULT_SCAN_DURATION_MS,
			remainingMs: remainingMs + DEFAULT_SCAN_DURATION_MS,
			remainingLabel: formatRemaining(remainingMs + DEFAULT_SCAN_DURATION_MS),
		};
	}

	const estimatedTotalMs = estimateTotalDurationMs(runningElapsedMs);
	const progressRatio = Math.min(0.95, runningElapsedMs / estimatedTotalMs);
	const phase = phaseAtProgress(progressRatio);
	const progressPercent = runningProgress(runningElapsedMs, estimatedTotalMs);
	const remainingMs = Math.max(0, estimatedTotalMs - runningElapsedMs);

	return {
		phase: phase.id,
		phaseLabel: phase.label,
		progressPercent,
		estimatedTotalMs,
		remainingMs,
		remainingLabel: formatRemaining(remainingMs),
	};
}

export function getPhaseStatus(
	phase: ScanPhase,
	currentPhase: ScanPhase,
): "done" | "active" | "upcoming" {
	if (phase === "queued") {
		return currentPhase === "queued" ? "active" : "done";
	}

	if (currentPhase === "queued") return "upcoming";

	const currentIndex = RUNNING_PHASE_ORDER.indexOf(currentPhase);
	const phaseIndex = RUNNING_PHASE_ORDER.indexOf(phase);
	if (phaseIndex < currentIndex) return "done";
	if (phaseIndex === currentIndex) return "active";
	return "upcoming";
}

export function getElapsedMs(
	requestedAt: string | undefined,
	fallbackStartedAt: number,
	now = Date.now(),
): number {
	if (requestedAt) {
		const parsed = Date.parse(requestedAt);
		if (!Number.isNaN(parsed)) {
			return Math.max(0, now - parsed);
		}
	}
	return Math.max(0, now - fallbackStartedAt);
}

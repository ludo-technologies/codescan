export const TONE_CLASSES = {
	critical: "bg-red-50 text-red-700 border-red-200",
	high: "bg-orange-50 text-orange-700 border-orange-200",
	warn: "bg-amber-50 text-amber-700 border-amber-200",
	good: "bg-emerald-50 text-emerald-700 border-emerald-200",
	low: "bg-blue-50 text-blue-700 border-blue-200",
	neutral: "bg-slate-50 text-slate-600 border-slate-200",
} as const;

export type Tone = keyof typeof TONE_CLASSES;

export type Severity =
	| "CRITICAL"
	| "HIGH"
	| "ERROR"
	| "MEDIUM"
	| "WARNING"
	| "LOW"
	| "INFO";

const SEVERITY_TO_TONE: Record<Severity, Tone> = {
	CRITICAL: "critical",
	HIGH: "high",
	ERROR: "high",
	MEDIUM: "warn",
	WARNING: "warn",
	LOW: "low",
	INFO: "neutral",
};

export function severityClasses(severity: string): string {
	const tone = SEVERITY_TO_TONE[severity as Severity] ?? "neutral";
	return TONE_CLASSES[tone];
}

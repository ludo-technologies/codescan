import Link from "next/link";
import { getGrade, getGradeLabel } from "@/lib/score-utils";
import type { ScanResult } from "@/types/scan";
import ScoreRing from "./ScoreRing";

interface ShareCardProps {
	result: ScanResult;
}

type Tone = "critical" | "high" | "warn" | "low";

interface CategoryRowProps {
	label: string;
	counts: { label: string; value: number | null; tone: Tone }[];
}

const TONE_COLORS: Record<Tone, string> = {
	critical: "#EF4444",
	high: "#F59E0B",
	warn: "#FBBF24",
	low: "#60A5FA",
};

function CategoryRow({ label, counts }: CategoryRowProps) {
	return (
		<div className="grid grid-cols-[92px_1fr] items-center gap-3 py-3">
			<span className="shrink-0 text-[11px] font-semibold text-[var(--text-light)]">
				{label}
			</span>
			<div className="flex min-w-0 flex-wrap items-center justify-end gap-x-4 gap-y-1 font-mono text-[12px] tabular-nums sm:justify-start">
				{counts.map((count) => (
					<span key={count.label} className="flex items-center gap-1">
						{count.value === null ? (
							<span className="text-[11px] text-[var(--text-dimmed)]">
								{count.label}
							</span>
						) : (
							<>
								<span
									className="font-bold"
									style={{ color: TONE_COLORS[count.tone] }}
								>
									{count.value}
								</span>
								<span className="text-[10px] text-[var(--text-dimmed)]">
									{count.label}
								</span>
							</>
						)}
					</span>
				))}
			</div>
		</div>
	);
}

export default function ShareCard({ result }: ShareCardProps) {
	const grade = getGrade(result.total_score);
	const gradeLabel = getGradeLabel(result.total_score);

	const sastCounts: CategoryRowProps["counts"] = result.sast
		? [
				{ label: "errors", value: result.sast.error_count, tone: "high" },
				{ label: "warnings", value: result.sast.warning_count, tone: "warn" },
			]
		: [{ label: "N/A", value: null, tone: "low" }];

	const secretsCounts: CategoryRowProps["counts"] = result.secrets
		? [
				{
					label: "critical",
					value: result.secrets.critical_count,
					tone: "critical",
				},
			]
		: [{ label: "N/A", value: null, tone: "low" }];

	const depsCounts: CategoryRowProps["counts"] = result.dependencies
		? [
				{
					label: "critical",
					value: result.dependencies.critical_count,
					tone: "critical",
				},
				{ label: "high", value: result.dependencies.high_count, tone: "high" },
				{
					label: "medium",
					value: result.dependencies.medium_count,
					tone: "warn",
				},
			]
		: [{ label: "N/A", value: null, tone: "low" }];

	return (
		<div className="relative w-full max-w-[560px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:px-7 sm:py-6">
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.12),transparent_42%,rgba(34,197,94,0.05))]" />

			<div className="relative z-[1] flex flex-col gap-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="font-mono text-[13px] font-extrabold text-[var(--brand-blue)]">
						codescan<span className="text-[var(--text-muted)]">.dev</span>
					</div>
					<div className="max-w-full truncate rounded-md border border-[var(--border-light)] bg-[var(--bg-subtle)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-light)] sm:max-w-[300px]">
						{result.owner}/{result.repo}
					</div>
				</div>

				<div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
					<ScoreRing score={result.total_score} grade={grade} />
					<div className="min-w-0 text-center sm:text-left">
						<div className="text-[11px] font-semibold uppercase text-[var(--text-subtle)]">
							Security Grade
						</div>
						<div className="mt-1 text-2xl font-extrabold text-white">
							{gradeLabel}
						</div>
					</div>
				</div>

				<div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
					<CategoryRow label="SAST" counts={sastCounts} />
					<CategoryRow label="Secrets" counts={secretsCounts} />
					<CategoryRow label="Dependencies" counts={depsCounts} />
				</div>

				<div className="flex items-center justify-center">
					<Link
						href="/"
						className="font-mono text-[11px] text-white bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.25)] px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-colors hover:bg-[rgba(59,130,246,0.2)]"
					>
						Scan yours <span className="text-[var(--brand-blue-light)]">→</span>{" "}
						<strong className="text-[var(--brand-blue-light)]">
							codescan.dev
						</strong>
					</Link>
				</div>
			</div>
		</div>
	);
}

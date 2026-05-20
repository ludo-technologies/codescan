import Link from "next/link";
import { getGrade } from "@/lib/score-utils";
import type { ScanResult } from "@/types/scan";
import ScoreRing from "./ScoreRing";

interface ShareCardProps {
	result: ScanResult;
}

type Tone = "critical" | "high" | "warn" | "low";

interface CategoryRowProps {
	label: string;
	counts: { label: string; value: number; tone: Tone }[];
}

const TONE_COLORS: Record<Tone, string> = {
	critical: "#EF4444",
	high: "#F59E0B",
	warn: "#FBBF24",
	low: "#60A5FA",
};

function CategoryRow({ label, counts }: CategoryRowProps) {
	return (
		<div className="flex items-center gap-3">
			<span className="w-[110px] shrink-0 text-right text-[11px] font-semibold text-[var(--text-light)] tracking-wide">
				{label}
			</span>
			<div className="flex flex-1 items-center gap-3 font-mono text-[12px] tabular-nums">
				{counts.map((count) => (
					<span key={count.label} className="flex items-center gap-1">
						<span
							className="font-bold"
							style={{ color: TONE_COLORS[count.tone] }}
						>
							{count.value}
						</span>
						<span className="text-[10px] text-[var(--text-dimmed)]">
							{count.label}
						</span>
					</span>
				))}
			</div>
		</div>
	);
}

export default function ShareCard({ result }: ShareCardProps) {
	const grade = getGrade(result.total_score);

	const sastCounts: CategoryRowProps["counts"] = result.sast
		? [
				{ label: "errors", value: result.sast.error_count, tone: "high" },
				{ label: "warnings", value: result.sast.warning_count, tone: "warn" },
			]
		: [{ label: "N/A", value: 0, tone: "low" }];

	const secretsCounts: CategoryRowProps["counts"] = result.secrets
		? [
				{
					label: "critical",
					value: result.secrets.critical_count,
					tone: "critical",
				},
			]
		: [{ label: "N/A", value: 0, tone: "low" }];

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
		: [{ label: "N/A", value: 0, tone: "low" }];

	return (
		<div className="relative w-full max-w-[420px] rounded-2xl bg-[var(--bg-card)] px-5 py-5 sm:px-7 sm:py-6 border border-[var(--border-subtle)] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden">
			<div className="pointer-events-none absolute -inset-0.5 rounded-[17px] bg-gradient-to-br from-[rgba(59,130,246,0.15)] via-transparent to-[rgba(59,130,246,0.05)]" />

			<div className="relative z-[1]">
				<div className="flex items-center justify-between mb-5">
					<div className="font-mono text-[13px] font-extrabold text-[var(--brand-blue)] tracking-tight">
						codescan<span className="text-[var(--text-muted)]">.dev</span>
					</div>
					<div className="font-mono text-[11px] text-[var(--text-light)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-md border border-[var(--border-light)]">
						{result.owner}/{result.repo}
					</div>
				</div>

				<div className="text-center mb-5">
					<ScoreRing score={result.total_score} grade={grade} />
					<div className="text-[11px] text-[var(--text-subtle)] tracking-wider uppercase font-medium">
						Security Score
					</div>
				</div>

				<div className="flex flex-col gap-[14px] mb-5">
					<CategoryRow label="SAST" counts={sastCounts} />
					<CategoryRow label="Secrets" counts={secretsCounts} />
					<CategoryRow label="Dependencies" counts={depsCounts} />
				</div>

				<div className="flex items-center justify-center pt-4 border-t border-[var(--border-subtle)]">
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

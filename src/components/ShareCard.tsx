import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getGrade, getGradeLabel } from "@/lib/score-utils";
import { type Tone, TONE_CLASSES } from "@/lib/severity-styles";
import type { ScanResult } from "@/types/scan";
import ScoreRing from "./ScoreRing";

interface ShareCardProps {
	result: ScanResult;
}

interface CategoryRowProps {
	label: string;
	counts: { label: string; value: number | null; tone: Tone }[];
}

function CategoryRow({ label, counts }: CategoryRowProps) {
	return (
		<div className="grid gap-3 py-4 sm:grid-cols-[140px_1fr] sm:items-center">
			<span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
				{label}
			</span>
			<div className="flex min-w-0 flex-wrap items-center gap-2 font-mono text-xs tabular-nums">
				{counts.map((count) => (
					<span
						key={count.label}
						className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${TONE_CLASSES[count.tone]}`}
					>
						{count.value === null ? (
							<span>{count.label}</span>
						) : (
							<>
								<span className="font-bold">{count.value}</span>
								<span>{count.label}</span>
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
				{ label: "serious", value: result.sast.error_count, tone: "high" },
				{ label: "warnings", value: result.sast.warning_count, tone: "warn" },
			]
		: [{ label: "not checked", value: null, tone: "neutral" }];

	const secretsCounts: CategoryRowProps["counts"] = result.secrets
		? [
				{
					label: "found",
					value: result.secrets.critical_count,
					tone: result.secrets.critical_count > 0 ? "critical" : "good",
				},
			]
		: [{ label: "not checked", value: null, tone: "neutral" }];

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
		: [{ label: "not checked", value: null, tone: "neutral" }];

	return (
		<div className="w-full overflow-hidden rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] shadow-sm">
			<div className="border-b border-[var(--border-subtle)] px-5 py-4 sm:px-7">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<Link
						href="/"
						className="font-mono text-sm font-extrabold text-[var(--brand-blue)]"
					>
						codescan<span className="text-[var(--text-primary)]">.dev</span>
					</Link>
					<div className="max-w-full truncate rounded-md border border-[var(--border-light)] bg-[var(--bg-subtle)] px-3 py-1.5 font-mono text-xs text-[var(--text-light)] sm:max-w-[420px]">
						{result.owner}/{result.repo}
					</div>
				</div>
			</div>

			<div className="grid gap-6 px-5 py-6 sm:grid-cols-[210px_1fr] sm:items-center sm:px-7">
				<ScoreRing score={result.total_score} grade={grade} />
				<div className="min-w-0 text-center sm:text-left">
					<div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
						Security grade
					</div>
					<div className="mt-2 text-3xl font-extrabold text-[var(--text-primary)]">
						{gradeLabel}
					</div>
					<p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
						This report summarizes risky code, exposed keys, and outdated
						packages found in this repository.
					</p>
				</div>
			</div>

			<div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)] px-5 sm:px-7">
				<CategoryRow label={CATEGORY_LABELS.sast} counts={sastCounts} />
				<CategoryRow label={CATEGORY_LABELS.secrets} counts={secretsCounts} />
				<CategoryRow label={CATEGORY_LABELS.deps} counts={depsCounts} />
			</div>

			<div className="flex items-center justify-center px-5 py-4 sm:px-7">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 rounded-md border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-3 py-1.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-blue-hover)]"
				>
					Scan another repo <span>→</span>
				</Link>
			</div>
		</div>
	);
}

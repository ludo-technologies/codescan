import {
	getGrade,
	getGradient,
	getTier,
	getTierColors,
} from "@/lib/score-utils";

interface MetricBarProps {
	name: string;
	score: number;
}

export default function MetricBar({ name, score }: MetricBarProps) {
	const tier = getTier(score);
	const grade = getGrade(score);
	const gradient = getGradient(tier);
	const { from } = getTierColors(tier);

	return (
		<div className="flex items-center gap-2.5">
			<span className="w-[100px] shrink-0 text-right text-[11px] font-semibold text-[var(--text-label)]">
				{name}
			</span>
			<div className="h-[7px] flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
				<div
					className="h-full rounded-full transition-all duration-700 ease-out"
					style={{ width: `${score}%`, background: gradient }}
				/>
			</div>
			<span
				className="w-7 shrink-0 text-center font-mono text-[11px] font-bold tabular-nums"
				style={{ color: from }}
			>
				{grade}
			</span>
		</div>
	);
}

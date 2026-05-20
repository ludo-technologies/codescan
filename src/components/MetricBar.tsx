import { getGradient, getTier, getTierColors } from "@/lib/score-utils";

interface MetricBarProps {
	name: string;
	score: number;
}

export default function MetricBar({ name, score }: MetricBarProps) {
	const tier = getTier(score);
	const gradient = getGradient(tier);
	const { to } = getTierColors(tier);

	return (
		<div className="flex items-center gap-2.5">
			<span className="w-[100px] shrink-0 text-right text-[11px] font-semibold text-[var(--text-label)] tracking-wide">
				{name}
			</span>
			<div className="flex-1 h-[7px] rounded-full bg-white/[0.06] overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-700 ease-out"
					style={{ width: `${score}%`, background: gradient }}
				/>
			</div>
			<span
				className="w-7 shrink-0 font-mono text-[11px] font-bold tabular-nums"
				style={{ color: to }}
			>
				{score}
			</span>
		</div>
	);
}

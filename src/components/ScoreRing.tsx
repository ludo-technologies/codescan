import { getTier, getTierColors } from "@/lib/score-utils";

const VIEWBOX_SIZE = 120;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = 50;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ScoreRingProps {
	score: number;
	grade: string;
}

export default function ScoreRing({ score, grade }: ScoreRingProps) {
	const tier = getTier(score);
	const { from, to } = getTierColors(tier);
	const dashoffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
	const gradientId = `ring-grad-${tier}`;
	const glowId = `ring-glow-${tier}`;

	return (
		<div className="relative mx-auto mb-2 h-[120px] w-[120px]">
			<svg
				viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
				className="h-full w-full -rotate-90"
			>
				<defs>
					<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor={from} />
						<stop offset="100%" stopColor={to} />
					</linearGradient>
					<filter id={glowId}>
						<feGaussianBlur stdDeviation="3" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>
				<circle
					cx={CENTER}
					cy={CENTER}
					r={RADIUS}
					fill="none"
					stroke="rgba(255,255,255,0.06)"
					strokeWidth={STROKE_WIDTH}
				/>
				<circle
					cx={CENTER}
					cy={CENTER}
					r={RADIUS}
					fill="none"
					stroke={`url(#${gradientId})`}
					strokeWidth={STROKE_WIDTH}
					strokeLinecap="round"
					strokeDasharray={CIRCUMFERENCE}
					strokeDashoffset={dashoffset}
					filter={`url(#${glowId})`}
				/>
			</svg>
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
				<div className="font-mono text-[36px] font-extrabold text-white leading-none">
					{score}
				</div>
				<div
					className="mt-1 text-[11px] font-bold tracking-[2px]"
					style={{ color: to }}
				>
					{grade}
				</div>
			</div>
		</div>
	);
}

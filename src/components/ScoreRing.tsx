import { getGradeLabel, getTier, getTierColors } from "@/lib/score-utils";

const VIEWBOX_SIZE = 160;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = 68;
const STROKE_WIDTH = 10;

interface ScoreRingProps {
	score: number;
	grade: string;
}

export default function ScoreRing({ score, grade }: ScoreRingProps) {
	const tier = getTier(score);
	const gradeLabel = getGradeLabel(score);
	const { from, to } = getTierColors(tier);
	const gradientId = `ring-grad-${tier}`;
	const glowId = `ring-glow-${tier}`;

	return (
		<div
			className="relative mx-auto h-[156px] w-[156px] rounded-full bg-white/[0.03] sm:h-[172px] sm:w-[172px]"
			role="img"
			aria-label={`Security grade ${grade}: ${gradeLabel}`}
		>
			<svg
				viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
				className="h-full w-full"
				aria-hidden="true"
			>
				<title>{`Security grade ${grade}`}</title>
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
					stroke="rgba(255,255,255,0.08)"
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
					filter={`url(#${glowId})`}
				/>
			</svg>
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
				<div className="font-mono text-[78px] font-extrabold leading-none text-white sm:text-[86px]">
					{grade}
				</div>
				<div
					className="mx-auto mt-1 h-1.5 w-10 rounded-full"
					style={{ background: to }}
				/>
			</div>
		</div>
	);
}

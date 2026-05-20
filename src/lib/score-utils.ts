export type Tier = "excellent" | "good" | "fair" | "poor";

const TIER_EXCELLENT_MIN = 80;
const TIER_GOOD_MIN = 60;
const TIER_FAIR_MIN = 40;
const GRADE_D_MIN = 20;

export type Grade = "A" | "B" | "C" | "D" | "F";

export function getGrade(score: number): Grade {
	if (score >= TIER_EXCELLENT_MIN) return "A";
	if (score >= TIER_GOOD_MIN) return "B";
	if (score >= TIER_FAIR_MIN) return "C";
	if (score >= GRADE_D_MIN) return "D";
	return "F";
}

export function getTier(score: number): Tier {
	if (score >= TIER_EXCELLENT_MIN) return "excellent";
	if (score >= TIER_GOOD_MIN) return "good";
	if (score >= TIER_FAIR_MIN) return "fair";
	return "poor";
}

// Note: excellent/fair/poor use hex literals as no CSS variables are defined for them.
// The good tier matches --brand-blue and --brand-blue-light.
const TIER_COLORS: Record<Tier, { from: string; to: string }> = {
	excellent: { from: "#22c55e", to: "#4ade80" },
	good: { from: "var(--brand-blue)", to: "var(--brand-blue-light)" },
	fair: { from: "#F59E0B", to: "#FBBF24" },
	poor: { from: "#EF4444", to: "#F87171" },
};

export function getTierColors(tier: Tier): { from: string; to: string } {
	return TIER_COLORS[tier];
}

export function getGradient(tier: Tier): string {
	const { from, to } = getTierColors(tier);
	return `linear-gradient(90deg, ${from}, ${to})`;
}

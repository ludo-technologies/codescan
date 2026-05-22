import { describe, expect, it } from "vitest";
import {
	getGrade,
	getGradeLabel,
	getGradient,
	getTier,
	getTierColors,
} from "@/lib/score-utils";

describe("getTier", () => {
	describe("excellent tier (>= 80)", () => {
		it("returns 'excellent' for score 80 (boundary)", () => {
			expect(getTier(80)).toBe("excellent");
		});
		it("returns 'excellent' for score 100", () => {
			expect(getTier(100)).toBe("excellent");
		});
		it("returns 'excellent' for score 95", () => {
			expect(getTier(95)).toBe("excellent");
		});
	});

	describe("good tier (60-79)", () => {
		it("returns 'good' for score 60 (boundary)", () => {
			expect(getTier(60)).toBe("good");
		});
		it("returns 'good' for score 79 (upper boundary)", () => {
			expect(getTier(79)).toBe("good");
		});
		it("returns 'good' for score 70", () => {
			expect(getTier(70)).toBe("good");
		});
	});

	describe("fair tier (40-59)", () => {
		it("returns 'fair' for score 40 (boundary)", () => {
			expect(getTier(40)).toBe("fair");
		});
		it("returns 'fair' for score 59 (upper boundary)", () => {
			expect(getTier(59)).toBe("fair");
		});
		it("returns 'fair' for score 50", () => {
			expect(getTier(50)).toBe("fair");
		});
	});

	describe("poor tier (< 40)", () => {
		it("returns 'poor' for score 39 (boundary)", () => {
			expect(getTier(39)).toBe("poor");
		});
		it("returns 'poor' for score 0", () => {
			expect(getTier(0)).toBe("poor");
		});
		it("returns 'poor' for score 1", () => {
			expect(getTier(1)).toBe("poor");
		});
	});
});

describe("getGrade", () => {
	it.each([
		["A", 80],
		["B", 60],
		["C", 40],
		["D", 20],
		["F", 19],
	])("returns %s for score %i", (expected, score) => {
		expect(getGrade(score)).toBe(expected);
	});
});

describe("getGradeLabel", () => {
	it.each([
		["Excellent", 80],
		["Good", 60],
		["Fair", 40],
		["Needs work", 20],
		["At risk", 19],
	])("returns %s for score %i", (expected, score) => {
		expect(getGradeLabel(score)).toBe(expected);
	});
});

describe("getTierColors", () => {
	it("returns green colors for excellent tier", () => {
		const colors = getTierColors("excellent");
		expect(colors.from).toBe("#22c55e");
		expect(colors.to).toBe("#4ade80");
	});

	it("returns CSS variable colors for good tier", () => {
		const colors = getTierColors("good");
		expect(colors.from).toBe("var(--brand-blue)");
		expect(colors.to).toBe("var(--brand-blue-light)");
	});

	it("returns amber colors for fair tier", () => {
		const colors = getTierColors("fair");
		expect(colors.from).toBe("#F59E0B");
		expect(colors.to).toBe("#FBBF24");
	});

	it("returns red colors for poor tier", () => {
		const colors = getTierColors("poor");
		expect(colors.from).toBe("#EF4444");
		expect(colors.to).toBe("#F87171");
	});

	it("returns an object with 'from' and 'to' keys", () => {
		const colors = getTierColors("excellent");
		expect(colors).toHaveProperty("from");
		expect(colors).toHaveProperty("to");
	});
});

describe("getGradient", () => {
	it("returns a valid CSS linear-gradient string for excellent", () => {
		expect(getGradient("excellent")).toBe(
			"linear-gradient(90deg, #22c55e, #4ade80)",
		);
	});

	it("returns a valid CSS linear-gradient string for poor", () => {
		expect(getGradient("poor")).toBe(
			"linear-gradient(90deg, #EF4444, #F87171)",
		);
	});

	it("includes 90deg direction for all tiers", () => {
		for (const tier of ["excellent", "good", "fair", "poor"] as const) {
			expect(getGradient(tier)).toMatch(/^linear-gradient\(90deg,/);
		}
	});

	it("gradient matches getTierColors values", () => {
		const tier = "fair";
		const { from, to } = getTierColors(tier);
		expect(getGradient(tier)).toBe(`linear-gradient(90deg, ${from}, ${to})`);
	});
});

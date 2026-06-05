import { describe, expect, it } from "vitest";
import { renderGradeBadge, renderNeutralBadge } from "@/lib/badge";

describe("renderGradeBadge", () => {
	it("renders valid SVG with the grade as the message", () => {
		const svg = renderGradeBadge(95);
		expect(svg).toContain("<svg");
		expect(svg).toContain("security: A");
		expect(svg).toContain("#22c55e"); // grade A color
	});

	it("colors a failing grade red", () => {
		const svg = renderGradeBadge(0);
		expect(svg).toContain("security: F");
		expect(svg).toContain("#ef4444");
	});
});

describe("renderNeutralBadge", () => {
	it("renders a 'not scanned' fallback badge", () => {
		const svg = renderNeutralBadge();
		expect(svg).toContain("<svg");
		expect(svg).toContain("security: not scanned");
		expect(svg).toContain("#9f9f9f");
	});
});

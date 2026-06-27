import { describe, expect, it } from "vitest";
import {
	computeScanProgress,
	getElapsedMs,
	getPhaseStatus,
} from "@/lib/scan-progress";

describe("computeScanProgress", () => {
	it("reports queue state while pending", () => {
		const progress = computeScanProgress("pending", 5_000, 0);
		expect(progress.phase).toBe("queued");
		expect(progress.progressPercent).toBeGreaterThan(0);
		expect(progress.progressPercent).toBeLessThan(11);
		expect(progress.remainingLabel).toMatch(/remaining|Almost done/);
	});

	it("moves into running phases once status is running", () => {
		const progress = computeScanProgress("running", 20_000, 20_000);
		expect(progress.phase).not.toBe("queued");
		expect(progress.progressPercent).toBeGreaterThan(5);
		expect(progress.progressPercent).toBeLessThan(95);
	});

	it("starts running progress from zero after a queue wait", () => {
		const progress = computeScanProgress("running", 90_000, 2_000);
		expect(progress.phase).toBe("downloading");
		expect(progress.progressPercent).toBeLessThan(20);
		expect(progress.remainingLabel).toMatch(/remaining|Almost done/);
	});

	it("extends the estimate when a scan runs longer than the default", () => {
		const onTime = computeScanProgress("running", 30_000, 30_000);
		const overdue = computeScanProgress("running", 180_000, 180_000);
		expect(overdue.estimatedTotalMs).toBeGreaterThan(onTime.estimatedTotalMs);
		expect(onTime.progressPercent).toBeLessThan(overdue.progressPercent);
	});
});

describe("getPhaseStatus", () => {
	it("marks earlier phases as done", () => {
		expect(getPhaseStatus("downloading", "dependencies")).toBe("done");
		expect(getPhaseStatus("dependencies", "dependencies")).toBe("active");
		expect(getPhaseStatus("sast", "dependencies")).toBe("upcoming");
	});
});

describe("getElapsedMs", () => {
	it("prefers requested_at when available", () => {
		const requestedAt = "2026-06-28T12:00:00Z";
		const now = Date.parse("2026-06-28T12:00:20Z");
		expect(getElapsedMs(requestedAt, now - 5_000, now)).toBe(20_000);
	});

	it("falls back to local start time when requested_at is missing", () => {
		const startedAt = Date.now() - 12_000;
		expect(getElapsedMs(undefined, startedAt)).toBeGreaterThanOrEqual(12_000);
	});
});

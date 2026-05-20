import { describe, expect, it } from "vitest";
import { isPollingStatus } from "@/hooks/useScanPolling";

describe("isPollingStatus", () => {
	it("returns true for 'pending'", () => {
		expect(isPollingStatus("pending")).toBe(true);
	});

	it("returns true for 'running'", () => {
		expect(isPollingStatus("running")).toBe(true);
	});

	it("returns false for 'completed'", () => {
		expect(isPollingStatus("completed")).toBe(false);
	});

	it("returns false for 'failed'", () => {
		expect(isPollingStatus("failed")).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isPollingStatus(undefined)).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isPollingStatus("")).toBe(false);
	});

	it("returns false for unknown status", () => {
		expect(isPollingStatus("unknown")).toBe(false);
	});
});

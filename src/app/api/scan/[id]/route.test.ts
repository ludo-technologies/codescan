import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const backendConfig = {
	apiUrl: "http://engine.test",
	backendApiKey: "test-key",
};

vi.mock("@/lib/server-env", () => ({
	getBackendConfig: () => backendConfig,
}));

vi.mock("@/lib/auth", () => ({
	getSession: vi.fn().mockResolvedValue(null),
}));

describe("GET /api/scan/[id]", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("returns 504 on upstream timeout instead of a fake running status", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => {
				const err = new Error("The operation was aborted");
				err.name = "AbortError";
				return Promise.reject(err);
			}),
		);

		const res = await GET({} as Request, {
			params: Promise.resolve({ id: "scan-123" }),
		});
		const body = await res.json();

		expect(res.status).toBe(504);
		expect(body).toEqual({
			error: "Scan service timed out. Retrying...",
		});
	});

	it("returns 503 on upstream network errors", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.reject(new Error("ECONNREFUSED"))),
		);

		const res = await GET({} as Request, {
			params: Promise.resolve({ id: "scan-123" }),
		});
		const body = await res.json();

		expect(res.status).toBe(503);
		expect(body).toEqual({
			error: "Failed to reach scan service. Retrying...",
		});
	});

	it("does not cache upstream scan status responses", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: () =>
				Promise.resolve(
					JSON.stringify({
						id: "scan-123",
						owner: "owner",
						repo: "repo",
						status: "running",
						total_score: 0,
						scanner_versions: {},
						requested_at: "2026-06-28T00:00:00Z",
					}),
				),
		});
		vi.stubGlobal("fetch", fetchMock);

		const res = await GET({} as Request, {
			params: Promise.resolve({ id: "scan-123" }),
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://engine.test/api/scan/scan-123",
			expect.objectContaining({ cache: "no-store" }),
		);
		expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0");
	});
});

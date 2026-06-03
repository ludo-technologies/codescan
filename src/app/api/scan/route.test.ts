// @vitest-environment node

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/scan/route";

function makeRequest(body: unknown) {
	return new NextRequest("http://localhost/api/scan", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("POST /api/scan", () => {
	beforeEach(() => {
		vi.stubEnv("API_URL", "https://backend.example.com");
		vi.stubEnv("BACKEND_API_KEY", "test-backend-api-key");
		vi.stubGlobal("fetch", vi.fn());
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	describe("request validation", () => {
		it("returns 400 for invalid JSON", async () => {
			const req = new NextRequest("http://localhost/api/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "not-valid-json{{{",
			});
			const res = await POST(req);
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.error).toBe("Invalid JSON");
		});

		it("returns 400 when repo_url is missing", async () => {
			const res = await POST(makeRequest({}));
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.error).toBe("repo_url is required");
		});

		it("returns 400 when body is null", async () => {
			const res = await POST(makeRequest(null));
			expect(res.status).toBe(400);
		});

		it("returns 400 when repo_url is not a string", async () => {
			const res = await POST(makeRequest({ repo_url: 123 }));
			expect(res.status).toBe(400);
		});

		it("returns 422 for non-GitHub URL", async () => {
			const res = await POST(
				makeRequest({ repo_url: "https://example.com/repo" }),
			);
			expect(res.status).toBe(422);
			const body = await res.json();
			expect(body.error).toContain("Invalid repository URL");
		});

		it("returns 422 for GitHub URL with sub-path", async () => {
			const res = await POST(
				makeRequest({ repo_url: "https://github.com/owner/repo/issues" }),
			);
			expect(res.status).toBe(422);
		});

		it("returns 422 for HTTP (non-HTTPS) GitHub URL", async () => {
			const res = await POST(
				makeRequest({ repo_url: "http://github.com/owner/repo" }),
			);
			expect(res.status).toBe(422);
		});

		it("accepts a valid GitHub URL and calls the backend", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: true,
					status: 200,
					text: () =>
						Promise.resolve(
							JSON.stringify({
								scan_id: "abc",
								status: "pending",
								cached: false,
							}),
						),
				}),
			);

			const res = await POST(
				makeRequest({ repo_url: "https://github.com/owner/repo" }),
			);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.scan_id).toBe("abc");
		});

		it("accepts a valid GitHub URL with trailing slash", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: true,
					status: 200,
					text: () =>
						Promise.resolve(
							JSON.stringify({
								scan_id: "xyz",
								status: "pending",
								cached: false,
							}),
						),
				}),
			);

			const res = await POST(
				makeRequest({ repo_url: "https://github.com/owner/repo/" }),
			);
			expect(res.status).toBe(200);
		});

		it("trims whitespace from repo_url before validation", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: true,
					status: 200,
					text: () =>
						Promise.resolve(
							JSON.stringify({
								scan_id: "xyz",
								status: "pending",
								cached: false,
							}),
						),
				}),
			);

			const res = await POST(
				makeRequest({ repo_url: "  https://github.com/owner/repo  " }),
			);
			expect(res.status).toBe(200);
		});
	});

	describe("upstream error handling", () => {
		it("returns 404 with safe message for upstream 404", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: false,
					status: 404,
					text: () => Promise.resolve("Not found"),
				}),
			);

			const res = await POST(
				makeRequest({ repo_url: "https://github.com/owner/repo" }),
			);
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body.error).toBe("Repository not found");
		});

		it("returns 403 with safe message for upstream 403", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: false,
					status: 403,
					text: () => Promise.resolve("Forbidden"),
				}),
			);

			const res = await POST(
				makeRequest({ repo_url: "https://github.com/owner/repo" }),
			);
			expect(res.status).toBe(403);
			const body = await res.json();
			expect(body.error).toBe("Access denied to repository");
		});

		it("returns 504 on timeout (AbortError)", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockImplementation(() => {
					const err = new Error("The operation was aborted.");
					err.name = "AbortError";
					return Promise.reject(err);
				}),
			);

			const res = await POST(
				makeRequest({ repo_url: "https://github.com/owner/repo" }),
			);
			expect(res.status).toBe(504);
			const body = await res.json();
			expect(body.error).toContain("timed out");
		});

		it("returns 503 on generic network error", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
			);

			const res = await POST(
				makeRequest({ repo_url: "https://github.com/owner/repo" }),
			);
			expect(res.status).toBe(503);
			const body = await res.json();
			expect(body.error).toContain("Network error");
		});

		it("returns 502 when upstream returns invalid JSON", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: true,
					status: 200,
					text: () => Promise.resolve("not-json{{{"),
				}),
			);

			const res = await POST(
				makeRequest({ repo_url: "https://github.com/owner/repo" }),
			);
			expect(res.status).toBe(502);
			const body = await res.json();
			expect(body.error).toBe("Invalid upstream response");
		});
	});
});

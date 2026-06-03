import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { scanResponseSchema } from "@/lib/scan-schema";
import { getBackendConfig } from "@/lib/server-env";

const BACKEND_TIMEOUT_MS = 8000; // 8s — kept below Vercel's 10s function limit

const GITHUB_URL_PATTERN =
	/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;

export async function POST(req: NextRequest) {
	let backendConfig: ReturnType<typeof getBackendConfig>;
	try {
		backendConfig = getBackendConfig();
	} catch (error) {
		console.error("Scan API is not configured:", {
			error: error instanceof Error ? error.message : String(error),
		});
		return NextResponse.json(
			{ error: "Scan service is not configured" },
			{ status: 503 },
		);
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	// Server-side validation
	if (
		typeof body !== "object" ||
		body === null ||
		typeof (body as Record<string, unknown>).repo_url !== "string"
	) {
		return NextResponse.json(
			{ error: "repo_url is required" },
			{ status: 400 },
		);
	}

	const repoUrl = (body as Record<string, string>).repo_url.trim();
	if (!GITHUB_URL_PATTERN.test(repoUrl)) {
		return NextResponse.json(
			{
				error: "Invalid repository URL. Must be a valid GitHub repository URL.",
			},
			{ status: 422 },
		);
	}

	// Extract GitHub token + user identity from session for private repo access.
	const session = await getSession();
	const githubToken = session?.accessToken ?? null;
	const requesterUserId = session?.userId ?? null;

	// Timeout setup
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		headers.Authorization = `Bearer ${backendConfig.backendApiKey}`;

		const scanBody: Record<string, string | number> = { repo_url: repoUrl };
		if (githubToken) {
			scanBody.github_token = githubToken;
		}
		if (requesterUserId) {
			scanBody.requester_user_id = requesterUserId;
		}

		const res = await fetch(`${backendConfig.apiUrl}/api/scan`, {
			method: "POST",
			headers,
			body: JSON.stringify(scanBody),
			signal: controller.signal,
		});
		clearTimeout(timeoutId);

		const text = await res.text();
		if (!res.ok) {
			// Log the actual error for debugging, but don't expose it to the client
			console.error("Upstream scan API error:", {
				status: res.status,
				body: text,
			});

			// Return a safe, generic error message to the client
			const safeErrorMessage =
				res.status === 404
					? "Repository not found"
					: res.status === 403
						? "Access denied to repository"
						: res.status === 422
							? "Invalid repository URL"
							: "Failed to scan repository. Please try again later.";

			return NextResponse.json(
				{ error: safeErrorMessage },
				{ status: res.status },
			);
		}

		try {
			const parsed = scanResponseSchema.safeParse(JSON.parse(text));
			if (!parsed.success) {
				console.error("Invalid upstream scan response:", {
					issues: parsed.error.issues,
				});
				return NextResponse.json(
					{ error: "Invalid upstream response" },
					{ status: 502 },
				);
			}

			return NextResponse.json(parsed.data, { status: res.status });
		} catch {
			return NextResponse.json(
				{ error: "Invalid upstream response" },
				{ status: 502 },
			);
		}
	} catch (error) {
		clearTimeout(timeoutId);

		// Timeout or network error
		if (error instanceof Error && error.name === "AbortError") {
			console.error("Backend API timeout during scan request:", { body });
			return NextResponse.json(
				{ error: "Request timed out. Please try again." },
				{ status: 504 },
			);
		}

		console.error("Backend API network error during scan request:", {
			error: error instanceof Error ? error.message : String(error),
		});
		return NextResponse.json(
			{ error: "Network error. Please try again." },
			{ status: 503 },
		);
	}
}

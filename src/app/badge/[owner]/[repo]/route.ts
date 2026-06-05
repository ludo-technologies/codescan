import type { NextRequest } from "next/server";
import { renderGradeBadge, renderNeutralBadge } from "@/lib/badge";
import { scanResultSchema } from "@/lib/scan-schema";
import { getBackendConfig } from "@/lib/server-env";

// Matches GitHub's owner/repo naming so we never forward junk to the backend.
const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const OWNER_MAX_LEN = 39;
const REPO_MAX_LEN = 100;

const BACKEND_TIMEOUT_MS = 5000;

// SVG headers shared by every response. A badge embedded in a README must never
// render as a broken image, so failures still return 200 with the neutral badge.
function svgResponse(svg: string, maxAge: number): Response {
	return new Response(svg, {
		status: 200,
		headers: {
			"Content-Type": "image/svg+xml; charset=utf-8",
			"Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=86400`,
		},
	});
}

// No public scan (or any error): a short-lived neutral badge so it refreshes to
// a grade soon after the repo is first scanned.
function neutral(): Response {
	return svgResponse(renderNeutralBadge(), 300);
}

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ owner: string; repo: string }> },
) {
	const { owner, repo: rawRepo } = await params;
	// Allow both /badge/owner/repo and /badge/owner/repo.svg.
	const repo = rawRepo.replace(/\.svg$/, "");

	if (
		owner.length > OWNER_MAX_LEN ||
		repo.length > REPO_MAX_LEN ||
		!NAME_PATTERN.test(owner) ||
		!NAME_PATTERN.test(repo)
	) {
		return neutral();
	}

	let backendConfig: ReturnType<typeof getBackendConfig>;
	try {
		backendConfig = getBackendConfig();
	} catch {
		return neutral();
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

	let res: Response;
	try {
		res = await fetch(
			`${backendConfig.apiUrl}/api/repo/${owner}/${repo}/scan`,
			{
				headers: { Authorization: `Bearer ${backendConfig.backendApiKey}` },
				signal: controller.signal,
			},
		);
	} catch {
		return neutral();
	} finally {
		clearTimeout(timeoutId);
	}

	if (!res.ok) {
		return neutral();
	}

	const parsed = scanResultSchema.safeParse(await res.json());
	if (
		!parsed.success ||
		parsed.data.status !== "completed" ||
		parsed.data.is_private
	) {
		return neutral();
	}

	// Public, completed scans are immutable, so the badge can cache for a day.
	return svgResponse(renderGradeBadge(parsed.data.total_score), 86400);
}

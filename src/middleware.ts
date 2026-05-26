import { type NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const hits = new Map<string, { count: number; resetAt: number }>();

function cleanupStaleEntries(now: number) {
	for (const [key, entry] of hits) {
		if (now >= entry.resetAt) hits.delete(key);
	}
}

function getClientIp(req: NextRequest): string {
	return (
		req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
		req.headers.get("x-real-ip") ??
		"unknown"
	);
}

export function middleware(req: NextRequest) {
	if (req.method !== "POST") return NextResponse.next();

	const now = Date.now();

	if (hits.size > 10_000) cleanupStaleEntries(now);

	const ip = getClientIp(req);
	const entry = hits.get(ip);

	if (!entry || now >= entry.resetAt) {
		hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
		return NextResponse.next();
	}

	entry.count++;

	if (entry.count > MAX_REQUESTS) {
		const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
		return NextResponse.json(
			{ error: "Too many requests. Please try again later." },
			{
				status: 429,
				headers: { "Retry-After": String(retryAfter) },
			},
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: "/api/scan",
};

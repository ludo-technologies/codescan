import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const API_URL = process.env.API_URL ?? "";
const BACKEND_API_KEY = process.env.BACKEND_API_KEY ?? "";
const BACKEND_TIMEOUT_MS = 8000; // 8s — kept below Vercel's 10s function limit

const SCAN_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	if (!SCAN_ID_PATTERN.test(id)) {
		return NextResponse.json({ error: "Invalid scan ID" }, { status: 400 });
	}

	// Timeout setup
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

	try {
		const headers: Record<string, string> = {};
		if (BACKEND_API_KEY) {
			headers.Authorization = `Bearer ${BACKEND_API_KEY}`;

			// The viewer ID is only meaningful as authorization proof when the
			// backend request is itself authenticated. Without the API key the
			// channel is untrusted, so we never assert an identity — private
			// reports then fail closed at the backend rather than being spoofable.
			const session = await getSession();
			if (session?.userId) {
				headers["X-Viewer-User-ID"] = String(session.userId);
			}
		}

		const res = await fetch(`${API_URL}/api/scan/${id}`, {
			headers,
			signal: controller.signal,
		});
		clearTimeout(timeoutId);

		const text = await res.text();
		if (!res.ok) {
			// Log the actual error for debugging, but don't expose it to the client
			console.error("Upstream scan result API error:", {
				status: res.status,
				scanId: id,
				body: text,
			});

			// Return a safe, generic error message to the client
			const safeErrorMessage =
				res.status === 404
					? "Scan not found"
					: "Failed to retrieve scan result. Please try again later.";

			return NextResponse.json(
				{ error: safeErrorMessage },
				{ status: res.status },
			);
		}

		try {
			return NextResponse.json(JSON.parse(text), { status: res.status });
		} catch {
			return NextResponse.json(
				{ error: "Invalid upstream response" },
				{ status: 502 },
			);
		}
	} catch (error) {
		clearTimeout(timeoutId);

		// On timeout, treat the scan as still in progress to keep polling alive
		if (error instanceof Error && error.name === "AbortError") {
			console.warn("Backend API timeout for scan:", { scanId: id });

			// Return "running" status so the client continues polling
			return NextResponse.json(
				{
					id: id,
					status: "running",
					message: "Scan is still in progress",
				},
				{ status: 200 },
			);
		}

		// Other network errors — treat as "running" to continue polling
		console.error("Backend API network error:", {
			scanId: id,
			error: error instanceof Error ? error.message : String(error),
		});

		return NextResponse.json(
			{
				id: id,
				status: "running",
				message: "Connecting to backend...",
			},
			{ status: 200 },
		);
	}
}

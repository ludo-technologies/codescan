import type { ScanResponse, ScanResult } from "@/types/scan";
import { scanResponseSchema, scanResultSchema } from "./scan-schema";

async function readErrorMessage(
	res: Response,
	fallback: string,
): Promise<string> {
	try {
		const body = await res.json();
		if (
			body &&
			typeof body === "object" &&
			"error" in body &&
			typeof body.error === "string"
		) {
			return body.error;
		}
	} catch {
		// Fall through to the generic message.
	}

	return fallback;
}

export async function requestScan(repoUrl: string): Promise<ScanResponse> {
	const res = await fetch("/api/scan", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ repo_url: repoUrl }),
	});
	if (!res.ok) {
		throw new Error(
			await readErrorMessage(res, `Scan request failed: ${res.status}`),
		);
	}

	const parsed = scanResponseSchema.safeParse(await res.json());
	if (!parsed.success) {
		throw new Error("Invalid scan response");
	}
	return parsed.data;
}

export async function getScanResult(id: string): Promise<ScanResult> {
	const res = await fetch(`/api/scan/${id}`);
	if (!res.ok) {
		throw new Error(
			await readErrorMessage(res, `Failed to fetch scan: ${res.status}`),
		);
	}

	const parsed = scanResultSchema.safeParse(await res.json());
	if (!parsed.success) {
		throw new Error("Invalid scan response");
	}
	return parsed.data;
}

import type { ScanResponse, ScanResult } from "@/types/scan";

export async function requestScan(repoUrl: string): Promise<ScanResponse> {
	const res = await fetch("/api/scan", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ repo_url: repoUrl }),
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(body || `Scan request failed: ${res.status}`);
	}
	return res.json();
}

export async function getScanResult(id: string): Promise<ScanResult> {
	const res = await fetch(`/api/scan/${id}`);
	if (!res.ok) {
		const body = await res.text();
		throw new Error(body || `Failed to fetch scan: ${res.status}`);
	}
	return res.json();
}

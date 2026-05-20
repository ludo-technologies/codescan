"use client";

import useSWR from "swr";
import { getScanResult } from "@/lib/api";
import type { ScanResult } from "@/types/scan";

const POLL_INTERVAL_MS = 2000;

export function isPollingStatus(status: string | undefined): boolean {
	return status === "pending" || status === "running";
}

export function useScanPolling(id: string) {
	const { data: result, error } = useSWR<ScanResult>(
		`/api/scan/${id}`,
		() => getScanResult(id),
		{
			refreshInterval: (latestData) =>
				isPollingStatus(latestData?.status) ? POLL_INTERVAL_MS : 0,
			revalidateOnFocus: false,
		},
	);

	const isPolling = !result || isPollingStatus(result.status);

	return { result, error, isPolling };
}

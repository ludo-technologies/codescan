"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { getScanResult } from "@/lib/api";
import type { ScanResult } from "@/types/scan";

const POLL_INTERVAL_MS = 2000;
// The engine times scans out at 10 minutes; the extra margin covers queue wait.
// This is a backstop so a scan stuck in "running" doesn't poll forever.
const MAX_POLL_DURATION_MS = 15 * 60 * 1000;

export function isPollingStatus(status: string | undefined): boolean {
	return status === "pending" || status === "running";
}

export function useScanPolling(id: string) {
	const startedAtRef = useRef<number | null>(null);
	const [timedOut, setTimedOut] = useState(false);

	const { data: result, error } = useSWR<ScanResult>(
		`/api/scan/${id}`,
		() => getScanResult(id),
		{
			refreshInterval: (latestData) => {
				if (!isPollingStatus(latestData?.status)) return 0;
				startedAtRef.current ??= Date.now();
				if (Date.now() - startedAtRef.current >= MAX_POLL_DURATION_MS) {
					setTimedOut(true);
					return 0;
				}
				return POLL_INTERVAL_MS;
			},
			dedupingInterval: 0,
			revalidateOnFocus: true,
			revalidateOnReconnect: true,
			// Keep polling through transient proxy/backend failures.
			shouldRetryOnError: true,
			errorRetryCount: 100,
			errorRetryInterval: POLL_INTERVAL_MS,
		},
	);

	const isPolling = !timedOut && (!result || isPollingStatus(result.status));
	const pollError = isPolling ? undefined : error;

	return { result, error: pollError, isPolling, timedOut };
}

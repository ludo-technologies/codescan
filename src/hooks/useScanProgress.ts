"use client";

import { useEffect, useRef, useState } from "react";
import {
	computeScanProgress,
	getElapsedMs,
	type ScanProgressState,
} from "@/lib/scan-progress";
import type { ScanResult, ScanStatus } from "@/types/scan";

const TICK_MS = 1000;

function getRunningElapsedMs(
	status: ScanStatus | undefined,
	now: number,
	totalElapsedMs: number,
	runningStartedAt: number | null,
): number {
	if (status !== "running") return 0;
	if (runningStartedAt !== null) {
		return Math.max(0, now - runningStartedAt);
	}
	// Page loaded mid-scan without observing the queue; fall back to total elapsed.
	return totalElapsedMs;
}

export function useScanProgress(
	result: ScanResult | undefined,
	isPolling: boolean,
): ScanProgressState {
	const fallbackStartedAtRef = useRef(Date.now());
	const runningStartedAtRef = useRef<number | null>(null);
	const sawPendingRef = useRef(false);
	const scanIdRef = useRef(result?.id);
	const [now, setNow] = useState(() => Date.now());

	if (result?.id !== scanIdRef.current) {
		scanIdRef.current = result?.id;
		runningStartedAtRef.current = null;
		sawPendingRef.current = false;
	}

	const status = result?.status;
	if (status === "pending") {
		sawPendingRef.current = true;
		runningStartedAtRef.current = null;
	} else if (
		status === "running" &&
		runningStartedAtRef.current === null &&
		sawPendingRef.current
	) {
		// Reset the clock when a watched scan leaves the queue.
		runningStartedAtRef.current = Date.now();
	}

	useEffect(() => {
		if (!isPolling) return;
		const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
		return () => window.clearInterval(timer);
	}, [isPolling]);

	const totalElapsedMs = getElapsedMs(
		result?.requested_at,
		fallbackStartedAtRef.current,
		now,
	);
	const runningElapsedMs = getRunningElapsedMs(
		status,
		now,
		totalElapsedMs,
		runningStartedAtRef.current,
	);

	return computeScanProgress(status, totalElapsedMs, runningElapsedMs);
}

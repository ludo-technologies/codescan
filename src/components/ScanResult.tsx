"use client";

import { useScanPolling } from "@/hooks/useScanPolling";
import { useScanProgress } from "@/hooks/useScanProgress";
import FindingsList from "./FindingsList";
import ScanResultError from "./ScanResultError";
import ScanResultLoading from "./ScanResultLoading";
import ShareActions from "./ShareActions";
import ShareCard from "./ShareCard";

interface ScanResultProps {
	id: string;
}

export default function ScanResult({ id }: ScanResultProps) {
	const { result, error, isPolling, timedOut } = useScanPolling(id);
	const progress = useScanProgress(result, isPolling);

	if (timedOut) {
		return (
			<ScanResultError
				title="Scan Timed Out"
				message="The scan is taking longer than expected. Please try again later."
			/>
		);
	}

	if (error) {
		return (
			<ScanResultError
				message={
					error instanceof Error ? error.message : "Failed to load result"
				}
			/>
		);
	}

	if (isPolling) {
		return <ScanResultLoading progress={progress} />;
	}

	if (result?.status === "failed") {
		return (
			<ScanResultError
				title="Scan Failed"
				message={result.error_message ?? "Unknown error"}
			/>
		);
	}

	if (!result) return null;

	return (
		<div className="flex w-full max-w-5xl flex-col items-center gap-5">
			<ShareCard result={result} />
			<FindingsList result={result} />
			<ShareActions result={result} />
		</div>
	);
}

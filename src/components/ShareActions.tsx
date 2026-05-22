"use client";

import { useCallback } from "react";
import { getGrade } from "@/lib/score-utils";
import { buildSecurityReport } from "@/lib/security-report";
import type { ScanResult } from "@/types/scan";

interface ShareActionsProps {
	result: ScanResult;
}

export default function ShareActions({ result }: ShareActionsProps) {
	const siteUrl =
		process.env.NEXT_PUBLIC_SITE_URL ??
		(typeof window === "undefined" ? "" : window.location.origin);
	const shareUrl = `${siteUrl.replace(/\/$/, "")}/scan/${result.id}`;

	const handleDownload = useCallback(() => {
		try {
			const blob = new Blob([buildSecurityReport(result)], {
				type: "text/markdown;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${result.owner}-${result.repo}-security-report.md`;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			// TODO: show user-facing error toast
			console.error("Failed to download security report");
		}
	}, [result]);

	const handleCopyLink = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
		} catch {
			// Clipboard API may fail in insecure contexts
			console.error("Failed to copy link");
		}
	}, [shareUrl]);

	const grade = getGrade(result.total_score);
	const shareText = `${result.owner}/${result.repo} earned grade ${grade} on codescan.dev`;

	return (
		<div className="flex flex-wrap justify-center gap-3">
			<a
				href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle-hover)]"
			>
				<svg
					aria-hidden="true"
					className="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
				</svg>
				Share on X
			</a>
			<button
				type="button"
				onClick={handleDownload}
				className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle-hover)]"
			>
				<svg
					aria-hidden="true"
					className="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Download Security Report
			</button>
			<button
				type="button"
				onClick={handleCopyLink}
				className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle-hover)]"
			>
				<svg
					aria-hidden="true"
					className="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
				</svg>
				Copy Link
			</button>
		</div>
	);
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestScan } from "@/lib/api";

const GITHUB_URL_PATTERN = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

function SearchIcon({ className }: { className: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<title>Search</title>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
	);
}

function Spinner({ className }: { className: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none">
			<title>Loading</title>
			<circle
				className="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				strokeWidth="4"
			/>
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			/>
		</svg>
	);
}

export default function ScanForm() {
	const router = useRouter();
	const [url, setUrl] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");

		if (!GITHUB_URL_PATTERN.test(url.trim())) {
			setError("Please enter a valid GitHub repository URL");
			return;
		}

		setLoading(true);
		try {
			const res = await requestScan(url.trim());
			router.push(`/scan/${res.scan_id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to start scan");
			setLoading(false);
		}
	}

	const buttonContent = loading ? (
		<span className="inline-flex items-center justify-center gap-2">
			<Spinner className="h-4 w-4 animate-spin" />
			Scanning...
		</span>
	) : (
		"Scan Repo"
	);

	return (
		<form onSubmit={handleSubmit} className="w-full max-w-2xl px-4">
			<div className="flex flex-col gap-3 sm:block">
				<div className="group relative flex items-center">
					<div className="pointer-events-none absolute left-4 sm:left-6 text-[var(--text-muted)] group-focus-within:text-[var(--brand-blue)] transition-colors">
						<SearchIcon className="h-4 sm:h-5 w-4 sm:w-5" />
					</div>
					<input
						type="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://github.com/owner/repo"
						className="h-14 sm:h-16 w-full rounded-2xl sm:rounded-full border border-[var(--border-light)] bg-[var(--bg-subtle)] pl-11 sm:pl-16 pr-4 sm:pr-36 font-mono text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none ring-[var(--brand-blue)]/0 backdrop-blur-xl focus:border-[var(--brand-blue)]/50 focus:ring-4 focus:ring-[var(--brand-blue)]/10 transition-all duration-300"
						disabled={loading}
					/>
					{/* Desktop: button overlaid inside the input (absolutely positioned) */}
					<button
						type="submit"
						disabled={loading}
						className="hidden sm:flex absolute right-2 items-center h-12 rounded-full bg-[var(--brand-blue)] px-8 text-sm font-bold text-[var(--text-primary)] shadow-lg shadow-[var(--brand-blue)]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
					>
						{buttonContent}
					</button>
				</div>
				{/* Mobile: full-width button stacked below the input */}
				<button
					type="submit"
					disabled={loading}
					className="sm:hidden h-14 w-full rounded-2xl bg-[var(--brand-blue)] text-sm font-bold text-[var(--text-primary)] shadow-lg shadow-[var(--brand-blue)]/20 transition-all active:scale-[0.98] disabled:opacity-50"
				>
					{buttonContent}
				</button>
			</div>

			{error && (
				<p className="mt-4 text-center text-sm font-medium text-[var(--color-error)] animate-in fade-in slide-in-from-top-2 duration-300">
					{error}
				</p>
			)}
		</form>
	);
}

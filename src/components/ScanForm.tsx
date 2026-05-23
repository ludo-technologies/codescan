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
		<form onSubmit={handleSubmit} className="w-full max-w-2xl">
			<div className="flex flex-col gap-3 sm:block">
				<div className="group relative flex items-center">
					<div className="pointer-events-none absolute left-4 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--brand-blue)] sm:left-5">
						<SearchIcon className="h-4 sm:h-5 w-4 sm:w-5" />
					</div>
					<input
						id="scan-url-input"
						type="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://github.com/owner/repo"
						className="h-14 w-full rounded-lg border border-[var(--border-light)] bg-white pl-11 pr-4 font-mono text-sm text-[var(--text-primary)] shadow-sm outline-none ring-[var(--brand-blue)]/0 transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--brand-blue)] focus:ring-4 focus:ring-[var(--brand-blue)]/10 sm:h-16 sm:pl-14 sm:pr-36 sm:text-base"
						disabled={loading}
					/>
					<button
						type="submit"
						disabled={loading}
						className="absolute right-2 hidden h-12 items-center rounded-md bg-[var(--brand-blue)] px-7 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--brand-blue-hover)] active:bg-[var(--brand-blue-active)] disabled:opacity-50 sm:flex"
					>
						{buttonContent}
					</button>
				</div>
				<button
					type="submit"
					disabled={loading}
					className="h-14 w-full rounded-lg bg-[var(--brand-blue)] text-sm font-bold text-white shadow-sm transition-colors active:bg-[var(--brand-blue-active)] disabled:opacity-50 sm:hidden"
				>
					{buttonContent}
				</button>
			</div>

			{error && (
				<p className="mt-3 text-sm font-medium text-[var(--color-error)] animate-in fade-in slide-in-from-top-2 duration-300">
					{error}
				</p>
			)}
		</form>
	);
}

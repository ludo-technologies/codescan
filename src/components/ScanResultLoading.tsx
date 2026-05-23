const SKELETON_ROWS = ["sast", "secrets", "dependencies"];

export default function ScanResultLoading() {
	return (
		<div className="flex w-full max-w-5xl flex-col items-center gap-5">
			<div className="w-full animate-pulse rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-5 py-6 shadow-sm sm:px-7">
				<div className="mb-6 flex justify-between">
					<div className="h-4 w-24 rounded bg-[var(--bg-subtle)]" />
					<div className="h-4 w-36 rounded bg-[var(--bg-subtle)]" />
				</div>
				<div className="mb-6 grid gap-6 sm:grid-cols-[210px_1fr] sm:items-center">
					<div className="mx-auto h-[150px] w-[150px] rounded-full bg-[var(--bg-subtle)]" />
					<div className="space-y-4">
						<div className="h-4 w-28 rounded bg-[var(--bg-subtle)]" />
						<div className="h-8 w-52 rounded bg-[var(--bg-subtle)]" />
						<div className="h-4 max-w-lg rounded bg-[var(--bg-subtle)]" />
						<div className="h-4 w-2/3 rounded bg-[var(--bg-subtle)]" />
					</div>
				</div>
				<div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-5">
					{SKELETON_ROWS.map((row) => (
						<div key={row} className="flex items-center gap-3">
							<div className="h-4 w-[140px] rounded bg-[var(--bg-subtle)]" />
							<div className="h-4 flex-1 rounded bg-[var(--bg-subtle)]" />
						</div>
					))}
				</div>
			</div>
			<div className="flex items-center gap-3 text-[var(--text-dimmed)]">
				<svg
					aria-hidden="true"
					className="h-4 w-4 animate-spin"
					viewBox="0 0 24 24"
					fill="none"
				>
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
				<span className="text-sm">Analyzing repository...</span>
			</div>
		</div>
	);
}

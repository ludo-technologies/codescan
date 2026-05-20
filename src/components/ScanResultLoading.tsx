const SKELETON_ROWS = ["sast", "secrets", "dependencies"];

export default function ScanResultLoading() {
	return (
		<div className="flex flex-col items-center gap-5">
			{/* Skeleton card */}
			<div className="w-full max-w-[420px] rounded-2xl bg-[var(--bg-card)] px-7 py-6 border border-[var(--border-subtle)] animate-pulse">
				<div className="flex justify-between mb-5">
					<div className="h-3.5 w-20 rounded bg-white/5" />
					<div className="h-3.5 w-28 rounded bg-white/5" />
				</div>
				<div className="flex justify-center mb-5">
					<div className="h-[120px] w-[120px] rounded-full bg-white/5" />
				</div>
				<div className="flex flex-col gap-[14px]">
					{SKELETON_ROWS.map((row) => (
						<div key={row} className="flex items-center gap-3">
							<div className="h-2.5 w-[110px] rounded bg-white/5" />
							<div className="flex-1 h-2.5 rounded bg-white/5" />
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

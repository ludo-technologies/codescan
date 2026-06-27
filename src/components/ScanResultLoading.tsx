import type { ScanProgressState } from "@/lib/scan-progress";
import { getPhaseStatus, SCAN_PHASES } from "@/lib/scan-progress";

const SKELETON_ROWS = ["sast", "secrets", "dependencies"];

interface ScanResultLoadingProps {
	progress: ScanProgressState;
}

export default function ScanResultLoading({
	progress,
}: ScanResultLoadingProps) {
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

			<div
				aria-busy="true"
				aria-live="polite"
				className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-5 py-5 shadow-sm sm:px-7"
			>
				<div className="mb-4 flex items-center justify-between gap-4">
					<div>
						<p className="text-sm font-semibold text-[var(--text-primary)]">
							{progress.phaseLabel}
						</p>
						<p className="mt-1 text-xs text-[var(--text-muted)]">
							{progress.remainingLabel}
						</p>
					</div>
					<p className="font-mono text-sm font-semibold tabular-nums text-[var(--brand-blue)]">
						{Math.round(progress.progressPercent)}%
					</p>
				</div>

				<div
					aria-hidden="true"
					className="mb-5 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]"
				>
					<div
						className="h-full rounded-full bg-[var(--brand-blue)] transition-[width] duration-700 ease-out"
						style={{ width: `${progress.progressPercent}%` }}
					/>
				</div>

				<ul className="space-y-2">
					{progress.phase === "queued" ? (
						<li className="flex items-center justify-between rounded-md bg-[var(--bg-subtle)] px-3 py-2.5">
							<span className="text-sm font-medium text-[var(--text-primary)]">
								Waiting for an available worker
							</span>
							<span className="scan-demo-dot" aria-hidden="true" />
						</li>
					) : (
						SCAN_PHASES.map((phase) => {
							const status = getPhaseStatus(phase.id, progress.phase);
							return (
								<li
									key={phase.id}
									className="flex items-center justify-between rounded-md px-3 py-2.5"
									style={{
										backgroundColor:
											status === "active" ? "var(--bg-subtle)" : "transparent",
									}}
								>
									<span
										className="text-sm font-medium"
										style={{
											color:
												status === "upcoming"
													? "var(--text-muted)"
													: "var(--text-primary)",
										}}
									>
										{phase.label}
									</span>
									{status === "done" ? (
										<span className="text-xs font-semibold text-[var(--brand-green)]">
											Done
										</span>
									) : status === "active" ? (
										<span className="scan-demo-dot" aria-hidden="true" />
									) : (
										<span className="text-xs text-[var(--text-muted)]">
											Waiting
										</span>
									)}
								</li>
							);
						})
					)}
				</ul>
			</div>
		</div>
	);
}

import { CATEGORY_LABELS } from "@/lib/categories";

const checkRows = [
	"Checking code",
	"Looking for exposed keys",
	"Reviewing packages",
];

const reportRows: [string, string][] = [
	[CATEGORY_LABELS.sast, "4"],
	[CATEGORY_LABELS.secrets, "0"],
	[CATEGORY_LABELS.deps, "7"],
];

export default function ScanFlowDemo() {
	return (
		<aside
			aria-label="Scan flow preview"
			className="scan-flow-demo rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-xl shadow-slate-200/70"
		>
			<div className="mb-5 flex items-center justify-between gap-4">
				<div>
					<p className="text-sm font-semibold text-[var(--text-muted)]">
						Scan preview
					</p>
					<h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
						From URL to report
					</h2>
				</div>
				<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-blue)] text-sm font-black text-white">
					B
				</div>
			</div>

			<div className="relative min-h-[292px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
				<div className="scan-demo-stage scan-demo-stage-input">
					<p className="mb-3 text-xs font-semibold uppercase text-[var(--text-muted)]">
						Step 1
					</p>
					<div className="rounded-md border border-[var(--border-light)] bg-white p-3 shadow-sm">
						<p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">
							Repository URL
						</p>
						<div className="flex items-center gap-2 font-mono text-sm text-[var(--text-primary)]">
							<span className="h-2 w-2 rounded-full bg-[var(--brand-green)]" />
							<span>github.com/example/app</span>
						</div>
					</div>
					<div className="mt-4 inline-flex rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-bold text-white">
						Start scan
					</div>
				</div>

				<div className="scan-demo-stage scan-demo-stage-running">
					<p className="mb-3 text-xs font-semibold uppercase text-[var(--text-muted)]">
						Step 2
					</p>
					<div className="space-y-3">
						{checkRows.map((row) => (
							<div
								key={row}
								className="flex items-center justify-between rounded-md bg-white px-3 py-3 shadow-sm"
							>
								<span className="text-sm font-medium text-[var(--text-primary)]">
									{row}
								</span>
								<span className="scan-demo-dot" />
							</div>
						))}
					</div>
					<div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
						<div className="scan-demo-progress h-full rounded-full bg-[var(--brand-blue)]" />
					</div>
				</div>

				<div className="scan-demo-stage scan-demo-stage-report">
					<p className="mb-3 text-xs font-semibold uppercase text-[var(--text-muted)]">
						Step 3
					</p>
					<div className="rounded-md bg-white p-4 shadow-sm">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<p className="text-sm font-semibold text-[var(--text-muted)]">
									Report ready
								</p>
								<p className="text-lg font-bold text-[var(--text-primary)]">
									Security grade
								</p>
							</div>
							<div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-2xl font-black text-[var(--brand-blue)]">
								B
							</div>
						</div>
						<div className="space-y-2 text-sm">
							{reportRows.map(([label, value]) => (
								<div key={label} className="flex justify-between gap-4">
									<span className="text-[var(--text-light)]">{label}</span>
									<span className="font-mono font-semibold text-[var(--text-primary)]">
										{value}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}

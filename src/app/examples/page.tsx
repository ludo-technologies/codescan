import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Example Security Report — codescan.dev",
	description:
		"See an example codescan.dev security report with a letter grade, scanner summary, and finding details for a public GitHub repository.",
	alternates: { canonical: "/examples" },
};

const highlights = [
	{ label: "Repository", value: "DaisukeYoda/japan-fiscal-simulator" },
	{ label: "Score", value: "73/100" },
	{ label: "Grade", value: "B (Good)" },
	{ label: "Scan duration", value: "14 seconds" },
];

const sections = [
	{
		title: "Score",
		body: "A single 0-100 score and letter grade make the report easy to share and compare at a glance.",
	},
	{
		title: "Summary",
		body: "Category counts show where the risk is concentrated across risky code, exposed keys, and outdated packages.",
	},
	{
		title: "Findings",
		body: "Detailed findings include severity, affected package or file, rule names, CVEs, and fixed versions when available.",
	},
];

async function getSampleReport() {
	return readFile(join(process.cwd(), "public", "sample_report.md"), "utf8");
}

export default async function ExamplesPage() {
	const sampleReport = (await getSampleReport()).trim();

	return (
		<main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
			<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-blue)]">
				Examples
			</p>
			<div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
				<section className="min-w-0">
					<h1 className="mb-5 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
						Example security report
					</h1>
					<p className="mb-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
						This sample shows what codescan.dev returns after scanning a public
						GitHub repository: a grade, category summaries, scanner versions,
						and finding details.
					</p>
					<div className="flex flex-wrap gap-3">
						<Link
							href="/#scan"
							className="inline-flex rounded-md bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--brand-blue-hover)]"
						>
							Start a scan
						</Link>
						<a
							href="/sample_report.md"
							className="inline-flex rounded-md border border-[var(--brand-blue)] px-5 py-2.5 text-sm font-bold text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue-light)]"
						>
							View raw Markdown
						</a>
					</div>

					<div className="mt-10 grid gap-3 sm:grid-cols-2">
						{highlights.map((item) => (
							<div
								key={item.label}
								className="rounded-lg border border-[var(--border-light)] bg-white p-4 shadow-sm"
							>
								<p className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
									{item.label}
								</p>
								<p className="text-sm font-semibold text-[var(--text-primary)]">
									{item.value}
								</p>
							</div>
						))}
					</div>

					<section className="mt-12">
						<h2 className="mb-4 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
							How to read it
						</h2>
						<div className="space-y-3">
							{sections.map((section) => (
								<article
									key={section.title}
									className="rounded-lg border border-[var(--border-light)] bg-white p-5 shadow-sm"
								>
									<h3 className="mb-2 text-base font-bold text-[var(--text-primary)]">
										{section.title}
									</h3>
									<p className="text-sm leading-relaxed text-[var(--text-secondary)]">
										{section.body}
									</p>
								</article>
							))}
						</div>
					</section>
				</section>

				<section aria-labelledby="sample-report-title" className="min-w-0">
					<h2
						id="sample-report-title"
						className="mb-4 text-2xl font-bold tracking-tight text-[var(--text-primary)]"
					>
						Sample report
					</h2>
					<pre className="max-h-[72rem] w-full max-w-full overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--border-light)] bg-[var(--bg-ink)] p-5 text-xs leading-relaxed text-slate-100 shadow-xl [overflow-wrap:anywhere] sm:text-sm">
						<code>{sampleReport}</code>
					</pre>
				</section>
			</div>
		</main>
	);
}

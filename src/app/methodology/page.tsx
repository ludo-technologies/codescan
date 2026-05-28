import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Methodology — codescan.dev",
	description:
		"What codescan.dev checks, what it does not check, and how to interpret security grades for GitHub repository scans.",
	alternates: { canonical: "/methodology" },
};

const checks = [
	{
		title: "Risky code patterns",
		tool: "Semgrep",
		body: "Static rules look for code patterns that commonly lead to security bugs, such as unsafe templating, input handling mistakes, and other framework-specific issues.",
	},
	{
		title: "Exposed keys",
		tool: "Gitleaks",
		body: "Secret detection looks for committed credentials, API keys, tokens, private keys, and related high-risk strings in the repository.",
	},
	{
		title: "Outdated packages",
		tool: "Trivy",
		body: "Dependency analysis checks detected packages against known vulnerability data and reports affected package versions, CVEs, severity, and fixed versions when available.",
	},
];

const outOfScope = [
	{
		title: "Runtime testing",
		body: "Scans do not start the application, crawl a deployed service, log in as users, or test live endpoints.",
	},
	{
		title: "Architecture and business logic",
		body: "Automated checks cannot fully judge authorization design, tenant isolation, payment logic, threat models, or reviewer intent.",
	},
	{
		title: "Compliance certification",
		body: "Reports are designed to support review and prioritization. They are not compliance attestations or formal security certifications.",
	},
];

const reportFields = [
	"Letter grade and total score",
	"Category summaries for risky code, exposed keys, and outdated packages",
	"Scanner versions when reported by the backend",
	"Finding severity, rule names, CVEs, file paths, line numbers, and fixed versions when available",
	"Shareable result URL and downloadable Markdown report",
];

const guidance = [
	"Start with critical and high-severity findings.",
	"Rotate any confirmed exposed secret before treating the scan as resolved.",
	"Update vulnerable dependencies before lower-priority cleanup.",
	"Use the grade as a quick signal, then inspect the detailed findings.",
];

export default function MethodologyPage() {
	return (
		<main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
			<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-blue)]">
				Methodology
			</p>
			<section className="max-w-3xl">
				<h1 className="mb-5 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
					What codescan.dev checks
				</h1>
				<p className="text-lg leading-relaxed text-[var(--text-secondary)]">
					codescan.dev runs automated checks against GitHub repositories —
					public, or private when you sign in with GitHub — and turns the
					findings into a shareable security report card. The goal is to give
					maintainers and reviewers a quick baseline before deeper review.
				</p>
			</section>

			<section className="mt-14" aria-labelledby="checks-title">
				<h2
					id="checks-title"
					className="mb-6 text-2xl font-bold tracking-tight text-[var(--text-primary)]"
				>
					Checks included
				</h2>
				<div className="grid gap-4 md:grid-cols-3">
					{checks.map((check) => (
						<article
							key={check.title}
							className="rounded-lg border border-[var(--border-light)] bg-white p-5 shadow-sm"
						>
							<p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-blue)]">
								{check.tool}
							</p>
							<h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
								{check.title}
							</h3>
							<p className="text-sm leading-relaxed text-[var(--text-secondary)]">
								{check.body}
							</p>
						</article>
					))}
				</div>
			</section>

			<section
				className="mt-16 grid gap-10 lg:grid-cols-[1fr_0.9fr]"
				aria-labelledby="report-title"
			>
				<div>
					<h2
						id="report-title"
						className="mb-4 text-2xl font-bold tracking-tight text-[var(--text-primary)]"
					>
						What appears in a report
					</h2>
					<p className="mb-5 leading-relaxed text-[var(--text-secondary)]">
						Each completed scan is summarized into a result page and a Markdown
						report. Fields depend on what the scanners detect and what metadata
						is available for the repository.
					</p>
					<ul className="space-y-3">
						{reportFields.map((field) => (
							<li
								key={field}
								className="rounded-lg border border-[var(--border-light)] bg-white px-4 py-3 text-sm font-medium text-[var(--text-secondary)] shadow-sm"
							>
								{field}
							</li>
						))}
					</ul>
				</div>
				<div className="rounded-lg border border-[var(--border-light)] bg-[var(--brand-blue-light)] p-6">
					<h3 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						How to interpret the grade
					</h3>
					<p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
						The grade is a fast summary of the number and severity of findings.
						It is useful for triage, but the detailed findings are the part that
						should drive fixes.
					</p>
					<ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
						{guidance.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</div>
			</section>

			<section className="mt-16" aria-labelledby="limits-title">
				<h2
					id="limits-title"
					className="mb-6 text-2xl font-bold tracking-tight text-[var(--text-primary)]"
				>
					What it does not check
				</h2>
				<div className="grid gap-4 md:grid-cols-2">
					{outOfScope.map((item) => (
						<article
							key={item.title}
							className="rounded-lg border border-[var(--border-light)] bg-white p-5 shadow-sm"
						>
							<h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
								{item.title}
							</h3>
							<p className="text-sm leading-relaxed text-[var(--text-secondary)]">
								{item.body}
							</p>
						</article>
					))}
				</div>
			</section>

			<section className="mt-16 rounded-lg border border-[var(--border-light)] bg-white p-6 shadow-sm">
				<h2 className="mb-3 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
					See the output
				</h2>
				<p className="mb-5 max-w-2xl text-[var(--text-secondary)]">
					The example report shows the score, scanner output, and Markdown
					format that codescan.dev produces after a completed scan.
				</p>
				<div className="flex flex-wrap gap-3">
					<Link
						href="/examples"
						className="inline-flex rounded-md bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--brand-blue-hover)]"
					>
						View example report
					</Link>
					<Link
						href="/#scan"
						className="inline-flex rounded-md border border-[var(--brand-blue)] px-5 py-2.5 text-sm font-bold text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue-light)]"
					>
						Start a scan
					</Link>
				</div>
			</section>
		</main>
	);
}

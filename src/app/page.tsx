import type { Metadata } from "next";
import Link from "next/link";
import ScanFlowDemo from "@/components/ScanFlowDemo";
import ScanForm from "@/components/ScanForm";
import { CATEGORY_LABELS } from "@/lib/categories";

export const metadata: Metadata = {
	alternates: {
		canonical: "/",
	},
};

const scanners = [
	{
		title: CATEGORY_LABELS.sast,
		body: "Finds patterns that can lead to security bugs, including unsafe input handling and other common mistakes.",
	},
	{
		title: CATEGORY_LABELS.secrets,
		body: "Checks whether API keys, tokens, private keys, or credentials were accidentally committed.",
	},
	{
		title: CATEGORY_LABELS.deps,
		body: "Looks for packages with known security problems so you can update the risky ones first.",
	},
];

const proofPoints = [
	...scanners.map((s) => s.title),
	"Public scans no sign-up",
];

const steps = [
	{
		title: "Paste a GitHub URL",
		body: "Drop the URL of any public repository into the scan box at the top of the page, or sign in with GitHub to scan a private repo.",
	},
	{
		title: "Run the checks",
		body: "codescan.dev looks for risky code, exposed keys, and packages that should be updated.",
	},
	{
		title: "Read the report card",
		body: "See a letter grade, a severity breakdown, and per-finding file, line, and rule details you can share.",
	},
];

const exampleCounts: [string, string][] = [
	[CATEGORY_LABELS.sast, "4"],
	[CATEGORY_LABELS.secrets, "0"],
	[CATEGORY_LABELS.deps, "7"],
];

const audience = [
	{
		title: "Maintainers of open source repos",
		body: "Get a quick security baseline before publishing a release or accepting a large pull request.",
	},
	{
		title: "Developers evaluating dependencies",
		body: "Check a third-party repository for exposed credentials and risky packages before adopting it.",
	},
	{
		title: "Engineering teams and reviewers",
		body: "Share a letter-grade report card alongside a PR or audit instead of pasting raw tool output.",
	},
];

const faqs = [
	{
		q: "Is codescan.dev free?",
		a: "Yes. Public repository scans are free and require no sign-up. Sign in with GitHub to scan private repositories — also free.",
	},
	{
		q: "Which repositories can I scan?",
		a: "Any public GitHub repository. Sign in with GitHub to scan private repositories too.",
	},
	{
		q: "What does the letter grade mean?",
		a: "The grade summarizes how many issues were found and how serious they are, so you can compare repositories at a glance.",
	},
	{
		q: "What does codescan.dev look for?",
		a: "It checks for risky code patterns, exposed keys, and packages with known security problems. Each finding links back to the affected file and line.",
	},
	{
		q: "Do you store my code?",
		a: "No. codescan.dev clones the repository to run the scanners and only persists the resulting findings needed to render the report card.",
	},
];

const FAQ_JSON_LD = JSON.stringify({
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: faqs.map(({ q, a }) => ({
		"@type": "Question",
		name: q,
		acceptedAnswer: { "@type": "Answer", text: a },
	})),
});

const SOFTWARE_JSON_LD = JSON.stringify({
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "codescan.dev",
	applicationCategory: "SecurityApplication",
	operatingSystem: "Web",
	description:
		"Security scanner for GitHub repositories, public or private. Checks for risky code, exposed keys, and outdated packages, then presents the findings as a shareable letter-grade report.",
	offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
});

export default function Home() {
	return (
		<main className="relative flex min-h-screen flex-col items-center overflow-hidden">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
				dangerouslySetInnerHTML={{ __html: SOFTWARE_JSON_LD }}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
				dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }}
			/>

			<section
				id="top"
				className="relative z-10 grid w-full max-w-6xl gap-8 px-4 pt-8 pb-6 sm:gap-10 sm:px-6 sm:pt-20 sm:pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20"
			>
				<div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
					<p className="mb-3 hidden rounded-md border border-[var(--brand-blue-light)] bg-[var(--brand-blue-light)] px-3 py-1 text-xs font-semibold uppercase text-[var(--brand-blue)] sm:mb-5 sm:inline-flex">
						GitHub security scanner
					</p>
					<h1 className="mb-4 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:mb-6 sm:text-7xl lg:text-8xl">
						<span>codescan</span>
						<span className="text-[var(--brand-blue)]">.dev</span>
					</h1>
					<p className="mb-5 max-w-2xl text-lg font-semibold leading-relaxed text-[var(--text-primary)] sm:mb-6 sm:text-2xl">
						Scan any GitHub repo for security issues — get one shareable grade.
					</p>

					<ul className="hidden max-w-2xl flex-wrap gap-2 text-sm text-[var(--text-secondary)] sm:flex">
						{proofPoints.map((point) => (
							<li
								key={point}
								className="rounded-md border border-[var(--border-subtle)] bg-white px-3 py-1.5 font-medium"
							>
								{point}
							</li>
						))}
					</ul>
				</div>

				<div className="hidden lg:block">
					<ScanFlowDemo />
				</div>
			</section>

			<section
				aria-labelledby="scan-section-title"
				className="relative z-10 w-full border-y-2 border-[var(--brand-blue)] bg-[var(--brand-blue-light)]/60"
				id="scan"
			>
				<div className="mx-auto w-full max-w-3xl px-4 py-8 text-center sm:px-6 sm:py-16">
					<p className="mb-3 hidden text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-blue)] sm:block">
						Start a scan
					</p>
					<h2
						id="scan-section-title"
						className="mb-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
					>
						Paste a GitHub repo URL
					</h2>
					<p className="mx-auto mb-6 max-w-xl text-sm text-[var(--text-secondary)] sm:mb-8 sm:text-base">
						Public scans need no sign-up. Sign in with GitHub for private repos.
					</p>
					<div className="mx-auto w-full max-w-2xl text-left animate-in fade-in zoom-in-95 fill-mode-both duration-1000 delay-300 ease-out">
						<ScanForm />
					</div>
				</div>
			</section>

			<div className="relative z-10 w-full max-w-6xl px-4 pb-20 sm:px-6">
				<section
					aria-labelledby="what-it-does-title"
					className="scroll-mt-24 border-t border-[var(--border-subtle)] pt-16"
					id="what-it-does"
				>
					<h2
						id="what-it-does-title"
						className="mb-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
					>
						What codescan.dev checks
					</h2>
					<p className="mb-10 max-w-3xl text-[var(--text-secondary)]">
						Every scan checks for common security risks and rolls the findings
						into a single report.
					</p>
					<div className="grid gap-4 sm:grid-cols-3">
						{scanners.map((s) => (
							<article
								key={s.title}
								className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm"
							>
								<h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
									{s.title}
								</h3>
								<p className="text-sm leading-relaxed text-[var(--text-light)]">
									{s.body}
								</p>
							</article>
						))}
					</div>
				</section>

				<section
					aria-labelledby="who-its-for-title"
					className="mt-20 scroll-mt-24"
					id="who-its-for"
				>
					<h2
						id="who-its-for-title"
						className="mb-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
					>
						Who it's for
					</h2>
					<p className="mb-10 max-w-3xl text-[var(--text-secondary)]">
						codescan.dev is built for anyone who needs a quick, shareable
						security read on a GitHub repository.
					</p>
					<ul className="grid gap-4 sm:grid-cols-3">
						{audience.map((a) => (
							<li
								key={a.title}
								className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm"
							>
								<h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
									{a.title}
								</h3>
								<p className="text-sm leading-relaxed text-[var(--text-light)]">
									{a.body}
								</p>
							</li>
						))}
					</ul>
				</section>

				<section
					aria-labelledby="how-it-works-title"
					className="mt-20 scroll-mt-24"
					id="how-it-works"
				>
					<h2
						id="how-it-works-title"
						className="mb-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
					>
						How it works
					</h2>
					<p className="mb-10 max-w-3xl text-[var(--text-secondary)]">
						No installation or GitHub app. Public scans need no sign-up.
					</p>
					<ol className="grid gap-4 sm:grid-cols-3">
						{steps.map((s, i) => (
							<li
								key={s.title}
								className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm"
							>
								<div className="mb-2 text-xs font-mono font-semibold uppercase tracking-wider text-[var(--brand-blue)]">
									Step {i + 1}
								</div>
								<h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
									{s.title}
								</h3>
								<p className="text-sm leading-relaxed text-[var(--text-light)]">
									{s.body}
								</p>
							</li>
						))}
					</ol>
				</section>

				<section
					aria-labelledby="result-example-title"
					className="mt-20 scroll-mt-24"
					id="result-example"
				>
					<h2
						id="result-example-title"
						className="mb-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
					>
						What a result looks like
					</h2>
					<p className="mb-10 max-w-3xl text-[var(--text-secondary)]">
						Each scan produces a single page with a letter grade, severity
						breakdown, and a list of findings linked back to the source.
					</p>
					<div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-6 shadow-sm">
						<div className="flex flex-wrap items-center gap-6">
							<div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[var(--brand-blue)] text-4xl font-black text-[var(--brand-blue)]">
								B
							</div>
							<div className="flex-1 space-y-2 text-sm text-[var(--text-light)]">
								{exampleCounts.map(([label, value]) => (
									<div key={label} className="flex justify-between gap-4">
										<span>{label}</span>
										<span className="font-mono">{value}</span>
									</div>
								))}
								<div className="flex justify-between gap-4 border-t border-[var(--border-subtle)] pt-2 text-xs text-[var(--text-muted)]">
									<span>Example output — your scan may differ.</span>
								</div>
							</div>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-3">
						<Link
							href="/examples"
							className="inline-flex rounded-md border border-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue-light)]"
						>
							View example report
						</Link>
						<Link
							href="/methodology"
							className="inline-flex rounded-md border border-[var(--border-light)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
						>
							Read methodology
						</Link>
					</div>
				</section>

				<section
					aria-labelledby="faq-title"
					className="mt-20 scroll-mt-24"
					id="faq"
				>
					<h2
						id="faq-title"
						className="mb-10 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
					>
						Frequently asked questions
					</h2>
					<div className="space-y-3">
						{faqs.map(({ q, a }) => (
							<details
								key={q}
								className="group rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm open:bg-[var(--bg-subtle-hover)]"
							>
								<summary className="cursor-pointer list-none text-base font-semibold text-[var(--text-primary)]">
									<span className="mr-2 text-[var(--brand-blue)]">Q.</span>
									{q}
								</summary>
								<p className="mt-3 text-sm leading-relaxed text-[var(--text-light)]">
									{a}
								</p>
							</details>
						))}
					</div>
				</section>

				<section className="mt-24 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-8 text-center shadow-sm">
					<h2 className="mb-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
						Ready to scan a repository?
					</h2>
					<p className="mx-auto mb-6 max-w-xl text-[var(--text-secondary)]">
						Paste a GitHub URL into the scan box to get a shareable grade.
					</p>
					<Link
						href="#scan"
						className="inline-flex items-center gap-2 rounded-md border border-[var(--brand-blue)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue)] hover:text-white"
					>
						Start a scan
					</Link>
				</section>
			</div>
		</main>
	);
}

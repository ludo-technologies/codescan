import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms of Service — codescan.dev",
	description:
		"Terms of service for using codescan.dev to scan public GitHub repositories.",
	alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "2026-05-23";

export default function TermsPage() {
	return (
		<main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
			<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-blue)]">
				Legal
			</p>
			<h1 className="mb-3 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
				Terms of Service
			</h1>
			<p className="mb-12 text-sm text-[var(--text-muted)]">
				Last updated: {LAST_UPDATED}
			</p>

			<div className="space-y-10 text-[var(--text-secondary)] leading-relaxed">
				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						Placeholder
					</h2>
					<p>
						This page is a placeholder. The final terms will cover acceptable
						use, the scope of what codescan.dev provides, disclaimers, and
						limitations of liability.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						Acceptable use
					</h2>
					<p>
						You may only submit URLs of public GitHub repositories that you have
						the right to scan. Do not use codescan.dev to attack, overload, or
						probe systems you do not own or have permission to test.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						No warranty
					</h2>
					<p>
						codescan.dev is provided "as is". Scan results are best-effort
						summaries from automated tools and are not a substitute for a full
						security audit. We make no guarantee that all issues will be found
						or that reported findings are exploitable.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						Contact
					</h2>
					<p>
						Questions about these terms can be sent to{" "}
						<a
							href="mailto:contact@ludo-tech.org"
							className="font-medium text-[var(--brand-blue)] hover:underline"
						>
							contact@ludo-tech.org
						</a>
						.
					</p>
				</section>
			</div>
		</main>
	);
}

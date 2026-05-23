import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy — codescan.dev",
	description:
		"How codescan.dev handles the public repositories it scans and the limited information it stores.",
	alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "2026-05-23";

export default function PrivacyPage() {
	return (
		<main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
			<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-blue)]">
				Legal
			</p>
			<h1 className="mb-3 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
				Privacy Policy
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
						This page is a placeholder. The final policy will describe what data
						codescan.dev collects, how it is used, and how to contact us with
						questions.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						What we scan
					</h2>
					<p>
						codescan.dev clones the public GitHub repository you submit, runs
						security scanners against it, and stores only the findings needed to
						render the resulting report card. We do not retain the cloned source
						code after the scan completes.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						Contact
					</h2>
					<p>
						Questions about this policy can be sent to{" "}
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

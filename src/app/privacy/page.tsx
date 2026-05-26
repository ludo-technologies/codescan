import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Privacy Policy — codescan.dev",
	description:
		"How codescan.dev handles the public repositories it scans, the scan results it stores, and the limited information it collects from visitors.",
	alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "2026-05-23";
const CONTACT_EMAIL = "contact@ludo-tech.org";

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
						1. Overview
					</h2>
					<p>
						codescan.dev (&quot;the Service&quot;) is a free security scanner
						for public GitHub repositories operated by Ludo Technologies Inc.
						(&quot;we&quot;, &quot;us&quot;), a company headquartered in
						Kanagawa, Japan. This policy explains what information we handle
						when you use the Service, why we handle it, and the choices you
						have.
					</p>
					<p className="mt-3">
						The Service does not require an account. You interact with it by
						submitting the URL of a public GitHub repository and viewing the
						resulting report.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						2. Information we process
					</h2>
					<p className="mb-4">We process the following categories of data:</p>
					<ul className="list-disc space-y-3 pl-5">
						<li>
							<strong className="text-[var(--text-primary)]">
								Repository URLs you submit.
							</strong>{" "}
							When you start a scan, we record the public GitHub URL, normalize
							the owner and repository name, and use it to fetch the repository.
						</li>
						<li>
							<strong className="text-[var(--text-primary)]">
								Cloned repository contents (transient).
							</strong>{" "}
							We temporarily clone the public repository so that scanners can
							inspect it. Source files are deleted from our infrastructure after
							the scan completes; we do not retain a long-term copy of the code.
						</li>
						<li>
							<strong className="text-[var(--text-primary)]">
								Scan findings and metadata.
							</strong>{" "}
							We persist the structured results of each scan — for example rule
							identifiers, severity, file paths, line numbers, dependency names
							and versions, and short code snippets reproduced from the public
							repository. These results are what we render on the report page.
						</li>
						<li>
							<strong className="text-[var(--text-primary)]">
								Technical request data.
							</strong>{" "}
							Like most web services, our servers log information about
							requests, including IP address, user agent, requested URL,
							referrer, and timestamp. This data is used to operate the Service,
							prevent abuse, and diagnose problems.
						</li>
						<li>
							<strong className="text-[var(--text-primary)]">
								Analytics data.
							</strong>{" "}
							We use Google Analytics to understand aggregate usage patterns.
							See &quot;Cookies and analytics&quot; below.
						</li>
						<li>
							<strong className="text-[var(--text-primary)]">
								Correspondence.
							</strong>{" "}
							If you email us, we retain the message and your email address to
							respond and keep records of the conversation.
						</li>
					</ul>
					<p className="mt-4">
						We do not knowingly request or store sensitive personal data, and we
						do not ask you for your name, address, or payment information.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						3. How we use this information
					</h2>
					<ul className="list-disc space-y-2 pl-5">
						<li>To run the scan you requested and display the report.</li>
						<li>
							To produce a shareable scan page that can be revisited via its
							URL.
						</li>
						<li>
							To operate, maintain, secure, and improve the Service, including
							investigating errors and detecting abuse.
						</li>
						<li>
							To understand how the Service is used in aggregate, so we can
							prioritize improvements.
						</li>
						<li>To respond to questions or feedback you send us.</li>
						<li>
							To comply with applicable law and respond to lawful requests.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						4. Scan reports are accessible by URL
					</h2>
					<p>
						When a scan completes, we generate a unique scan ID and host the
						report at a URL of the form{" "}
						<code className="font-mono text-sm">/scan/&lt;id&gt;</code>. Anyone
						who knows or guesses that URL can view the report. The URLs use
						unguessable identifiers and are marked{" "}
						<code className="font-mono text-sm">noindex</code> so that search
						engines do not list them, but the reports themselves are not
						password-protected.
					</p>
					<p className="mt-3">
						Because the scanned repositories are public on GitHub, the findings
						describe code that is already publicly available. If you would like
						a specific scan report removed, please contact us using the address
						below.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						5. Cookies and analytics
					</h2>
					<p>
						We use Google Analytics, a service provided by Google LLC, to
						collect aggregate information about how visitors use the Service.
						Google Analytics sets cookies and may process information such as
						your IP address, device, browser, and pages visited. The data is
						used to produce aggregate reports — we do not use it to identify
						individual visitors.
					</p>
					<p className="mt-3">
						You can opt out of Google Analytics by installing the official{" "}
						<a
							href="https://tools.google.com/dlpage/gaoptout"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-[var(--brand-blue)] hover:underline"
						>
							Google Analytics Opt-out Browser Add-on
						</a>{" "}
						or by configuring your browser to block analytics cookies. We do not
						use cookies for advertising.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						6. Third-party services
					</h2>
					<p className="mb-3">
						We rely on third parties to operate the Service. They process data
						on our behalf or as independent controllers as described below:
					</p>
					<ul className="list-disc space-y-2 pl-5">
						<li>
							<strong className="text-[var(--text-primary)]">GitHub</strong> —
							source of the public repositories we clone for scanning.
						</li>
						<li>
							<strong className="text-[var(--text-primary)]">
								Cloud hosting and infrastructure providers
							</strong>{" "}
							— host the application, database, and scan workers.
						</li>
						<li>
							<strong className="text-[var(--text-primary)]">
								Google Analytics
							</strong>{" "}
							— aggregate usage analytics, as described above.
						</li>
					</ul>
					<p className="mt-3">
						These providers may store data outside Japan, including in the
						United States. They are bound by their own terms and privacy
						policies.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						7. Retention
					</h2>
					<ul className="list-disc space-y-2 pl-5">
						<li>
							Cloned source code is deleted from scan workers after the scan
							finishes.
						</li>
						<li>
							Scan findings and the associated report page are retained so the
							shareable URL keeps working. We may delete reports that have not
							been viewed for a long period, are abusive, or are subject to a
							removal request.
						</li>
						<li>
							Server and access logs are retained for a limited period — long
							enough to investigate incidents and abuse — and then rotated out.
						</li>
						<li>
							Analytics data is retained according to the default settings of
							the analytics provider.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						8. Security
					</h2>
					<p>
						We apply reasonable technical and organizational measures to protect
						the data we hold, including encryption in transit (HTTPS), access
						controls on our infrastructure, and isolation between scan
						workloads. No service connected to the internet can be made
						perfectly secure, and we cannot guarantee absolute security.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						9. Your rights
					</h2>
					<p>
						Depending on where you live, you may have rights under applicable
						privacy laws, including Japan&apos;s Act on the Protection of
						Personal Information (APPI), the EU/UK GDPR, or similar laws. These
						may include the right to access, correct, or delete personal data we
						hold about you, or to object to certain processing.
					</p>
					<p className="mt-3">
						Because we do not require an account, the personal data we hold
						about visitors is typically limited to server logs and analytics
						data tied to a browser. To exercise any of these rights, contact us
						using the address below. We may need to ask for additional
						information to locate the relevant records.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						10. Children
					</h2>
					<p>
						The Service is intended for developers and is not directed at
						children under the age of 13 (or the equivalent minimum age in your
						jurisdiction). We do not knowingly collect personal data from
						children.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						11. Changes to this policy
					</h2>
					<p>
						We may update this policy as the Service evolves or as the law
						requires. When we make material changes we will update the
						&quot;Last updated&quot; date at the top of this page. Continued use
						of the Service after a change indicates acceptance of the revised
						policy.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						12. Contact
					</h2>
					<p>
						Questions, removal requests, and privacy-related inquiries can be
						sent to{" "}
						<a
							href={`mailto:${CONTACT_EMAIL}`}
							className="font-medium text-[var(--brand-blue)] hover:underline"
						>
							{CONTACT_EMAIL}
						</a>
						.
					</p>
					<p className="mt-3">
						See also our{" "}
						<Link
							href="/terms"
							className="font-medium text-[var(--brand-blue)] hover:underline"
						>
							Terms of Service
						</Link>
						.
					</p>
				</section>
			</div>
		</main>
	);
}

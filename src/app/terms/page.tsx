import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Terms of Service — codescan.dev",
	description:
		"Terms of service for using codescan.dev to run security scans against public GitHub repositories.",
	alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "2026-05-23";
const CONTACT_EMAIL = "contact@ludo-tech.org";

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
						1. Acceptance of these terms
					</h2>
					<p>
						These Terms of Service (&quot;Terms&quot;) govern your use of
						codescan.dev (&quot;the Service&quot;), operated by Ludo
						Technologies Inc. (&quot;we&quot;, &quot;us&quot;). By accessing the
						Service or submitting a repository for scanning, you agree to these
						Terms. If you do not agree, do not use the Service.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						2. What the Service does
					</h2>
					<p>
						The Service accepts the URL of a public GitHub repository, runs a
						set of automated security checks (such as static analysis, secret
						detection, and dependency vulnerability lookup), and presents the
						findings as a report identified by a unique URL. The Service is
						currently provided free of charge and does not require an account.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						3. Eligibility
					</h2>
					<p>
						You must be at least the age of majority in your jurisdiction (or
						have permission from a parent or guardian) and legally able to enter
						into these Terms to use the Service. If you are using the Service on
						behalf of an organization, you represent that you have authority to
						bind that organization to these Terms.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						4. Acceptable use
					</h2>
					<p className="mb-3">You agree that you will not:</p>
					<ul className="list-disc space-y-2 pl-5">
						<li>
							Submit URLs that are not public GitHub repositories, or
							repositories that you do not have the right to submit for
							scanning;
						</li>
						<li>
							Use the Service to attack, overload, probe, or test systems for
							which you do not have explicit permission;
						</li>
						<li>
							Submit volumes of scan requests that are abusive or that interfere
							with the Service&apos;s availability for other users, including
							via automated scripts that bypass on-page rate limiting;
						</li>
						<li>
							Attempt to reverse-engineer, exploit, or otherwise compromise the
							Service or its infrastructure, except through good-faith security
							research disclosed to us privately;
						</li>
						<li>
							Use the Service to violate any applicable law or third-party
							right, including intellectual property, privacy, or anti-spam
							laws.
						</li>
					</ul>
					<p className="mt-3">
						We may rate-limit, suspend, or block requests that we reasonably
						believe violate these rules.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						5. Scan reports
					</h2>
					<p>
						When a scan completes, we generate a report page at a unique URL (
						<code className="font-mono text-sm">/scan/&lt;id&gt;</code>) so it
						can be revisited and shared. Anyone with the URL can view the
						report. We mark scan pages as <em>noindex</em> to keep them out of
						search engines, but they are not otherwise access-controlled. By
						submitting a repository you acknowledge that the resulting report
						may be viewed by anyone you share the URL with.
					</p>
					<p className="mt-3">
						If you would like a particular scan report removed, contact us using
						the address below. See the{" "}
						<Link
							href="/privacy"
							className="font-medium text-[var(--brand-blue)] hover:underline"
						>
							Privacy Policy
						</Link>{" "}
						for details on how scan data is handled.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						6. Intellectual property
					</h2>
					<p>
						The repositories you submit remain owned by their original authors
						under their existing licenses. We do not claim ownership of that
						code. Scan findings reproduce small portions of public source code
						for the purpose of pointing at the issue; this reproduction is
						intended to be a fair, descriptive use of publicly available
						material.
					</p>
					<p className="mt-3">
						The Service itself — including the site, branding, design, and the
						text of reports outside the reproduced code — is owned by Ludo
						Technologies Inc. and protected by applicable laws. You may share
						scan report URLs and link to the Service freely. Other uses require
						our prior permission.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						7. Third-party content and services
					</h2>
					<p>
						The Service depends on third parties — including GitHub, open source
						security scanners, vulnerability databases, and cloud infrastructure
						providers. Their availability, accuracy, and licensing terms are
						outside our control. We are not responsible for the content of any
						repository scanned through the Service.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						8. No warranty
					</h2>
					<p>
						The Service is provided <strong>&quot;as is&quot;</strong> and{" "}
						<strong>&quot;as available&quot;</strong>, without warranties of any
						kind, whether express, implied, or statutory, including warranties
						of merchantability, fitness for a particular purpose,
						non-infringement, accuracy, or uninterrupted availability.
					</p>
					<p className="mt-3">
						Scan results are best-effort summaries produced by automated tools.
						They may include false positives, miss real issues, or become
						outdated as new vulnerabilities are disclosed. Scan reports are{" "}
						<strong>not</strong> a substitute for a professional security audit.
						You are responsible for independently evaluating the safety of any
						code before relying on it.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						9. Limitation of liability
					</h2>
					<p>
						To the maximum extent permitted by applicable law, Ludo Technologies
						Inc. and its officers, employees, and contractors will not be liable
						for any indirect, incidental, special, consequential, or punitive
						damages, or for any loss of profits, revenue, data, or goodwill,
						arising out of or in connection with your use of the Service.
					</p>
					<p className="mt-3">
						To the extent we are found liable despite the above, our total
						aggregate liability for any claim related to the Service is limited
						to JPY 1,000. Some jurisdictions do not allow certain limitations of
						liability, in which case the limitations apply only to the extent
						permitted by law.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						10. Indemnification
					</h2>
					<p>
						You agree to defend, indemnify, and hold us harmless from any
						claims, damages, or expenses (including reasonable legal fees)
						arising out of your misuse of the Service, your violation of these
						Terms, or your violation of any law or third-party right.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						11. Suspension and termination
					</h2>
					<p>
						We may suspend, throttle, or terminate access to the Service for any
						user at any time, with or without notice, if we reasonably believe
						these Terms have been violated or if continued use would harm the
						Service or other users. We may also discontinue the Service, in
						whole or in part, at any time.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						12. Changes to the Service or these Terms
					</h2>
					<p>
						We may update the Service&apos;s features, scanners, and report
						format over time. We may also update these Terms when the Service
						evolves or as the law requires; when we make material changes we
						will update the &quot;Last updated&quot; date above. Continued use
						of the Service after a change indicates acceptance of the revised
						Terms.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						13. Governing law and venue
					</h2>
					<p>
						These Terms are governed by the laws of Japan, without regard to its
						conflict-of-laws rules. Any dispute arising out of or relating to
						these Terms or the Service will be submitted to the exclusive
						jurisdiction of the Yokohama District Court, Japan, as the court of
						first instance, except where applicable consumer protection law
						gives you a different non-waivable right.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						14. Miscellaneous
					</h2>
					<p>
						If any provision of these Terms is held to be unenforceable, the
						remaining provisions will remain in full force and effect. Our
						failure to enforce a provision is not a waiver of our right to do so
						later. You may not assign these Terms without our consent. We may
						assign these Terms in connection with a reorganization or sale of
						our business.
					</p>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-bold text-[var(--text-primary)]">
						15. Contact
					</h2>
					<p>
						Questions about these Terms can be sent to{" "}
						<a
							href={`mailto:${CONTACT_EMAIL}`}
							className="font-medium text-[var(--brand-blue)] hover:underline"
						>
							{CONTACT_EMAIL}
						</a>
						.
					</p>
				</section>
			</div>
		</main>
	);
}

import Link from "next/link";

const productLinks = [
	{ label: "Start a scan", href: "/#scan" },
	{ label: "What it checks", href: "/#what-it-does" },
	{ label: "How it works", href: "/#how-it-works" },
	{ label: "FAQ", href: "/#faq" },
];

const resourceLinks = [
	{
		label: "GitHub",
		href: "https://github.com/ludo-technologies/codescan",
		external: true,
	},
	{
		label: "Ludo Technologies",
		href: "https://ludo-tech.org",
		external: true,
	},
];

const legalLinks = [
	{ label: "Privacy Policy", href: "/privacy" },
	{ label: "Terms of Service", href: "/terms" },
];

export default function Footer() {
	return (
		<footer className="border-t border-[var(--border-subtle)] bg-white">
			<div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
				<div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
					<Link href="/" className="inline-flex items-baseline">
						<span className="text-xl font-black tracking-tight text-[var(--text-primary)]">
							codescan
						</span>
						<span className="text-xl font-black tracking-tight text-[var(--brand-blue)]">
							.dev
						</span>
					</Link>
					<span className="hidden text-[var(--border-light)] sm:block">|</span>
					<p className="text-sm text-[var(--text-secondary)]">
						Security checks for public GitHub repos.
					</p>
				</div>

				<div className="mb-10 grid grid-cols-2 gap-8 text-sm md:grid-cols-4">
					<div>
						<h4 className="mb-4 font-semibold text-[var(--text-primary)]">
							Product
						</h4>
						<ul className="space-y-2">
							{productLinks.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-blue)]"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="mb-4 font-semibold text-[var(--text-primary)]">
							Resources
						</h4>
						<ul className="space-y-2">
							{resourceLinks.map((link) => (
								<li key={link.href}>
									<a
										href={link.href}
										target={link.external ? "_blank" : undefined}
										rel={link.external ? "noopener noreferrer" : undefined}
										className="text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-blue)]"
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="mb-4 font-semibold text-[var(--text-primary)]">
							Contact
						</h4>
						<ul className="space-y-2 text-[var(--text-secondary)]">
							<li>Kanagawa, Japan</li>
							<li>
								<a
									href="mailto:contact@ludo-tech.org"
									className="transition-colors hover:text-[var(--brand-blue)]"
								>
									contact@ludo-tech.org
								</a>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="mb-4 font-semibold text-[var(--text-primary)]">
							Legal
						</h4>
						<ul className="space-y-2">
							{legalLinks.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-blue)]"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="flex flex-col items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row">
					<p>© {new Date().getFullYear()} Ludo Technologies Inc.</p>
					<p>All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}

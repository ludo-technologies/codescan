import type { Metadata } from "next";
import Link from "next/link";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScanResultView from "@/components/ScanResult";
import { getGrade } from "@/lib/score-utils";

interface PageProps {
	params: Promise<{ id: string }>;
}

function getSiteUrl() {
	return (
		process.env.SITE_URL ??
		process.env.NEXT_PUBLIC_SITE_URL ??
		(process.env.VERCEL_PROJECT_PRODUCTION_URL
			? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
			: undefined) ??
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
	).replace(/\/$/, "");
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;
	const apiUrl = process.env.API_URL ?? "";

	try {
		const res = await fetch(`${apiUrl}/api/scan/${id}`, { cache: "no-store" });
		if (res.ok) {
			const data = await res.json();
			if (data.status === "completed") {
				const grade = getGrade(data.total_score ?? 0);
				const title = `${data.owner}/${data.repo} — Security Grade ${grade} | codescan.dev`;
				const description = `${data.owner}/${data.repo} earned grade ${grade} on codescan.dev`;
				const siteUrl = getSiteUrl();
				const scanUrl = `${siteUrl}/scan/${id}`;
				const ogImage = `${scanUrl}/og`;
				return {
					title,
					description,
					metadataBase: siteUrl ? new URL(siteUrl) : undefined,
					openGraph: {
						title,
						description,
						url: scanUrl,
						siteName: "codescan.dev",
						type: "website",
						images: [
							{
								url: ogImage,
								width: 1200,
								height: 630,
								alt: `${data.owner}/${data.repo} security grade card`,
							},
						],
					},
					twitter: {
						card: "summary_large_image",
						title,
						description,
						images: [ogImage],
					},
				};
			}
		}
	} catch {
		// Fall through to defaults
	}

	return {
		title: `Scan Results | codescan.dev`,
	};
}

export default async function ScanPage({ params }: PageProps) {
	const { id } = await params;

	return (
		<main className="flex min-h-screen flex-col items-center justify-start pt-10 sm:justify-center sm:pt-0 px-4 py-6 sm:py-12">
			<div className="mb-8">
				<Link
					href="/"
					className="font-mono text-xl font-extrabold tracking-tight"
				>
					<span className="text-[var(--brand-blue)]">codescan</span>
					<span className="text-[var(--text-muted)]">.dev</span>
				</Link>
			</div>
			<ErrorBoundary>
				<ScanResultView id={id} />
			</ErrorBoundary>
		</main>
	);
}

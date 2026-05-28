import type { Metadata } from "next";
import Link from "next/link";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScanResultView from "@/components/ScanResult";
import { getSession } from "@/lib/auth";
import { getGrade } from "@/lib/score-utils";
import { getSiteUrl } from "@/lib/site-url";

interface PageProps {
	params: Promise<{ id: string }>;
}

const SCAN_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;
	const apiUrl = process.env.API_URL ?? "";
	const backendApiKey = process.env.BACKEND_API_KEY ?? "";

	if (!SCAN_ID_PATTERN.test(id)) {
		return { title: "Invalid Scan | codescan.dev" };
	}

	const headers: Record<string, string> = {};
	if (backendApiKey) {
		headers.Authorization = `Bearer ${backendApiKey}`;

		// Only assert the viewer's identity over an authenticated backend channel
		// (see the scan proxy route). The owner of a private scan then gets a
		// descriptive title; everyone else falls through to the generic metadata.
		const session = await getSession();
		if (session?.userId) {
			headers["X-Viewer-User-ID"] = String(session.userId);
		}
	}

	try {
		const res = await fetch(`${apiUrl}/api/scan/${id}`, {
			headers,
			cache: "no-store",
		});
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
					metadataBase: new URL(siteUrl),
					robots: {
						index: false,
						follow: true,
					},
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
		robots: {
			index: false,
			follow: true,
		},
	};
}

export default async function ScanPage({ params }: PageProps) {
	const { id } = await params;

	return (
		<main className="flex min-h-screen flex-col items-center px-4 py-6 sm:py-10">
			<div className="mb-8 w-full max-w-5xl">
				<Link
					href="/"
					className="font-mono text-xl font-extrabold tracking-tight"
				>
					<span className="text-[var(--brand-blue)]">codescan</span>
					<span className="text-[var(--text-primary)]">.dev</span>
				</Link>
			</div>
			<ErrorBoundary>
				<ScanResultView id={id} />
			</ErrorBoundary>
		</main>
	);
}

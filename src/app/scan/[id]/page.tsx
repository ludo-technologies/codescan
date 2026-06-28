import type { Metadata } from "next";
import Link from "next/link";
import ErrorBoundary from "@/components/ErrorBoundary";
import FindingsList from "@/components/FindingsList";
import ScanResultView from "@/components/ScanResult";
import ScanResultError from "@/components/ScanResultError";
import ShareActions from "@/components/ShareActions";
import ShareCard from "@/components/ShareCard";
import { getSession } from "@/lib/auth";
import { scanResultSchema } from "@/lib/scan-schema";
import { getGrade } from "@/lib/score-utils";
import { getBackendConfig } from "@/lib/server-env";
import { getSiteUrl } from "@/lib/site-url";
import type { ScanResult } from "@/types/scan";

interface PageProps {
	params: Promise<{ id: string }>;
}

const SCAN_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

async function fetchInitialScanResult(
	id: string,
): Promise<ScanResult | undefined> {
	if (!SCAN_ID_PATTERN.test(id)) {
		return undefined;
	}

	try {
		const backendConfig = getBackendConfig();
		const headers: Record<string, string> = {
			Authorization: `Bearer ${backendConfig.backendApiKey}`,
		};

		// Only assert the viewer's identity over an authenticated backend channel.
		const session = await getSession();
		if (session?.userId) {
			headers["X-Viewer-User-ID"] = String(session.userId);
		}

		const res = await fetch(`${backendConfig.apiUrl}/api/scan/${id}`, {
			headers,
			cache: "no-store",
		});
		if (!res.ok) return undefined;

		const parsed = scanResultSchema.safeParse(await res.json());
		if (!parsed.success) return undefined;

		return parsed.data;
	} catch {
		return undefined;
	}
}

function CompletedScanResult({ result }: { result: ScanResult }) {
	return (
		<div className="flex w-full max-w-5xl flex-col items-center gap-5">
			<ShareCard result={result} />
			<FindingsList result={result} />
			<ShareActions result={result} />
		</div>
	);
}

function renderInitialScanResult(id: string, result: ScanResult | undefined) {
	if (result?.status === "completed") {
		return <CompletedScanResult result={result} />;
	}

	if (result?.status === "failed") {
		return (
			<ScanResultError
				title="Scan Failed"
				message={result.error_message ?? "Unknown error"}
			/>
		);
	}

	return <ScanResultView id={id} initialResult={result} />;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;

	if (!SCAN_ID_PATTERN.test(id)) {
		return { title: "Invalid Scan | codescan.dev" };
	}

	const data = await fetchInitialScanResult(id);
	if (data?.status === "completed") {
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
	const initialResult = await fetchInitialScanResult(id);

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
				{renderInitialScanResult(id, initialResult)}
			</ErrorBoundary>
		</main>
	);
}

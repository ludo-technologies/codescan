const DEFAULT_SITE_URL = "https://codescan.dev";

export function getSiteUrl() {
	return (
		process.env.SITE_URL ??
		process.env.NEXT_PUBLIC_SITE_URL ??
		(process.env.VERCEL_PROJECT_PRODUCTION_URL
			? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
			: undefined) ??
		(process.env.VERCEL_URL
			? `https://${process.env.VERCEL_URL}`
			: undefined) ??
		DEFAULT_SITE_URL
	).replace(/\/$/, "");
}

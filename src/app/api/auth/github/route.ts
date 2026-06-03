import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthConfig } from "@/lib/server-env";

export async function GET() {
	let config: ReturnType<typeof getAuthConfig>;
	try {
		config = getAuthConfig();
	} catch {
		return NextResponse.json(
			{ error: "GitHub OAuth not configured" },
			{ status: 500 },
		);
	}

	const state = crypto.randomUUID();

	const cookieStore = await cookies();
	cookieStore.set("oauth_state", state, {
		httpOnly: true,
		secure: config.siteUrl.startsWith("https://"),
		sameSite: "lax",
		path: "/",
		maxAge: 600,
	});

	const githubUrl = new URL("https://github.com/login/oauth/authorize");
	githubUrl.searchParams.set("client_id", config.githubClientId);
	githubUrl.searchParams.set(
		"redirect_uri",
		`${config.siteUrl}/api/auth/callback`,
	);
	githubUrl.searchParams.set("scope", "repo");
	githubUrl.searchParams.set("state", state);

	return NextResponse.redirect(githubUrl.toString());
}

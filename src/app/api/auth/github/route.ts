import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export async function GET() {
	if (!GITHUB_CLIENT_ID) {
		return NextResponse.json(
			{ error: "GitHub OAuth not configured" },
			{ status: 500 },
		);
	}

	const state = crypto.randomUUID();

	const cookieStore = await cookies();
	cookieStore.set("oauth_state", state, {
		httpOnly: true,
		secure: SITE_URL.startsWith("https://"),
		sameSite: "lax",
		path: "/",
		maxAge: 600,
	});

	const githubUrl = new URL("https://github.com/login/oauth/authorize");
	githubUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
	githubUrl.searchParams.set("redirect_uri", `${SITE_URL}/api/auth/callback`);
	githubUrl.searchParams.set("scope", "repo read:user");
	githubUrl.searchParams.set("state", state);

	return NextResponse.redirect(githubUrl.toString());
}

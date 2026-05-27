import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createSessionCookieHeader, signSession } from "@/lib/auth";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");

	const cookieStore = await cookies();
	const storedState = cookieStore.get("oauth_state")?.value;
	cookieStore.delete("oauth_state");

	if (!state || state !== storedState) {
		return NextResponse.redirect(`${SITE_URL}/?auth_error=invalid_state`);
	}

	if (!code) {
		return NextResponse.redirect(`${SITE_URL}/?auth_error=missing_code`);
	}

	const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET,
			code,
		}),
	});

	if (!tokenRes.ok) {
		return NextResponse.redirect(`${SITE_URL}/?auth_error=token_exchange`);
	}

	const tokenData = await tokenRes.json();
	if (tokenData.error) {
		return NextResponse.redirect(`${SITE_URL}/?auth_error=token_exchange`);
	}

	const userRes = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${tokenData.access_token}`,
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "codescan-dev",
		},
	});

	if (!userRes.ok) {
		return NextResponse.redirect(`${SITE_URL}/?auth_error=user_fetch`);
	}

	const user = await userRes.json();

	const sessionToken = signSession({
		userId: user.id,
		login: user.login,
		accessToken: tokenData.access_token,
	});

	const response = NextResponse.redirect(`${SITE_URL}/`);
	response.headers.append(
		"Set-Cookie",
		createSessionCookieHeader(sessionToken),
	);
	return response;
}

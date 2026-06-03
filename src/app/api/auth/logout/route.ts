import { NextResponse } from "next/server";
import { createClearSessionCookieHeader } from "@/lib/auth";
import { getSessionConfig } from "@/lib/server-env";

export async function POST() {
	const { siteUrl } = getSessionConfig();
	const response = NextResponse.redirect(`${siteUrl}/`, { status: 303 });
	response.headers.append("Set-Cookie", createClearSessionCookieHeader());
	return response;
}

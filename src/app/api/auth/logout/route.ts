import { NextResponse } from "next/server";
import { createClearSessionCookieHeader } from "@/lib/auth";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export async function POST() {
	const response = NextResponse.redirect(`${SITE_URL}/`, { status: 303 });
	response.headers.append("Set-Cookie", createClearSessionCookieHeader());
	return response;
}

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
	return Buffer.from(JWT_SECRET.padEnd(32, "0").slice(0, 32));
}

function encrypt(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	});
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();
	return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

function decrypt(ciphertext: string): string {
	const key = getEncryptionKey();
	const data = Buffer.from(ciphertext, "base64url");
	const iv = data.subarray(0, IV_LENGTH);
	const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
	const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
	const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	});
	decipher.setAuthTag(authTag);
	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
		"utf8",
	);
}

export interface SessionPayload {
	userId: number;
	login: string;
	encryptedToken: string;
}

export function signSession(user: {
	userId: number;
	login: string;
	accessToken: string;
}): string {
	const payload: SessionPayload = {
		userId: user.userId,
		login: user.login,
		encryptedToken: encrypt(user.accessToken),
	};
	return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE });
}

export function verifySession(
	token: string,
): (SessionPayload & { accessToken: string }) | null {
	try {
		const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;
		return {
			...payload,
			accessToken: decrypt(payload.encryptedToken),
		};
	} catch {
		return null;
	}
}

export async function getSession(): Promise<
	(SessionPayload & { accessToken: string }) | null
> {
	if (!JWT_SECRET) return null;
	const cookieStore = await cookies();
	const token = cookieStore.get(SESSION_COOKIE)?.value;
	if (!token) return null;
	return verifySession(token);
}

function isSecure(): boolean {
	return SITE_URL.startsWith("https://");
}

export function createSessionCookieHeader(token: string): string {
	const secure = isSecure() ? " Secure;" : "";
	return `${SESSION_COOKIE}=${token}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

export function createClearSessionCookieHeader(): string {
	const secure = isSecure() ? " Secure;" : "";
	return `${SESSION_COOKIE}=;${secure} HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

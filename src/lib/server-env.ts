function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export function getBackendConfig() {
	const apiUrl = requireEnv("API_URL");
	const backendApiKey = requireEnv("BACKEND_API_KEY");

	return { apiUrl, backendApiKey };
}

export function getAuthConfig() {
	const githubClientId = requireEnv("GITHUB_CLIENT_ID");
	const githubClientSecret = requireEnv("GITHUB_CLIENT_SECRET");
	const jwtSecret = requireEnv("JWT_SECRET");
	const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

	if (jwtSecret.length < 32) {
		throw new Error("JWT_SECRET must be at least 32 characters long");
	}

	return { githubClientId, githubClientSecret, jwtSecret, siteUrl };
}

export function getSessionConfig() {
	const jwtSecret = requireEnv("JWT_SECRET");
	const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

	if (jwtSecret.length < 32) {
		throw new Error("JWT_SECRET must be at least 32 characters long");
	}

	return { jwtSecret, siteUrl };
}

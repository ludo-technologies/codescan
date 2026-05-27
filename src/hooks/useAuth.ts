"use client";

import useSWR from "swr";

interface AuthUser {
	login: string;
}

interface AuthResponse {
	user: AuthUser | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAuth() {
	const { data, mutate } = useSWR<AuthResponse>("/api/auth/me", fetcher, {
		revalidateOnFocus: false,
	});

	return {
		user: data?.user ?? null,
		isLoading: !data,
		mutate,
	};
}

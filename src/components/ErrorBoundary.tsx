"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("ErrorBoundary caught:", error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback ?? (
					<div className="flex flex-col items-center gap-4 py-16 text-center">
						<p className="text-[var(--text-muted)] text-sm">
							Something went wrong. Please try again.
						</p>
						<a
							href="/"
							className="text-[var(--brand-blue)] text-sm hover:underline"
						>
							← Back to home
						</a>
					</div>
				)
			);
		}

		return this.props.children;
	}
}

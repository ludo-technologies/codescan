import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ShareActions from "@/components/ShareActions";
import type { ScanResult } from "@/types/scan";

const mockResult: ScanResult = {
	id: "scan-123",
	owner: "testowner",
	repo: "testrepo",
	status: "completed",
	total_score: 85,
	scanner_versions: {},
	requested_at: "2024-01-01T00:00:00Z",
};

describe("ShareActions", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_SITE_URL = "https://codescan.dev";
		URL.createObjectURL = vi.fn(() => "blob:mock-url");
		URL.revokeObjectURL = vi.fn();
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it("renders all three action buttons", () => {
		render(<ShareActions result={mockResult} />);
		expect(screen.getByText("Share on X")).toBeInTheDocument();
		expect(screen.getByText("Download Card")).toBeInTheDocument();
		expect(screen.getByText("Copy Link")).toBeInTheDocument();
	});

	describe("Share on X", () => {
		it("generates a Twitter share link with the correct URL", () => {
			render(<ShareActions result={mockResult} />);
			const link = screen.getByText("Share on X").closest("a");
			expect(link?.href).toContain("twitter.com/intent/tweet");
		});

		it("encodes the share text including owner, repo, and grade", () => {
			render(<ShareActions result={mockResult} />);
			const link = screen.getByText("Share on X").closest("a");
			expect(link?.href).toContain(
				encodeURIComponent("testowner/testrepo earned grade A on codescan.dev"),
			);
		});

		it("encodes the share URL as a query parameter", () => {
			render(<ShareActions result={mockResult} />);
			const link = screen.getByText("Share on X").closest("a");
			expect(link?.href).toContain(
				encodeURIComponent("https://codescan.dev/scan/scan-123"),
			);
		});

		it("opens in a new tab", () => {
			render(<ShareActions result={mockResult} />);
			const link = screen.getByText("Share on X").closest("a");
			expect(link?.target).toBe("_blank");
			expect(link?.rel).toContain("noopener");
		});
	});

	describe("Copy Link", () => {
		it("writes the scan URL to clipboard when clicked", async () => {
			const user = userEvent.setup();
			const writeTextMock = vi.fn().mockResolvedValue(undefined);
			Object.defineProperty(navigator, "clipboard", {
				value: { writeText: writeTextMock },
				writable: true,
				configurable: true,
			});

			render(<ShareActions result={mockResult} />);
			await user.click(screen.getByText("Copy Link"));

			await waitFor(() => {
				expect(writeTextMock).toHaveBeenCalledWith(
					"https://codescan.dev/scan/scan-123",
				);
			});
		});

		it("handles clipboard failure gracefully without throwing", async () => {
			const user = userEvent.setup();
			Object.defineProperty(navigator, "clipboard", {
				value: {
					writeText: vi.fn().mockRejectedValue(new Error("Not allowed")),
				},
				writable: true,
				configurable: true,
			});
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			render(<ShareActions result={mockResult} />);
			await user.click(screen.getByText("Copy Link"));

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith("Failed to copy link");
			});
		});
	});

	describe("Download Card", () => {
		it("fetches the OG image and triggers a download", async () => {
			const user = userEvent.setup();
			const mockBlob = new Blob(["image-data"], { type: "image/png" });
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: true,
					blob: () => Promise.resolve(mockBlob),
				}),
			);

			// Render before setting up the createElement mock, so React's own
			// 'a' element creation during render is not intercepted.
			render(<ShareActions result={mockResult} />);

			const mockClick = vi.fn();
			const mockAnchor = { href: "", download: "", click: mockClick };
			const originalCreateElement = document.createElement.bind(document);
			vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
				if (tag === "a") return mockAnchor as unknown as HTMLElement;
				return originalCreateElement(tag);
			});

			await user.click(screen.getByText("Download Card"));

			await waitFor(() => {
				expect(fetch).toHaveBeenCalledWith("/scan/scan-123/og");
				expect(mockAnchor.download).toBe("testowner-testrepo-codescan.png");
				expect(mockClick).toHaveBeenCalled();
			});
		});

		it("revokes the object URL after download", async () => {
			const user = userEvent.setup();
			const mockBlob = new Blob(["image-data"], { type: "image/png" });
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: true,
					blob: () => Promise.resolve(mockBlob),
				}),
			);

			render(<ShareActions result={mockResult} />);

			const originalCreateElement = document.createElement.bind(document);
			vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
				if (tag === "a")
					return {
						href: "",
						download: "",
						click: vi.fn(),
					} as unknown as HTMLElement;
				return originalCreateElement(tag);
			});

			await user.click(screen.getByText("Download Card"));

			await waitFor(() => {
				expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
			});
		});

		it("handles a failed download response gracefully", async () => {
			const user = userEvent.setup();
			vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			render(<ShareActions result={mockResult} />);
			await user.click(screen.getByText("Download Card"));

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith("Failed to download card");
			});
		});
	});
});

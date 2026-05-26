import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ScanForm from "@/components/ScanForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/api", () => ({
	requestScan: vi.fn(),
}));

// Import after mock registration
import { requestScan } from "@/lib/api";

describe("ScanForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders the URL input and submit button", () => {
		render(<ScanForm />);
		expect(
			screen.getByPlaceholderText("https://github.com/owner/repo"),
		).toBeInTheDocument();
		const buttons = screen.getAllByRole("button", { name: /scan repo/i });
		expect(buttons.length).toBeGreaterThan(0);
	});

	it("shows an error for an invalid GitHub URL", async () => {
		const user = userEvent.setup();
		render(<ScanForm />);

		const input = screen.getByPlaceholderText("https://github.com/owner/repo");
		await user.type(input, "https://example.com/not-github");
		await user.click(screen.getAllByRole("button", { name: /scan repo/i })[0]);

		expect(
			await screen.findByText("Please enter a valid GitHub repository URL"),
		).toBeInTheDocument();
		expect(requestScan).not.toHaveBeenCalled();
	});

	it("shows an error when the input is empty", async () => {
		const user = userEvent.setup();
		render(<ScanForm />);

		await user.click(screen.getAllByRole("button", { name: /scan repo/i })[0]);

		expect(
			await screen.findByText("Please enter a valid GitHub repository URL"),
		).toBeInTheDocument();
		expect(requestScan).not.toHaveBeenCalled();
	});

	it("calls requestScan with the trimmed URL on valid input", async () => {
		const user = userEvent.setup();
		vi.mocked(requestScan).mockResolvedValue({
			scan_id: "test-id",
			status: "pending",
			cached: false,
		});

		render(<ScanForm />);
		const input = screen.getByPlaceholderText("https://github.com/owner/repo");
		await user.type(input, "https://github.com/owner/repo");
		await user.click(screen.getAllByRole("button", { name: /scan repo/i })[0]);

		await waitFor(() => {
			expect(requestScan).toHaveBeenCalledWith("https://github.com/owner/repo");
		});
	});

	it("navigates to the scan result page on successful submission", async () => {
		const user = userEvent.setup();
		vi.mocked(requestScan).mockResolvedValue({
			scan_id: "abc-123",
			status: "pending",
			cached: false,
		});

		render(<ScanForm />);
		const input = screen.getByPlaceholderText("https://github.com/owner/repo");
		await user.type(input, "https://github.com/owner/repo");
		await user.click(screen.getAllByRole("button", { name: /scan repo/i })[0]);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/scan/abc-123");
		});
	});

	it("displays the API error message when requestScan rejects", async () => {
		const user = userEvent.setup();
		vi.mocked(requestScan).mockRejectedValue(new Error("Repository not found"));

		render(<ScanForm />);
		const input = screen.getByPlaceholderText("https://github.com/owner/repo");
		await user.type(input, "https://github.com/owner/repo");
		await user.click(screen.getAllByRole("button", { name: /scan repo/i })[0]);

		expect(await screen.findByText("Repository not found")).toBeInTheDocument();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("disables the input while the scan is loading", async () => {
		const user = userEvent.setup();
		let resolve!: (v: {
			scan_id: string;
			status: string;
			cached: boolean;
		}) => void;
		vi.mocked(requestScan).mockImplementation(
			() =>
				new Promise((res) => {
					resolve = res;
				}),
		);

		render(<ScanForm />);
		const input = screen.getByPlaceholderText("https://github.com/owner/repo");
		await user.type(input, "https://github.com/owner/repo");
		await user.click(screen.getAllByRole("button", { name: /scan repo/i })[0]);

		await waitFor(() => {
			expect(input).toBeDisabled();
		});

		// Cleanup: resolve the pending promise
		resolve?.({ scan_id: "x", status: "pending", cached: false });
	});

	it("clears a previous error when a new valid submission is made", async () => {
		const user = userEvent.setup();

		// First: trigger an error
		render(<ScanForm />);
		await user.click(screen.getAllByRole("button", { name: /scan repo/i })[0]);
		expect(
			await screen.findByText("Please enter a valid GitHub repository URL"),
		).toBeInTheDocument();

		// Then: submit a valid URL
		vi.mocked(requestScan).mockResolvedValue({
			scan_id: "ok-id",
			status: "pending",
			cached: false,
		});
		const input = screen.getByPlaceholderText("https://github.com/owner/repo");
		await user.type(input, "https://github.com/owner/repo");
		await user.click(screen.getAllByRole("button", { name: /scan repo/i })[0]);

		await waitFor(() => {
			expect(
				screen.queryByText("Please enter a valid GitHub repository URL"),
			).not.toBeInTheDocument();
		});
	});
});

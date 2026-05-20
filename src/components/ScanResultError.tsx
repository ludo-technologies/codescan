interface ScanResultErrorProps {
	title?: string;
	message: string;
}

export default function ScanResultError({
	title = "Error",
	message,
}: ScanResultErrorProps) {
	return (
		<div className="text-center">
			<div className="mb-4 text-[var(--color-error)] text-lg font-semibold">
				{title}
			</div>
			<p className="text-[var(--text-secondary)] text-sm">{message}</p>
		</div>
	);
}

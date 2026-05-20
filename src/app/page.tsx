import ScanForm from "@/components/ScanForm";

export default function Home() {
	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20 pb-20">
			{/* Background Decorative Text */}
			<div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.03]">
				<h2 className="text-[25vw] font-black tracking-tighter text-white">
					SCAN
				</h2>
			</div>

			<div className="relative z-10 flex w-full max-w-5xl flex-col items-center px-4 text-center">
				{/* Hero Section */}
				<div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
					<h1 className="mb-6 text-5xl font-black tracking-tight sm:text-7xl lg:text-9xl">
						<span className="text-white">codescan</span>
						<span className="text-[var(--brand-blue)]">.dev</span>
					</h1>
					<p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
						Instant code health analysis for any public GitHub repository.
					</p>
				</div>

				{/* Search/Scan Bar */}
				<div className="w-full animate-in fade-in zoom-in-95 fill-mode-both duration-1000 delay-300 ease-out">
					<div className="flex justify-center">
						<ScanForm />
					</div>
				</div>
			</div>
		</main>
	);
}

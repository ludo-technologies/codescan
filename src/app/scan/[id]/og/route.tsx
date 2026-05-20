import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { getGrade, getTier, type Tier } from "@/lib/score-utils";

export const runtime = "edge";

const OGP_WIDTH = 1200;
const OGP_HEIGHT = 630;

const COLOR_CRITICAL = "#EF4444";
const COLOR_HIGH = "#F59E0B";
const COLOR_WARN = "#FBBF24";
const COLOR_MUTED = "#666";

const OGP_TIER_COLORS: Record<Tier, { from: string; to: string }> = {
	excellent: { from: "#22c55e", to: "#4ade80" },
	good: { from: "#3B82F6", to: "#60A5FA" },
	fair: { from: "#F59E0B", to: "#FBBF24" },
	poor: { from: "#EF4444", to: "#F87171" },
};

interface CategoryProps {
	label: string;
	counts: { label: string; value: number; color: string }[];
}

function CategoryCard({ label, counts }: CategoryProps) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				background: "rgba(255,255,255,0.04)",
				border: "1px solid rgba(255,255,255,0.08)",
				borderRadius: "14px",
				padding: "16px 24px",
				flexShrink: 0,
			}}
		>
			<span
				style={{
					fontSize: "20px",
					fontWeight: 700,
					color: "#9ca3af",
					letterSpacing: "1px",
					textTransform: "uppercase",
				}}
			>
				{label}
			</span>
			<div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
				{counts.map((count) => (
					<div
						key={count.label}
						style={{ display: "flex", alignItems: "baseline", gap: "6px" }}
					>
						<span
							style={{
								fontSize: "32px",
								fontWeight: 800,
								color: count.color,
								fontFamily: "monospace",
							}}
						>
							{count.value}
						</span>
						<span style={{ fontSize: "16px", color: COLOR_MUTED }}>
							{count.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const apiUrl = process.env.API_URL ?? "";

	const res = await fetch(`${apiUrl}/api/scan/${id}`);
	if (!res.ok) {
		return new Response("Scan not found", { status: 404 });
	}

	const data = await res.json();
	if (data.status !== "completed") {
		return new Response("Scan not completed", { status: 404 });
	}

	const score = data.total_score ?? 0;
	const grade = getGrade(score);
	const { from: ringFrom, to: ringTo } = OGP_TIER_COLORS[getTier(score)];

	const sast = data.sast ?? null;
	const secrets = data.secrets ?? null;
	const deps = data.dependencies ?? null;

	const sastCounts = sast
		? [
				{ label: "errors", value: sast.error_count ?? 0, color: COLOR_HIGH },
				{
					label: "warnings",
					value: sast.warning_count ?? 0,
					color: COLOR_WARN,
				},
			]
		: [{ label: "N/A", value: 0, color: COLOR_MUTED }];

	const secretsCounts = secrets
		? [
				{
					label: "critical",
					value: secrets.critical_count ?? 0,
					color: COLOR_CRITICAL,
				},
			]
		: [{ label: "N/A", value: 0, color: COLOR_MUTED }];

	const depsCounts = deps
		? [
				{
					label: "critical",
					value: deps.critical_count ?? 0,
					color: COLOR_CRITICAL,
				},
				{ label: "high", value: deps.high_count ?? 0, color: COLOR_HIGH },
				{ label: "medium", value: deps.medium_count ?? 0, color: COLOR_WARN },
			]
		: [{ label: "N/A", value: 0, color: COLOR_MUTED }];

	const ringSize = 260;
	const center = ringSize / 2;
	const radius = 112;
	const strokeWidth = 16;
	const circumference = 2 * Math.PI * radius;
	const dashoffset = circumference - (score / 100) * circumference;

	const imageResponse = new ImageResponse(
		<div
			style={{
				width: OGP_WIDTH,
				height: OGP_HEIGHT,
				background: "#141416",
				display: "flex",
				padding: "64px 72px",
				gap: "72px",
				position: "relative",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					width: "600px",
					height: "600px",
					background:
						"radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
				}}
			/>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					flexShrink: 0,
				}}
			>
				<div
					style={{
						width: `${ringSize}px`,
						height: `${ringSize}px`,
						position: "relative",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<svg
						aria-hidden="true"
						width={ringSize}
						height={ringSize}
						viewBox={`0 0 ${ringSize} ${ringSize}`}
						style={{ transform: "rotate(-90deg)", position: "absolute" }}
					>
						<circle
							cx={center}
							cy={center}
							r={radius}
							fill="none"
							stroke="rgba(255,255,255,0.05)"
							strokeWidth={strokeWidth}
						/>
						<circle
							cx={center}
							cy={center}
							r={radius}
							fill="none"
							stroke={ringFrom}
							strokeWidth={strokeWidth}
							strokeLinecap="round"
							strokeDasharray={`${circumference}`}
							strokeDashoffset={`${dashoffset}`}
						/>
					</svg>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							zIndex: 1,
						}}
					>
						<span
							style={{
								fontSize: "76px",
								fontWeight: 800,
								color: "#fff",
								lineHeight: 1,
								fontFamily: "monospace",
							}}
						>
							{score}
						</span>
						<span
							style={{
								fontSize: "24px",
								fontWeight: 700,
								color: ringTo,
								letterSpacing: "4px",
								marginTop: "4px",
							}}
						>
							{grade}
						</span>
					</div>
				</div>
				<span
					style={{
						fontSize: "22px",
						color: "#777",
						marginTop: "16px",
						fontFamily: "monospace",
					}}
				>
					{data.owner}/{data.repo}
				</span>
			</div>

			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					gap: "16px",
				}}
			>
				<div
					style={{
						fontSize: "30px",
						fontWeight: 800,
						marginBottom: "8px",
						fontFamily: "monospace",
						display: "flex",
					}}
				>
					<span style={{ color: "#3B82F6" }}>codescan</span>
					<span style={{ color: "#555" }}>.dev</span>
				</div>

				<CategoryCard label="SAST" counts={sastCounts} />
				<CategoryCard label="Secrets" counts={secretsCounts} />
				<CategoryCard label="Dependencies" counts={depsCounts} />

				<div
					style={{
						paddingTop: "4px",
						display: "flex",
						flexShrink: 0,
					}}
				>
					<div
						style={{
							fontSize: "20px",
							color: "#fff",
							background: "rgba(59,130,246,0.12)",
							border: "1px solid rgba(59,130,246,0.25)",
							padding: "10px 20px",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: "8px",
							fontFamily: "monospace",
						}}
					>
						Scan yours <span style={{ color: "#60A5FA" }}>→</span>{" "}
						<span style={{ color: "#60A5FA", fontWeight: 700 }}>
							codescan.dev
						</span>
					</div>
				</div>
			</div>
		</div>,
		{
			width: OGP_WIDTH,
			height: OGP_HEIGHT,
		},
	);
	imageResponse.headers.set(
		"Cache-Control",
		"public, max-age=86400, immutable",
	);
	return imageResponse;
}

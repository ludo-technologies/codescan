import { type Grade, getGrade } from "@/lib/score-utils";

// Flat "shields"-style badge colors, keyed by grade so the badge matches the
// report card's tier coloring (A green … F red).
const GRADE_BADGE_COLORS: Record<Grade, string> = {
	A: "#22c55e",
	B: "#3b82f6",
	C: "#f59e0b",
	D: "#f97316",
	F: "#ef4444",
};

// Shown when a repo has no public scan yet, so an embedded badge always renders
// instead of a broken image.
const NEUTRAL_COLOR = "#9f9f9f";

const BADGE_LABEL = "security";

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// Approximate the rendered width of 11px Verdana text. Exact metrics need font
// shaping; for the short, fixed strings this badge uses, a per-character average
// is close enough that the text never overflows its segment.
function estimateTextWidth(text: string): number {
	let width = 0;
	for (const char of text) {
		if (char === " ") width += 3.5;
		else if (/[ilIj.,:'!|]/.test(char)) width += 3;
		else if (/[mwMW]/.test(char)) width += 9;
		else if (/[A-Z]/.test(char)) width += 7.5;
		else width += 6.5;
	}
	return Math.ceil(width);
}

function renderBadge(label: string, message: string, color: string): string {
	const HEIGHT = 20;
	const PAD = 10; // horizontal padding on each side of each text segment
	const labelWidth = estimateTextWidth(label) + PAD * 2;
	const messageWidth = estimateTextWidth(message) + PAD * 2;
	const totalWidth = labelWidth + messageWidth;

	// Text is rendered at 10x scale then shrunk with scale(.1); this is the
	// shields.io trick for crisp sub-pixel positioning across renderers.
	const labelCenter = (labelWidth / 2) * 10;
	const messageCenter = (labelWidth + messageWidth / 2) * 10;
	const ariaLabel = `${label}: ${message}`;

	const safeLabel = escapeXml(label);
	const safeMessage = escapeXml(message);

	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${HEIGHT}" role="img" aria-label="${escapeXml(ariaLabel)}">
<title>${escapeXml(ariaLabel)}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="r"><rect width="${totalWidth}" height="${HEIGHT}" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)">
<rect width="${labelWidth}" height="${HEIGHT}" fill="#555"/>
<rect x="${labelWidth}" width="${messageWidth}" height="${HEIGHT}" fill="${color}"/>
<rect width="${totalWidth}" height="${HEIGHT}" fill="url(#s)"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
<text aria-hidden="true" x="${labelCenter}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - PAD * 2) * 10}">${safeLabel}</text>
<text x="${labelCenter}" y="140" transform="scale(.1)" textLength="${(labelWidth - PAD * 2) * 10}">${safeLabel}</text>
<text aria-hidden="true" x="${messageCenter}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(messageWidth - PAD * 2) * 10}">${safeMessage}</text>
<text x="${messageCenter}" y="140" transform="scale(.1)" textLength="${(messageWidth - PAD * 2) * 10}">${safeMessage}</text>
</g>
</svg>`;
}

/** Badge for a scored repo: "security | A" colored by grade. */
export function renderGradeBadge(score: number): string {
	const grade = getGrade(score);
	return renderBadge(BADGE_LABEL, grade, GRADE_BADGE_COLORS[grade]);
}

/** Neutral fallback badge for a repo with no public scan yet. */
export function renderNeutralBadge(): string {
	return renderBadge(BADGE_LABEL, "not scanned", NEUTRAL_COLOR);
}

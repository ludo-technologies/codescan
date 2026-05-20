"use client";

import { useState } from "react";
import type {
	DepFinding,
	SastFinding,
	ScanResult,
	SecretFinding,
} from "@/types/scan";

interface FindingsListProps {
	result: ScanResult;
}

type Tab = "sast" | "secrets" | "deps";

const SEVERITY_BADGE: Record<string, string> = {
	CRITICAL: "bg-[#7f1d1d] text-[#fca5a5] border-[#dc2626]/40",
	HIGH: "bg-[#78350f] text-[#fcd34d] border-[#ea580c]/40",
	ERROR: "bg-[#78350f] text-[#fcd34d] border-[#ea580c]/40",
	MEDIUM: "bg-[#713f12] text-[#fde68a] border-[#ca8a04]/40",
	WARNING: "bg-[#713f12] text-[#fde68a] border-[#ca8a04]/40",
	LOW: "bg-[#1e3a8a] text-[#bfdbfe] border-[#3b82f6]/40",
	INFO: "bg-[#1f2937] text-[#9ca3af] border-[#374151]",
};

function getSastKey(f: SastFinding) {
	return `${f.file}:${f.line}:${f.rule_id}:${f.message}`;
}

function getSecretKey(f: SecretFinding) {
	return `${f.file}:${f.line}:${f.rule_id}:${f.description}`;
}

function getDepKey(f: DepFinding) {
	return `${f.package}:${f.installed_version}:${f.cve}`;
}

function SeverityBadge({ severity }: { severity: string }) {
	const cls = SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.INFO;
	return (
		<span
			className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}
		>
			{severity}
		</span>
	);
}

function FileLine({ file, line }: { file: string; line: number }) {
	return (
		<span className="font-mono text-[11px] text-[#888]">
			{file}
			<span className="text-[#555]">:</span>
			<span className="text-[#aaa]">{line}</span>
		</span>
	);
}

function SastRow({ f }: { f: SastFinding }) {
	return (
		<li className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
			<div className="flex items-center gap-2 mb-1">
				<SeverityBadge severity={f.severity} />
				<FileLine file={f.file} line={f.line} />
			</div>
			<p className="text-[12px] text-[#ddd] leading-relaxed">{f.message}</p>
			<p className="mt-1 font-mono text-[10px] text-[#666]">{f.rule_id}</p>
		</li>
	);
}

function SecretRow({ f }: { f: SecretFinding }) {
	return (
		<li className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
			<div className="flex items-center gap-2 mb-1">
				<SeverityBadge severity="CRITICAL" />
				<FileLine file={f.file} line={f.line} />
			</div>
			<p className="text-[12px] text-[#ddd] leading-relaxed">{f.description}</p>
			<p className="mt-1 font-mono text-[10px] text-[#666]">{f.rule_id}</p>
		</li>
	);
}

function DepRow({ f }: { f: DepFinding }) {
	return (
		<li className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
			<div className="flex items-center gap-2 mb-1">
				<SeverityBadge severity={f.severity} />
				<span className="font-mono text-[11px] text-[#aaa]">
					{f.package} <span className="text-[#666]">@</span>{" "}
					{f.installed_version}
				</span>
			</div>
			<p className="text-[12px] text-[#ddd] leading-relaxed">{f.title}</p>
			<div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-[#666]">
				<span>{f.cve}</span>
				{f.fixed_version && (
					<span className="text-[#4ade80]">→ fix: {f.fixed_version}</span>
				)}
			</div>
		</li>
	);
}

export default function FindingsList({ result }: FindingsListProps) {
	const sastCount = result.sast?.findings.length ?? 0;
	const secretsCount = result.secrets?.findings.length ?? 0;
	const depsCount = result.dependencies?.findings.length ?? 0;

	const initialTab: Tab =
		sastCount > 0 ? "sast" : secretsCount > 0 ? "secrets" : "deps";
	const [tab, setTab] = useState<Tab>(initialTab);

	if (sastCount + secretsCount + depsCount === 0) {
		return null;
	}

	return (
		<details className="w-full max-w-[680px] rounded-2xl bg-[#0f0f10] border border-white/[0.07] overflow-hidden">
			<summary className="cursor-pointer select-none px-5 py-3 text-[12px] font-semibold text-[#bbb] tracking-wide hover:bg-white/[0.02] transition-colors">
				View {sastCount + secretsCount + depsCount} findings
			</summary>

			<div className="border-t border-white/[0.05]">
				<div className="flex gap-1 px-3 pt-3">
					<TabBtn
						active={tab === "sast"}
						onClick={() => setTab("sast")}
						count={sastCount}
					>
						SAST
					</TabBtn>
					<TabBtn
						active={tab === "secrets"}
						onClick={() => setTab("secrets")}
						count={secretsCount}
					>
						Secrets
					</TabBtn>
					<TabBtn
						active={tab === "deps"}
						onClick={() => setTab("deps")}
						count={depsCount}
					>
						Dependencies
					</TabBtn>
				</div>

				<ul className="flex flex-col gap-2 p-3 max-h-[480px] overflow-y-auto">
					{tab === "sast" &&
						result.sast?.findings.map((finding) => (
							<SastRow key={getSastKey(finding)} f={finding} />
						))}
					{tab === "secrets" &&
						result.secrets?.findings.map((finding) => (
							<SecretRow key={getSecretKey(finding)} f={finding} />
						))}
					{tab === "deps" &&
						result.dependencies?.findings.map((finding) => (
							<DepRow key={getDepKey(finding)} f={finding} />
						))}
				</ul>
			</div>
		</details>
	);
}

function TabBtn({
	active,
	onClick,
	count,
	children,
}: {
	active: boolean;
	onClick: () => void;
	count: number;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${
				active
					? "bg-[#3B82F6]/[0.18] text-white border border-[#3B82F6]/40"
					: "text-[#888] hover:text-[#bbb] border border-transparent"
			}`}
		>
			{children}
			<span className="ml-1.5 font-mono text-[10px] text-[#999]">
				({count})
			</span>
		</button>
	);
}

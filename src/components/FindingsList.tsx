"use client";

import { useState } from "react";
import { CATEGORY_LABELS } from "@/lib/categories";
import { severityClasses } from "@/lib/severity-styles";
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
	return (
		<span
			className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${severityClasses(severity)}`}
		>
			{severity}
		</span>
	);
}

function FileLine({ file, line }: { file: string; line: number }) {
	return (
		<span className="min-w-0 truncate font-mono text-[11px] text-[var(--text-muted)]">
			{file}
			<span className="text-[var(--text-dimmed)]">:</span>
			<span className="text-[var(--text-label)]">{line}</span>
		</span>
	);
}

function SastRow({ f }: { f: SastFinding }) {
	return (
		<li className="rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-3">
			<div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
				<SeverityBadge severity={f.severity} />
				<FileLine file={f.file} line={f.line} />
			</div>
			<p className="text-sm leading-relaxed text-[var(--text-primary)]">
				{f.message}
			</p>
			<p className="mt-2 break-all font-mono text-[11px] text-[var(--text-muted)]">
				{f.rule_id}
			</p>
		</li>
	);
}

function SecretRow({ f }: { f: SecretFinding }) {
	return (
		<li className="rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-3">
			<div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
				<SeverityBadge severity="CRITICAL" />
				<FileLine file={f.file} line={f.line} />
			</div>
			<p className="text-sm leading-relaxed text-[var(--text-primary)]">
				{f.description}
			</p>
			<p className="mt-2 break-all font-mono text-[11px] text-[var(--text-muted)]">
				{f.rule_id}
			</p>
		</li>
	);
}

function DepRow({ f }: { f: DepFinding }) {
	return (
		<li className="rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-3">
			<div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
				<SeverityBadge severity={f.severity} />
				<span className="min-w-0 truncate font-mono text-[11px] text-[var(--text-label)]">
					{f.package} <span className="text-[var(--text-dimmed)]">@</span>{" "}
					{f.installed_version}
				</span>
			</div>
			<p className="text-sm leading-relaxed text-[var(--text-primary)]">
				{f.title}
			</p>
			<div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-[var(--text-muted)]">
				<span>{f.cve}</span>
				{f.fixed_version && (
					<span className="text-[var(--brand-green)]">
						Update to {f.fixed_version}
					</span>
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
		<details className="w-full overflow-hidden rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] shadow-sm">
			<summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] sm:px-7">
				View {sastCount + secretsCount + depsCount} findings
			</summary>

			<div className="border-t border-[var(--border-subtle)]">
				<div className="flex flex-wrap gap-2 px-5 pt-5 sm:px-7">
					<TabBtn
						active={tab === "sast"}
						onClick={() => setTab("sast")}
						count={sastCount}
					>
						{CATEGORY_LABELS.sast}
					</TabBtn>
					<TabBtn
						active={tab === "secrets"}
						onClick={() => setTab("secrets")}
						count={secretsCount}
					>
						{CATEGORY_LABELS.secrets}
					</TabBtn>
					<TabBtn
						active={tab === "deps"}
						onClick={() => setTab("deps")}
						count={depsCount}
					>
						{CATEGORY_LABELS.deps}
					</TabBtn>
				</div>

				<ul className="flex max-h-[520px] flex-col gap-3 overflow-y-auto p-5 sm:px-7">
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
			className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
				active
					? "border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)]"
					: "border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
			}`}
		>
			{children}
			<span className="ml-1.5 font-mono text-[11px] text-[var(--text-muted)]">
				({count})
			</span>
		</button>
	);
}

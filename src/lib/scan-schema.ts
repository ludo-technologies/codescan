import { z } from "zod";
import type { ScanResponse, ScanResult } from "@/types/scan";

const statusSchema = z.enum(["pending", "running", "completed", "failed"]);

export const scanResponseSchema: z.ZodType<ScanResponse> = z.object({
	scan_id: z.string().min(1),
	status: statusSchema.or(z.string()),
	cached: z.boolean(),
});

const sastFindingSchema = z.object({
	file: z.string(),
	line: z.number(),
	rule_id: z.string(),
	severity: z.enum(["ERROR", "WARNING", "INFO"]),
	message: z.string(),
});

const secretFindingSchema = z.object({
	file: z.string(),
	line: z.number(),
	rule_id: z.string(),
	description: z.string(),
});

const depFindingSchema = z.object({
	package: z.string(),
	installed_version: z.string(),
	fixed_version: z.string().optional(),
	cve: z.string(),
	severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
	title: z.string(),
});

export const scanResultSchema: z.ZodType<ScanResult> = z.object({
	id: z.string().min(1),
	owner: z.string().default(""),
	repo: z.string().default(""),
	language: z.string().optional(),
	is_private: z.boolean().optional(),
	status: statusSchema,
	error_message: z.string().optional(),
	total_score: z.number().default(0),
	sast: z
		.object({
			error_count: z.number(),
			warning_count: z.number(),
			info_count: z.number(),
			findings: z.array(sastFindingSchema),
		})
		.optional(),
	secrets: z
		.object({
			critical_count: z.number(),
			findings: z.array(secretFindingSchema),
		})
		.optional(),
	dependencies: z
		.object({
			critical_count: z.number(),
			high_count: z.number(),
			medium_count: z.number(),
			low_count: z.number(),
			findings: z.array(depFindingSchema),
		})
		.optional(),
	scanner_versions: z
		.object({
			semgrep: z.string().optional(),
			gitleaks: z.string().optional(),
			trivy: z.string().optional(),
		})
		.default({}),
	requested_at: z.string().default(""),
	completed_at: z.string().optional(),
});

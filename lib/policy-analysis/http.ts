import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import { analysisRoleFromRequest, type AnalysisRole } from "@/lib/auth/consultant-or-team";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { ToolkitCaseError } from "@/lib/consultant-toolkit/cases";
import { toolkitHeaders } from "@/lib/consultant-toolkit/http";
import { readBoundedJson } from "@/lib/http/request";
import { PolicyAnalysisError } from "./errors";

export const SIGN_IN_MESSAGE = "Sign in to the Consultant Workspace or the One DSD Team to continue.";
export const policyHeaders = toolkitHeaders;
export const policyJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: policyHeaders });
export const policyError = (error: string, status: number, code?: string) => policyJson(code ? { error, code } : { error }, status);

/** The signed-in role, or the response to return. Mutations also require a same-origin request. */
export async function policyAccess(request: NextRequest, mutation = false): Promise<{ role: AnalysisRole } | { response: NextResponse }> {
  const role = await analysisRoleFromRequest(request);
  if (!role) return { response: policyError(SIGN_IN_MESSAGE, 401, "unauthorized") };
  if (mutation && !isSameOriginMutation(request)) return { response: policyError("Open this workspace from the program before changing a case.", 403, "forbidden") };
  return { role };
}

/** Read and validate a JSON body; returns the parsed value or the error response. */
export async function policyBody<T>(request: NextRequest, maxBytes: number, schema: ZodType<T>, invalidMessage: string): Promise<{ value: T } | { response: NextResponse }> {
  const body = await readBoundedJson(request, maxBytes);
  if (!body.ok) return { response: policyError(body.message, body.status, "invalid") };
  const parsed = schema.safeParse(body.value);
  if (!parsed.success) return { response: policyError(invalidMessage, 400, "invalid") };
  return { value: parsed.data };
}

export function policyFailure(error: unknown) {
  if (error instanceof PolicyAnalysisError) return policyError(error.message, error.status, error.code);
  if (error instanceof ToolkitCaseError) {
    const mapped = error.code === "unavailable" ? new PolicyAnalysisError("storage_unavailable") : error.code === "not_found" ? new PolicyAnalysisError("not_found") : error.code === "conflict" ? new PolicyAnalysisError("conflict") : new PolicyAnalysisError("invalid");
    return policyError(mapped.message, mapped.status, mapped.code);
  }
  // Database, parser, validation and provider errors can contain private values. Never serialize or log them.
  return policyError("This operation could not be completed. Your saved case is unchanged.", 503, "failed");
}

const work = new Map<string, { active: number; attempts: number[] }>();
const LIMITS = { analysis: { active: 2, perTenMinutes: 20 }, fetch: { active: 2, perTenMinutes: 30 }, export: { active: 2, perTenMinutes: 60 } } as const;

/** In-memory guard for expensive work. Returns a release function, or null when at capacity. */
export function policyCapacity(name: keyof typeof LIMITS) {
  const limit = LIMITS[name];
  const current = work.get(name) ?? { active: 0, attempts: [] };
  current.attempts = current.attempts.filter(at => at > Date.now() - 600000);
  if (current.active >= limit.active || current.attempts.length >= limit.perTenMinutes) return null;
  current.active++; current.attempts.push(Date.now()); work.set(name, current);
  let released = false;
  return () => { if (!released) { released = true; current.active = Math.max(0, current.active - 1); } };
}

export const busyResponse = () => policyError("Several requests are being prepared. Please try again shortly.", 429, "busy");

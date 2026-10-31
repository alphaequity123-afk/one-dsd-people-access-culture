import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ownerFromRequest } from "@/lib/auth/request";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { ToolkitCaseError } from "./cases";
import { ToolkitServiceError } from "./service";

export const toolkitHeaders = { "cache-control": "private, no-store, max-age=0", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" };
export const toolkitJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: toolkitHeaders });
export async function toolkitAccess(request: NextRequest, mutation = false) {
  if (!(await ownerFromRequest(request))) return toolkitJson({ error: "Sign in to the Consultant Workspace to continue." }, 401);
  if (mutation && !isSameOriginMutation(request)) return toolkitJson({ error: "Open this workspace from the program before changing a case." }, 403);
  return null;
}
export function toolkitFailure(error: unknown) {
  if (error instanceof ToolkitCaseError || error instanceof ToolkitServiceError) return toolkitJson({ error: error.message, code: error.code }, error.status);
  // Database, parser, validation and provider errors can contain private values. Never serialize or log them.
  return toolkitJson({ error: "This operation could not be completed. Your saved case is unchanged." }, 503);
}

const work = new Map<string, { active: number; attempts: number[] }>();
export function toolkitCapacity(name: "analysis" | "upload") {
  const current = work.get(name) ?? { active: 0, attempts: [] };
  current.attempts = current.attempts.filter(at => at > Date.now() - 600000);
  if (current.active >= 2 || current.attempts.length >= 20) return null;
  current.active++; current.attempts.push(Date.now()); work.set(name, current);
  return () => { current.active = Math.max(0, current.active - 1); };
}

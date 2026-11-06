import "server-only";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { ownerFromCookies, ownerFromRequest } from "./request";
import { teamMemberFromCookies, teamMemberFromRequest } from "./team-request";

// The equity analysis tools are for the Equity and Inclusion Operations Consultant
// (the owner sign-in) and the One DSD Team (the team sign-in). Members can be named
// later; until then a decision is recorded by role.

export type AnalysisRole = "consultant" | "team";

/** The role behind a request, or null when neither sign-in is present. */
export async function analysisRoleFromRequest(request: NextRequest): Promise<AnalysisRole | null> {
  if (await ownerFromRequest(request)) return "consultant";
  if (await teamMemberFromRequest(request)) return "team";
  return null;
}

/** The role behind a server-rendered page, or null. */
export async function analysisRoleFromCookies(): Promise<AnalysisRole | null> {
  try {
    if (await ownerFromCookies()) return "consultant";
    if (await teamMemberFromCookies()) return "team";
  } catch { /* no cookies in this context */ }
  void cookies;
  return null;
}

export const ROLE_LABELS: Record<AnalysisRole, string> = {
  consultant: "Equity and Inclusion Operations Consultant",
  team: "One DSD Team",
};

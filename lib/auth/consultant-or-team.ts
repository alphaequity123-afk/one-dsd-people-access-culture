import "server-only";
import type { NextRequest } from "next/server";
import { ownerFromCookies, ownerFromRequest } from "./request";
import { teamMemberFromCookies, teamMemberFromRequest } from "./team-request";

// The equity analysis tools (the Equity Analysis Toolkit and the Equity Policy Analyzer) are
// for the Equity and Inclusion Operations Consultant and the One DSD Team.
//
// Owner decision, November 6, 2026: the Equity workspace opens without signing in. A visitor
// without a session works as the consultant, and decisions are recorded under that role. A team
// session, when team sign-in is reopened, is still recorded as the One DSD Team. Set
// EQUITY_WORKSPACE_OPEN to false to require a sign-in again.
export const EQUITY_WORKSPACE_OPEN: boolean = true;

export type AnalysisRole = "consultant" | "team";

/** The role behind a request, or null when a sign-in is required and absent. */
export async function analysisRoleFromRequest(request: NextRequest): Promise<AnalysisRole | null> {
  if (await ownerFromRequest(request)) return "consultant";
  if (await teamMemberFromRequest(request)) return "team";
  return EQUITY_WORKSPACE_OPEN ? "consultant" : null;
}

/** The role behind a server-rendered page, or null when a sign-in is required and absent. */
export async function analysisRoleFromCookies(): Promise<AnalysisRole | null> {
  try {
    if (await ownerFromCookies()) return "consultant";
    if (await teamMemberFromCookies()) return "team";
  } catch { /* no cookies in this context */ }
  return EQUITY_WORKSPACE_OPEN ? "consultant" : null;
}

export const ROLE_LABELS: Record<AnalysisRole, string> = {
  consultant: "Equity and Inclusion Operations Consultant",
  team: "One DSD Team",
};

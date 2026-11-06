import "server-only";
import { ownerFromCookies } from "@/lib/auth/request";
import { analysisRoleFromCookies } from "@/lib/auth/consultant-or-team";
import { runtimeDatabaseSsl, runtimeSql } from "./runtime-client";

export function ownerDatabaseAvailable(environment: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(environment.PAC_OWNER_DATABASE_URL?.trim());
}

/** Never use the general runtime credential to publish owner edits. */
export async function ownerDatabase() {
  if (!(await ownerFromCookies())) throw new Error("An active owner session is required.");
  const databaseUrl = process.env.PAC_OWNER_DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("Private owner editing is not configured.");
  const parsed = new URL(databaseUrl);
  if (decodeURIComponent(parsed.username).split(".")[0] !== "pac_dsd_owner_writer") throw new Error("Owner editing requires the dedicated writer role.");
  return runtimeSql({ databaseUrl, ssl: runtimeDatabaseSsl(databaseUrl, process.env.PAC_OWNER_DATABASE_SSL) });
}

/**
 * Case storage for the Equity workspace (the Equity Analysis Toolkit and the Equity Policy
 * Analyzer). It follows the workspace's own access rule in lib/auth/consultant-or-team.ts, which
 * by owner decision on November 6, 2026 is open without a sign-in. It uses the same dedicated
 * writer role, whose grants cover only what that role may change. Owner editing elsewhere keeps
 * ownerDatabase and its owner-session requirement.
 */
export async function equityCaseDatabase() {
  if (!(await analysisRoleFromCookies())) throw new Error("The Equity workspace requires a sign-in.");
  const databaseUrl = process.env.PAC_OWNER_DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("Private case storage is not configured.");
  const parsed = new URL(databaseUrl);
  if (decodeURIComponent(parsed.username).split(".")[0] !== "pac_dsd_owner_writer") throw new Error("Case storage requires the dedicated writer role.");
  return runtimeSql({ databaseUrl, ssl: runtimeDatabaseSsl(databaseUrl, process.env.PAC_OWNER_DATABASE_SSL) });
}

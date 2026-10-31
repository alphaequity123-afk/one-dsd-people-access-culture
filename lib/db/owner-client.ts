import "server-only";
import { ownerFromCookies } from "@/lib/auth/request";
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

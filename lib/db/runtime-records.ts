import "server-only";
import { runtimeDatabaseConfiguration, runtimeSql, type RuntimeSql } from "./runtime-client";

/**
 * Where the records that used to need the service's persistent volume are kept: the Ask pilot
 * ledger (lib/intelligence/clone/ledger.ts) and the owner's page edits
 * (lib/content/page-edits-store.ts). "volume" is today's behaviour and the default. "postgres"
 * keeps them in pac_dsd (db/standalone/0073_pac_dsd_volume_free_runtime_records.sql).
 */
export type RuntimeRecordsStore = "volume" | "postgres";

export function runtimeRecordsStore(environment: NodeJS.ProcessEnv = process.env): RuntimeRecordsStore {
  const configured = environment.PAC_RUNTIME_RECORDS?.trim().toLowerCase();
  if (!configured || configured === "volume") return "volume";
  if (configured === "postgres") return "postgres";
  throw new Error("PAC_RUNTIME_RECORDS must be volume or postgres.");
}

export function runtimeRecordsSql(environment: NodeJS.ProcessEnv = process.env): RuntimeSql {
  const configuration = runtimeDatabaseConfiguration(environment);
  if (!configuration) throw new Error("PAC_RUNTIME_RECORDS=postgres needs PAC_RUNTIME_DATABASE_URL.");
  return runtimeSql(configuration);
}

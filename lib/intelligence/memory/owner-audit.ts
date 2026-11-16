/**
 * The activity record keeps owner and contributor work only (owner rule 2026-11-16). Learning and Ask
 * activity is never stored or counted, so an event from a staff request is dropped before it reaches
 * any storage: the store calls `auditBelongsToOwnerWork` first and writes nothing when it is false.
 *
 * An event belongs to owner or contributor work when:
 *  - it runs inside `withOwnerWorkAudit` (the scheduled program cycle and the owner's own controls), or
 *  - its agent can only be run by the owner (no staff or leadership role in the agent's scope), or
 *  - it is a system event for an owner-only action (the One DSD team workspace edits by signed-in members).
 * Agents that staff can reach (Ask, community guidance, graduation coaching, embedding advice, intake,
 * the orchestrator answering a staff page) therefore never leave a record of a staff request.
 */
import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AGENTS } from "../registry/agents";
import type { AuditEvent } from "../types";
import { durableAuditContentIds } from "@/lib/trust/work-object-contract";

const ownerWork = new AsyncLocalStorage<true>();

/** Run owner or scheduled work whose steps belong in the owner's activity record. */
export function withOwnerWorkAudit<T>(work: () => Promise<T>): Promise<T> {
  return ownerWork.run(true, work);
}

const OWNER_ONLY_AGENTS = new Set<string>(
  AGENTS.filter(agent => !agent.scope.roles.some(role => role === "staff" || role === "leadership")).map(agent => agent.agent_id),
);

/** True only for owner or contributor work; every staff request is false, so nothing is written. */
export function auditBelongsToOwnerWork(event: AuditEvent): boolean {
  if (ownerWork.getStore()) return true;
  if (event.agent_id === "system") return event.permission_mode === "owner_only";
  return OWNER_ONLY_AGENTS.has(event.agent_id);
}

/** Local development storage for the owner's activity record. */
export async function appendOwnerAuditLine(root: string, event: AuditEvent): Promise<void> {
  await fs.mkdir(root, { recursive: true });
  await fs.appendFile(path.join(root, "audit.jsonl"), JSON.stringify(event) + "\n", "utf8");
}

/** Shared storage for the owner's activity record. */
export const OWNER_AUDIT_INSERT = `/* pac-runtime:append-audit */
    insert into pac_dsd.runtime_audit_events (event, occurred_at)
    values ($1::text::jsonb, $2::timestamptz)`;

/** The stored form keeps only the content identifiers the durable contract accepts. */
export function ownerAuditParameters(event: AuditEvent): [string, string] {
  const durable = { ...event, content_ids_touched: durableAuditContentIds(event.content_ids_touched) };
  return [JSON.stringify(durable), event.at];
}

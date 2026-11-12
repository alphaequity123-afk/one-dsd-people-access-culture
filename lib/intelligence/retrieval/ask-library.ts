import "server-only";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { indexedProgramResources } from "./program-resources";
import { indexedStaffDocs } from "./staff-search";

/**
 * The library Ask searches, kept in memory for a short time so each question does not
 * read it from the database again before the first word can be written.
 *
 * This is only for finding material. Every passage an answer cites is still checked
 * against the current publication, read fresh, before the citation is shown.
 */
function keepFor(): number {
  const set = process.env.PAC_ASK_LIBRARY_CACHE_MS;
  if (set !== undefined && set.trim() !== "" && Number.isFinite(Number(set)) && Number(set) >= 0) return Number(set);
  return process.env.NODE_ENV === "production" ? 30_000 : 0;
}

type Kept<T> = { at: number; value: Promise<T> };
const staff = new Map<string, Kept<Awaited<ReturnType<typeof indexedStaffDocs>>>>();
const program = new Map<string, Kept<Awaited<ReturnType<typeof indexedProgramResources>>>>();

function recent<T>(kept: Map<string, Kept<T>>, key: string, load: () => Promise<T>): Promise<T> {
  const limit = keepFor();
  if (!limit) return load();
  const held = kept.get(key);
  if (held && Date.now() - held.at < limit) return held.value;
  const entry: Kept<T> = { at: Date.now(), value: load() };
  kept.set(key, entry);
  // A failed read is never kept: the next question tries again.
  entry.value.catch(() => { if (kept.get(key) === entry) kept.delete(key); });
  return entry.value;
}

export function recentStaffDocs(scope: StaffProgramScope) {
  return recent(staff, scope, () => indexedStaffDocs(scope));
}

export function recentProgramResources(scope: StaffProgramScope) {
  return recent(program, scope, () => indexedProgramResources(scope));
}

/** For tests and for an editor's save: forget what is held so the next question reads the library again. */
export function forgetAskLibrary(): void {
  staff.clear();
  program.clear();
}

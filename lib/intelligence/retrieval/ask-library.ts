import "server-only";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { indexedProgramResources } from "./program-resources";
import { indexedStaffDocs } from "./staff-search";
import { onPublicationChange } from "@/lib/content/publication-events";

/**
 * The library Ask searches, kept in memory for a short time so each question does not
 * read it from the database again before the first word can be written.
 *
 * This is only for finding material. Every passage an answer cites is still checked
 * against the current publication, read fresh, before the citation is shown.
 *
 * A copy is used as it is for its keeping time (30 seconds in production). For a short
 * while after that it still answers at once while a newer copy is read in the background,
 * so a follow-up question never waits on the database. Older than that, it is read again first.
 */
function keepFor(): number {
  const set = process.env.PAC_ASK_LIBRARY_CACHE_MS;
  if (set !== undefined && set.trim() !== "" && Number.isFinite(Number(set)) && Number(set) >= 0) return Number(set);
  return process.env.NODE_ENV === "production" ? 30_000 : 0;
}

type Kept<T> = { at: number; value: Promise<T>; refreshing?: boolean; next?: Kept<T> };
type StaffDocs = Awaited<ReturnType<typeof indexedStaffDocs>>;
type ProgramResources = Awaited<ReturnType<typeof indexedProgramResources>>;
const staff = new Map<string, Kept<StaffDocs>>();
const program = new Map<string, Kept<ProgramResources>>();

/** A held copy may be used this many times its keeping time while a newer one is read in the background. */
const STALE_FACTOR = 4;

/**
 * Where a document is unchanged, keep the earlier object, so everything already worked out
 * from it (its search terms above all) stays ready instead of being worked out again.
 */
export function keepUnchanged<T extends { id: string; text: string }>(earlier: readonly T[], next: readonly T[]): T[] {
  const known = new Map(earlier.map(doc => [doc.id, doc]));
  const rest = (doc: T) => JSON.stringify({ ...doc, text: "" });
  return next.map(doc => {
    const before = known.get(doc.id);
    return before && before.text === doc.text && rest(before) === rest(doc) ? before : doc;
  });
}

function recent<T>(kept: Map<string, Kept<T>>, key: string, load: () => Promise<T>, carryOver: (earlier: T, next: T) => T): Promise<T> {
  const limit = keepFor();
  if (!limit) return load();
  const held = kept.get(key);
  const age = held ? Date.now() - held.at : Infinity;
  if (held && age < limit) return held.value;
  const reload = () => {
    const at = Date.now();
    const value = held ? Promise.all([held.value.catch(() => undefined), load()]).then(([earlier, next]) => earlier ? carryOver(earlier, next) : next) : load();
    return { at, value } satisfies Kept<T>;
  };
  // Recently held: answer from it now and read a newer copy in the background.
  if (held && age < limit * STALE_FACTOR) {
    if (!held.refreshing) {
      held.refreshing = true;
      const entry = reload();
      held.next = entry;
      entry.value.then(() => { if (kept.get(key) === held) kept.set(key, entry); }, () => { held.refreshing = false; held.next = undefined; });
    }
    return held.value;
  }
  const entry = reload();
  kept.set(key, entry);
  // A failed read is never kept: the next question tries again.
  entry.value.catch(() => { if (kept.get(key) === entry) kept.delete(key); });
  return entry.value;
}

export function recentStaffDocs(scope: StaffProgramScope) {
  return recent(staff, scope, () => indexedStaffDocs(scope), keepUnchanged);
}

export function recentProgramResources(scope: StaffProgramScope) {
  return recent(program, scope, () => indexedProgramResources(scope), carryOverProgram);
}

function carryOverProgram(earlier: ProgramResources, next: ProgramResources): ProgramResources {
  return { ...next, communityDocs: keepUnchanged(earlier.communityDocs, next.communityDocs), destinations: keepUnchanged(earlier.destinations, next.destinations) };
}

/** A copy read within this long counts as the current publication for checking citations. */
const CHECK_WITHIN_MS = 5000;

function current<T>(kept: Map<string, Kept<T>>, key: string, load: () => Promise<T>, carryOver: (earlier: T, next: T) => T): Promise<T> {
  if (!keepFor()) return load();
  const held = kept.get(key);
  const newest = held?.next ?? held;
  if (newest && Date.now() - newest.at < CHECK_WITHIN_MS) return newest.value;
  const at = Date.now();
  const value = held ? Promise.all([held.value.catch(() => undefined), load()]).then(([earlier, next]) => earlier ? carryOver(earlier, next) : next) : load();
  const entry: Kept<T> = { at, value };
  kept.set(key, entry);
  // A failed read is never kept, and the copy held before it stays in use for finding material.
  entry.value.catch(() => { if (kept.get(key) === entry) { if (held) kept.set(key, held); else kept.delete(key); } });
  return entry.value;
}

/**
 * The library as it is published now, for checking citations before they are shown.
 * Answers that finish within a few seconds of each other share one fresh read
 * instead of each reading the whole library again.
 */
export async function currentLibrary(scope: StaffProgramScope): Promise<{ staff: StaffDocs; program: ProgramResources }> {
  const [staffDocs, programResources] = await Promise.all([
    current(staff, scope, () => indexedStaffDocs(scope), keepUnchanged),
    current(program, scope, () => indexedProgramResources(scope), carryOverProgram),
  ]);
  return { staff: staffDocs, program: programResources };
}

/** For tests and for an editor's save: forget what is held so the next question reads the library again. */
export function forgetAskLibrary(): void {
  staff.clear();
  program.clear();
}

// A save on this server makes the next question read the library again.
onPublicationChange(forgetAskLibrary);

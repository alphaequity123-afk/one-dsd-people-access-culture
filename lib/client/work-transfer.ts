import { BROWSER_STORAGE_KEYS, isPrivateBrowserStorageKey } from "./storage-keys";

export const MAX_TRANSFER_BYTES = 5 * 1024 * 1024;
type WorkEntry = { key: string; value: string };
export type WorkTransfer = { format: "one-dhs-personal-work"; version: 1; entries: WorkEntry[] };
type Store = Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">;
const transferable = (key: string) => isPrivateBrowserStorageKey("local", key) && key !== BROWSER_STORAGE_KEYS.savedConsultationReferences;

export function exportWork(store: Store): WorkTransfer {
  const entries: WorkEntry[] = [];
  for (let index = 0; index < store.length; index++) {
    const key = store.key(index);
    if (!key || !transferable(key)) continue;
    const value = store.getItem(key);
    if (value !== null) entries.push({ key, value });
  }
  const transfer: WorkTransfer = { format: "one-dhs-personal-work", version: 1, entries };
  if (new TextEncoder().encode(JSON.stringify(transfer)).length > MAX_TRANSFER_BYTES) throw new Error("This collection is too large for a single transfer file.");
  return transfer;
}

export function parseWorkTransfer(text: string): WorkTransfer {
  if (new TextEncoder().encode(text).length > MAX_TRANSFER_BYTES) throw new Error("Choose a transfer file smaller than 5 MB.");
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("Choose a One DHS work transfer file.");
  const data = parsed as Partial<WorkTransfer>;
  if (data.format !== "one-dhs-personal-work" || data.version !== 1 || !Array.isArray(data.entries) || data.entries.length > 2000) throw new Error("Choose a supported One DHS work transfer file.");
  const keys = new Set<string>();
  for (const entry of data.entries) {
    if (!entry || typeof entry.key !== "string" || typeof entry.value !== "string" || !transferable(entry.key) || keys.has(entry.key)) throw new Error("The transfer file contains an unsupported or repeated item.");
    keys.add(entry.key);
  }
  return { format: "one-dhs-personal-work", version: 1, entries: data.entries };
}

/** Existing work wins. No network request or transfer of session/authentication data. */
export function importWork(store: Store, transfer: WorkTransfer) {
  const checked = parseWorkTransfer(JSON.stringify(transfer));
  const added: string[] = [];
  let kept = 0, identical = 0;
  try {
    for (const entry of checked.entries) {
      const current = store.getItem(entry.key);
      if (current !== null) {
        if (current === entry.value) identical++; else kept++;
        continue;
      }
      store.setItem(entry.key, entry.value);
      added.push(entry.key);
    }
  } catch {
    let undone = true;
    for (const key of added) {
      try { store.removeItem(key); } catch { undone = false; }
    }
    throw new Error(undone ? "This browser could not import the file. Existing work was kept; try again after making more browser storage available." : "The import stopped before it finished. Existing work was kept, but some new items may have been added. Keep the transfer file and try again.");
  }
  return { added: added.length, kept, identical };
}

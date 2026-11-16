import { describe, expect, it } from "vitest";
import { exportWork, importWork, parseWorkTransfer } from "./work-transfer";
import { BROWSER_STORAGE_KEYS as K } from "./storage-keys";

function store(entries: [string, string][] = []) {
  const data = new Map(entries);
  return {
    get length() { return data.size; },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
}

describe("personal work transfer", () => {
  it("moves registered work while excluding unrelated keys and access references", () => {
    const original = store([[K.reflections, "my reflection"], ["pac-course:example:lesson-one", "my note"], ["other-app", "private"], [K.savedConsultationReferences, "access-reference"], [K.askSession, "conversation"]]);
    const file = exportWork(original);
    expect(file.entries).toHaveLength(2);
    const destination = store();
    expect(importWork(destination, parseWorkTransfer(JSON.stringify(file))).added).toBe(2);
    expect(destination.getItem(K.reflections)).toBe("my reflection");
    expect(original.getItem(K.reflections)).toBe("my reflection");
  });
  it("never replaces existing work and can be repeated safely", () => {
    const file = exportWork(store([[K.reflections, "from old address"], [K.actionPlans, "plan"]]));
    const destination = store([[K.reflections, "newer notes"]]);
    expect(importWork(destination, file)).toEqual({ added: 1, kept: 1, identical: 0 });
    expect(importWork(destination, file)).toEqual({ added: 0, kept: 1, identical: 1 });
    expect(destination.getItem(K.reflections)).toBe("newer notes");
  });
  it("rejects duplicate and unregistered keys before writing", () => {
    const file = exportWork(store([[K.reflections, "notes"]]));
    expect(() => parseWorkTransfer(JSON.stringify({ ...file, entries: [...file.entries, ...file.entries] }))).toThrow();
    expect(() => parseWorkTransfer(JSON.stringify({ ...file, entries: [{ key: "__proto__", value: "bad" }] }))).toThrow();
    expect(() => parseWorkTransfer(JSON.stringify({ ...file, entries: [{ key: K.savedConsultationReferences, value: "credential" }] }))).toThrow();
  });
  it("undoes newly added items when storage fills, preserving existing work", () => {
    const destination = store([[K.reflections, "existing"]]);
    const originalSet = destination.setItem;
    destination.setItem = (key, value) => { if (key === K.myPath) throw new Error("quota"); originalSet(key, value); };
    const file = exportWork(store([[K.actionPlans, "new plan"], [K.myPath, "path"]]));
    expect(() => importWork(destination, file)).toThrow("Existing work was kept");
    expect(destination.getItem(K.actionPlans)).toBeNull();
    expect(destination.getItem(K.reflections)).toBe("existing");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const staffLoads = vi.fn(async () => [{ id: "doc-1" }]);
const programLoads = vi.fn(async () => ({ communityDocs: [], destinations: [] }));
vi.mock("./staff-search", () => ({ indexedStaffDocs: (...args: unknown[]) => staffLoads(...(args as [])) }));
vi.mock("./program-resources", () => ({ indexedProgramResources: (...args: unknown[]) => programLoads(...(args as [])) }));

import { currentLibrary, forgetAskLibrary, keepUnchanged, recentProgramResources, recentStaffDocs } from "./ask-library";

beforeEach(() => { forgetAskLibrary(); staffLoads.mockClear(); programLoads.mockClear(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("the library Ask searches", () => {
  it("reads fresh every time unless holding is turned on", async () => {
    await recentStaffDocs("dsd"); await recentStaffDocs("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(2);
  });
  it("holds the library for a short time, per program", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    await recentStaffDocs("dsd"); await recentStaffDocs("dsd"); await recentProgramResources("dsd"); await recentProgramResources("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(1);
    expect(programLoads).toHaveBeenCalledTimes(1);
    await recentStaffDocs("one-dhs");
    expect(staffLoads).toHaveBeenCalledTimes(2);
  });
  it("answers from a recent copy at once while a newer one is read, and uses the newer one next time", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    const first = await recentStaffDocs("dsd");
    vi.advanceTimersByTime(45_000);
    staffLoads.mockResolvedValueOnce([{ id: "doc-1" }, { id: "doc-2" }]);
    expect(await recentStaffDocs("dsd")).toBe(first);
    expect(await recentStaffDocs("dsd")).toBe(first);
    expect(staffLoads).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect((await recentStaffDocs("dsd")).map(doc => doc.id)).toEqual(["doc-1", "doc-2"]);
    expect(staffLoads).toHaveBeenCalledTimes(2);
  });
  it("reads again before answering when the held copy is old", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    await recentStaffDocs("dsd");
    vi.advanceTimersByTime(121_000);
    staffLoads.mockResolvedValueOnce([{ id: "doc-9" }]);
    expect((await recentStaffDocs("dsd")).map(doc => doc.id)).toEqual(["doc-9"]);
    expect(staffLoads).toHaveBeenCalledTimes(2);
  });
  it("keeps answering from the recent copy when a background read fails, and tries again", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    const first = await recentStaffDocs("dsd");
    vi.advanceTimersByTime(45_000);
    staffLoads.mockRejectedValueOnce(new Error("database unavailable"));
    expect(await recentStaffDocs("dsd")).toBe(first);
    await vi.advanceTimersByTimeAsync(1);
    expect(await recentStaffDocs("dsd")).toBe(first);
    expect(staffLoads).toHaveBeenCalledTimes(3);
  });
  it("keeps the earlier object for a document that has not changed", () => {
    const a = { id: "a", text: "Same words.", title: "A" }, b = { id: "b", text: "Old words.", title: "B" };
    const next = keepUnchanged([a, b], [{ id: "a", text: "Same words.", title: "A" }, { id: "b", text: "New words.", title: "B" }, { id: "c", text: "Added.", title: "C" }]);
    expect(next[0]).toBe(a);
    expect(next[1]).not.toBe(b);
    expect(next[1].text).toBe("New words.");
    expect(next.map(doc => doc.id)).toEqual(["a", "b", "c"]);
    expect(keepUnchanged([a], [{ id: "a", text: "Same words.", title: "Renamed" }])[0]).not.toBe(a);
  });
  it("shares one read between questions that arrive together", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    await Promise.all([recentStaffDocs("dsd"), recentStaffDocs("dsd"), recentStaffDocs("dsd")]);
    expect(staffLoads).toHaveBeenCalledTimes(1);
  });
  it("never holds a failed read", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    staffLoads.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(recentStaffDocs("dsd")).rejects.toThrow("database unavailable");
    await expect(recentStaffDocs("dsd")).resolves.toEqual([{ id: "doc-1" }]);
    expect(staffLoads).toHaveBeenCalledTimes(2);
  });
  it("forgets what it holds when asked", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    await recentStaffDocs("dsd"); forgetAskLibrary(); await recentStaffDocs("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(2);
  });
  it("reads the current publication fresh for checking citations when holding is off", async () => {
    await currentLibrary("dsd"); await currentLibrary("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(2);
    expect(programLoads).toHaveBeenCalledTimes(2);
  });
  it("shares one fresh read between answers that finish within a few seconds, then reads again", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    await recentStaffDocs("dsd");
    vi.advanceTimersByTime(20_000);
    await Promise.all([currentLibrary("dsd"), currentLibrary("dsd"), currentLibrary("dsd")]);
    expect(staffLoads).toHaveBeenCalledTimes(2);
    expect(programLoads).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3_000);
    await currentLibrary("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(2);
    // The fresh copy also serves the next question's search.
    await recentStaffDocs("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(6_000);
    await currentLibrary("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(3);
  });
  it("keeps the earlier copy for searching when a fresh read for checking fails", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    const first = await recentStaffDocs("dsd");
    vi.advanceTimersByTime(10_000);
    staffLoads.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(currentLibrary("dsd")).rejects.toThrow("database unavailable");
    expect(await recentStaffDocs("dsd")).toBe(first);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const staffLoads = vi.fn(async () => [{ id: "doc-1" }]);
const programLoads = vi.fn(async () => ({ communityDocs: [], destinations: [] }));
vi.mock("./staff-search", () => ({ indexedStaffDocs: (...args: unknown[]) => staffLoads(...(args as [])) }));
vi.mock("./program-resources", () => ({ indexedProgramResources: (...args: unknown[]) => programLoads(...(args as [])) }));

import { forgetAskLibrary, recentProgramResources, recentStaffDocs } from "./ask-library";

beforeEach(() => { forgetAskLibrary(); staffLoads.mockClear(); programLoads.mockClear(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("the library Ask searches", () => {
  it("reads fresh every time unless holding is turned on", async () => {
    await recentStaffDocs("dsd"); await recentStaffDocs("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(2);
  });
  it("holds the library for a short time, per program, then reads it again", async () => {
    vi.stubEnv("PAC_ASK_LIBRARY_CACHE_MS", "30000");
    await recentStaffDocs("dsd"); await recentStaffDocs("dsd"); await recentProgramResources("dsd"); await recentProgramResources("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(1);
    expect(programLoads).toHaveBeenCalledTimes(1);
    await recentStaffDocs("one-dhs");
    expect(staffLoads).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(30_001);
    await recentStaffDocs("dsd");
    expect(staffLoads).toHaveBeenCalledTimes(3);
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
});

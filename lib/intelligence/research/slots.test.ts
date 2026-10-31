import { describe, expect, it } from "vitest";
import { MAX_CONCURRENT_RESEARCH, withResearchSlot } from "./slots";

describe("withResearchSlot", () => {
  it("never runs more than the cap at once and finishes every call", async () => {
    let running = 0;
    let peak = 0;
    const results = await Promise.all(Array.from({ length: 10 }, (_, index) => withResearchSlot(async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise(resolve => setTimeout(resolve, 5));
      running--;
      return index;
    })));
    expect(peak).toBe(MAX_CONCURRENT_RESEARCH);
    expect(results).toEqual(Array.from({ length: 10 }, (_, index) => index));
  });

  it("releases its slot when a call fails", async () => {
    const failures = await Promise.allSettled(Array.from({ length: MAX_CONCURRENT_RESEARCH + 2 }, () => withResearchSlot(async () => { throw new Error("research_http_429"); })));
    expect(failures.every(result => result.status === "rejected")).toBe(true);
    await expect(withResearchSlot(async () => "free")).resolves.toBe("free");
  });
});

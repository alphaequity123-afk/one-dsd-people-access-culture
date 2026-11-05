import { describe, expect, it } from "vitest";
import * as plan from "./working-group-plan";

const text = JSON.stringify({ ...plan, LAW: { ...plan.LAW, url: "" } });

describe("working group plan", () => {
  it("states the charge as the law gives it", () => {
    expect(plan.CHARGE.membership).toHaveLength(9);
    expect(plan.CHARGE.duties).toHaveLength(7);
    expect(plan.CHARGE.meetings).toContain("August 1, 2026");
    expect(plan.CHARGE.report).toContain("September 1, 2027");
    expect(plan.CHARGE.scopeBoundary).toContain("December 15, 2028");
    expect(plan.LAW.url).toMatch(/^https:\/\/www\.revisor\.mn\.gov\//);
  });

  it("covers every duty in the topic plans and the meeting sequence", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) expect(plan.TOPICS.some(t => t.duty.includes(String(n))), `duty ${n}`).toBe(true);
    expect(plan.MEETINGS).toHaveLength(10);
    expect(plan.CHECKPOINTS[plan.CHECKPOINTS.length - 1].checkpoint).toContain("before September 1");
  });

  it("uses full names and no banned words", () => {
    expect(text).not.toMatch(/\b(DSD|DHS|AI|MCO|CM|EW|AC|ECS|PCG)\b|\btutor\b/);
  });

  it("links program support only to pages that exist", () => {
    for (const item of plan.PROGRAM_SUPPORT) expect(["/community-outreach/county-map", "/community-outreach/how-the-system-connects", "/minnesota-communities", "/learn/equity-toolkit", "/community-outreach/providers", "/equity-review"]).toContain(item.href);
  });
});

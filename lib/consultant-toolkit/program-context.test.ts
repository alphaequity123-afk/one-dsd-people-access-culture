import { describe, expect, it, vi } from "vitest";
import { toolkitRequestSchema } from "./schema";

const mocks = vi.hoisted(() => ({ published: vi.fn(), staff: vi.fn() }));
vi.mock("server-only", () => ({}));
const doc = { id: "published-1", title: "Accessible notices", href: "/library/accessible-notices", authority: "guidance", scope: "dsd", status: "approved", reviewDate: "2026-10-01", text: "Use accessible notices and verify language access.", evidenceRevisions: [{ sourceId: "surface-1", revisionId: "revision-1", payloadHash: "synthetic-hash", scope: "dsd" }] };
vi.mock("@/lib/intelligence/retrieval/program-resources", () => ({ indexedProgramResources: async (scope: string) => { mocks.published(scope); return { destinations: [doc] }; } }));
vi.mock("@/lib/intelligence/retrieval/staff-search", () => ({ indexedStaffDocs: async (scope: string) => { mocks.staff(scope); return []; } }));
vi.mock("@/lib/intelligence/retrieval/search", () => ({ searchDocs: (_query: string, docs: unknown[]) => docs }));
vi.mock("@/lib/intelligence/memory/organization", () => ({ organizationalDocs: () => [], organizationalMaintenance: () => ({ version: "synthetic-baseline", refreshDue: [{ id: "refresh-1" }] }) }));
vi.mock("@/lib/content/staff-publications", () => ({ staffProgramScope: () => "dsd" }));
import { toolkitProgramContext } from "./program-context";

describe("published program context", () => {
  it("uses scoped published sources, pins provenance and discloses collection limits", async () => {
    const request = toolkitRequestSchema.parse({ title: "Private work", question: "Review LTSS notices", track: "scan", goals: ["equity-goal-1"], sources: [{ id: "private-1", title: "Private draft", text: "Confidential planning proposal." }] });
    const result = await toolkitProgramContext(request);
    expect(mocks.published).toHaveBeenCalledWith("dsd"); expect(mocks.staff).toHaveBeenCalledWith("dsd");
    expect(result.sources[0]).toEqual(request.sources[0]); expect(request.sources).toHaveLength(1);
    const source = result.sources.find(value => value.title === "Accessible notices")!;
    expect(source.text).toContain("revision-1"); expect(source.text).toContain("synthetic-hash"); expect(source.text).toContain("/library/accessible-notices");
    expect(source.origin).toBe("application-context");
    expect(result.sources.some(value => value.text.includes("Goal 1: Eliminate Disparities"))).toBe(true);
    expect(result.sources.find(value => value.id === "program-ltss-demographics")?.text).toContain("No dashboard dataset was downloaded");
    expect(result.sources.find(value => value.id === "program-ltss-demographics")?.text).toContain("Application analysis guidance (not a quotation from the linked DHS page)");
    expect(result.note).toContain("not a verified inventory of every DHS program"); expect(result.note).toContain("need a current-source review");
  });
  it("does not exceed source limits or discard supplied evidence", async () => {
    const sources = Array.from({ length: 40 }, (_, index) => ({ id: `source-${index}`, title: `Source ${index}`, text: "Evidence" }));
    const request = toolkitRequestSchema.parse({ title: "Full source list", question: "Review policy", track: "scan", sources });
    const result = await toolkitProgramContext(request);
    expect(result.sources).toEqual(sources); expect(result.note).toContain("source limit prevented");
  });
  it("refreshes earlier application context without guessing user source origins from ids", async () => {
    const request = toolkitRequestSchema.parse({ title: "Revised work", question: "Review notices", track: "scan", sources: [
      { id: "program-uploaded-evidence", title: "User evidence", text: "Keep this evidence." },
      { id: "old-context", origin: "application-context", title: "Withdrawn reference", text: "Old withdrawn guidance." },
    ] });
    const result = await toolkitProgramContext(request);
    expect(result.sources.some(value => value.id === "old-context")).toBe(false);
    expect(result.sources[0]).toEqual(request.sources[0]);
    expect(result.note).toContain("1 previous application-context references were replaced");
  });
  it("marks excerpt truncation inside the supplied source text", async () => {
    const previous = doc.text;
    try {
      doc.text = "Long published source. ".repeat(1000);
      const request = toolkitRequestSchema.parse({ title: "Long source", question: "Review notices", track: "scan" });
      const result = await toolkitProgramContext(request);
      const source = result.sources.find(value => value.title === doc.title)!;
      expect(source.text).toContain("Source excerpt truncated"); expect(source.text.length).toBeLessThanOrEqual(8500);
    } finally { doc.text = previous; }
  });
});

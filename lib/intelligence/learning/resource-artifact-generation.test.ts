import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Doc } from "@/lib/intelligence/retrieval/search";
import { WATER_RESOURCE_COLLECTION_PATH, WATER_RESOURCE_COLLECTION_TITLE } from "@/lib/learning/water-resource-collection";
import {
  captureArtifactSourceRevision, generateResourceArtifact, searchArtifactResources, verifyArtifactSources,
} from "./resource-artifact-generation";

const fixtures = vi.hoisted(() => ({ docs: [] as Doc[], readScopes: [] as string[] }));
vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => "dsd" }));
vi.mock("@/lib/intelligence/retrieval/staff-search", () => ({
  indexedStaffDocs: async (scope: string) => { fixtures.readScopes.push(scope); return fixtures.docs; },
}));
vi.mock("@/lib/intelligence/retrieval/program-resources", () => ({
  indexedProgramResources: async () => ({ destinations: [] }),
}));
vi.mock("@/lib/intelligence/retrieval/published-resource-supplements", () => ({
  publishedResourceSupplements: async () => [],
}));

const accessibleNotice = "Send a clear appointment notice in advance. State the purpose and expected next step. Include a way to request a different format and let people confirm the appointment.";
function doc(overrides: Partial<Doc> = {}): Doc {
  return {
    id: "appointment-notices", title: "Accessible appointment notices", href: "/library/appointment-notices",
    kind: "content", status: "approved", type: "job_aid", authority: "guidance", scope: "agencywide",
    reviewDate: "", text: accessibleNotice, summary: accessibleNotice, tags: ["appointments"], intents: [], ...overrides,
  };
}

function envelope(sections: object[]) {
  return Response.json({ candidates: [{
    finishReason: "STOP", content: { parts: [{ text: JSON.stringify({
      grounded: true, title: "Accessible appointment notices", summary: "Write clear notices people can act on.", sections,
    }) }] },
  }] });
}

const quiz = Array.from({ length: 5 }, (_, index) => ({
  question: `What should a notice make clear? Example ${index + 1}`,
  options: ["The next step", "An internal routing code", "Every possible exception", "Unrelated notes"],
  correctIndex: 0,
  explanation: "The resource asks staff to explain the purpose and expected next step.",
  passageIds: ["1"],
}));
const signal = () => new AbortController().signal;

describe("resource artifact generation", () => {
  beforeEach(() => {
    fixtures.docs = [doc()];
    fixtures.readScopes = [];
  });
  afterEach(() => vi.unstubAllGlobals());

  it("creates a cited quiz using only the selected published resource", async () => {
    fixtures.docs.push(doc({ id: "another-source", title: "Other topic", href: "/library/another-source", text: "A separate published source must stay out of this task." }));
    const snapshot = await captureArtifactSourceRevision("/resources/appointment-notices", "one-dhs");
    expect(snapshot?.resourcePath).toBe("/library/appointment-notices");
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      const request = JSON.parse(String(init.body));
      expect(request.generationConfig.responseJsonSchema.properties.sections.items.properties.correctIndex.type).toBe("integer");
      expect(request.contents[0].parts[0].text).toContain(accessibleNotice);
      expect(request.contents[0].parts[0].text).not.toContain("separate published source");
      return envelope(quiz);
    });
    vi.stubGlobal("fetch", fetcher);
    const artifact = await generateResourceArtifact({
      resourcePath: "/resources/appointment-notices", kind: "quiz", scope: "one-dhs", expectedRevision: snapshot?.sourceRevision,
    }, "test-key", signal());
    expect(artifact.kind).toBe("quiz");
    expect(artifact.sections).toHaveLength(5);
    expect(artifact.sources.map(source => source.href)).toEqual(["/library/appointment-notices"]);
    expect(artifact.sections.every(section => section.sourceIds[0] === artifact.sources[0].id)).toBe(true);
    expect(fixtures.readScopes.every(scope => scope === "one-dhs")).toBe(true);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("rejects a revised source before contacting Gemini and withholds a withdrawn artifact", async () => {
    const snapshot = await captureArtifactSourceRevision("/library/appointment-notices", "dsd");
    const fetcher = vi.fn(async () => envelope(quiz));
    vi.stubGlobal("fetch", fetcher);
    fixtures.docs = [doc({ text: accessibleNotice + " Revised wording." })];
    await expect(generateResourceArtifact({
      resourcePath: "/library/appointment-notices", kind: "quiz", expectedRevision: snapshot?.sourceRevision, scope: "dsd",
    }, "test-key", signal())).rejects.toMatchObject({ code: "stale" });
    expect(fetcher).not.toHaveBeenCalled();
    const artifact = await generateResourceArtifact({ resourcePath: "/library/appointment-notices", kind: "quiz", scope: "dsd" }, "test-key", signal());
    fixtures.docs = [];
    expect(await verifyArtifactSources(artifact, "dsd")).toBe(false);
  });

  it("retries an invalid speaker order, then accepts a bounded alternating two-host script", async () => {
    const spoken = "A clear notice does more than announce an appointment. It tells people what they need to do, how to ask for another format, and what to expect when they respond to the office.";
    const turns = Array.from({ length: 4 }, (_, index) => ({ speaker: index % 2 ? "host2" : "host1", text: spoken, passageIds: ["1"] }));
    const fetcher = vi.fn().mockImplementationOnce(async () => envelope(turns.map(turn => ({ ...turn, speaker: "host1" }))))
      .mockImplementationOnce(async () => envelope(turns));
    vi.stubGlobal("fetch", fetcher);
    const artifact = await generateResourceArtifact({
      resourcePath: "/library/appointment-notices", kind: "audio-overview", scope: "dsd",
    }, "test-key", signal());
    if (artifact.kind !== "audio-overview") throw new Error("Expected audio overview");
    expect(artifact.sections.map(turn => turn.speaker)).toEqual(["host1", "host2", "host1", "host2"]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("groups fragments under a canonical catalog resource and returns only current graph links", async () => {
    fixtures.docs[0].graphRelated = ["/resources/confirmation", "/library/draft-only"];
    fixtures.docs.push(
      doc({ id: "appointment-section", title: "Read notices", href: "/resources/appointment-notices#read" }),
      doc({ id: "confirmation", title: "Appointment confirmation", href: "/library/confirmation" }),
      doc({ id: "draft-only", title: "Draft notice", href: "/library/draft-only", status: "under_review" }),
    );
    const result = await searchArtifactResources("appointment", 0, "dsd");
    expect(result.total).toBe(2);
    expect(result.resources.find(resource => resource.resourcePath === "/library/appointment-notices")).toMatchObject({
      title: "Accessible appointment notices", relatedCount: 1,
      related: [{ resourcePath: "/library/confirmation", title: "Appointment confirmation" }],
    });
  });

  it("balances the four current collection sources and requires the artifact to cite each family", async () => {
    fixtures.docs = [
      doc({ id: "essay", href: "/learn/water-we-swim-in/essay/minnesota-nice-decoded", title: "The Water We Swim In", text: "A meeting's silence may have several explanations. Ask a question before treating silence as agreement." }),
      doc({ id: "american", href: "/minnesota-communities/american/profile#profile-disability", title: "American Culture Brief", text: "Consider how public rules and community practices interact to shape access to services." }),
      doc({ id: "minnesota", href: "/minnesota-communities/minnesota/profile#profile-disability", title: "Minnesota Culture Brief", text: "Local service and transportation options differ across communities. Ask what an appointment requires in practice." }),
      doc({ id: "toolkit", href: "/learn/equity-toolkit", title: "Equity Analysis Toolkit companion", text: "Identify the decision, compare options, ask who could bear extra work, and set a time to review the outcome." }),
      doc({ id: "other", href: "/library/other", title: "Unrelated resource", text: "An unrelated source must never enter this collection." }),
    ].map(item => ({ ...item, summary: item.text }));
    const linked = quiz.map((section, index) => ({ ...section, passageIds: [String(index % 4 + 1)] }));
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      const request = JSON.parse(String(init.body));
      const data = JSON.parse(request.contents[0].parts[0].text);
      expect(data.excerpts).toHaveLength(4);
      expect(new Set(data.excerpts.map((item: { collectionFamily: string }) => item.collectionFamily)).size).toBe(4);
      expect(request.contents[0].parts[0].text).not.toContain("unrelated source");
      expect(request.systemInstruction.parts[0].text).toContain("12th-grade");
      expect(request.systemInstruction.parts[0].text).toContain("honest yet optimistic");
      return envelope(fetcher.mock.calls.length === 1 ? quiz : linked);
    });
    vi.stubGlobal("fetch", fetcher);
    const catalog = await searchArtifactResources(WATER_RESOURCE_COLLECTION_TITLE, 0, "dsd");
    expect(catalog.resources[0]).toMatchObject({ resourcePath: WATER_RESOURCE_COLLECTION_PATH, relatedCount: 4 });
    const artifact = await generateResourceArtifact({ resourcePath: WATER_RESOURCE_COLLECTION_PATH, kind: "quiz", scope: "dsd" }, "test-key", signal());
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(artifact.sources.map(item => item.href)).toEqual(fixtures.docs.slice(0, 4).map(item => item.href));
    fixtures.docs = fixtures.docs.filter(item => item.id !== "minnesota");
    expect(await verifyArtifactSources(artifact, "dsd")).toBe(false);
    expect(await captureArtifactSourceRevision(WATER_RESOURCE_COLLECTION_PATH, "dsd")).toBeNull();
  });
});

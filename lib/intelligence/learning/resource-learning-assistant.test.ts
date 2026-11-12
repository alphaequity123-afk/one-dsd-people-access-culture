import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { Doc } from "@/lib/intelligence/retrieval/search";
import { POST } from "@/app/api/learn/resources/route";
import { learningResourcePath, resourceStudyAvailability } from "./resource-learning-assistant";

const fixtures = vi.hoisted(() => ({
  staff: [] as Doc[],
  program: [] as Doc[],
  supplements: [] as Doc[],
  scope: "dsd",
  reads: vi.fn(),
}));

vi.mock("@/lib/product/request-context", () => ({ requestedContentScope: async () => fixtures.scope }));
vi.mock("@/lib/intelligence/retrieval/staff-search", () => ({
  indexedStaffDocs: async (scope: string) => { fixtures.reads(scope); return fixtures.staff; },
}));
vi.mock("@/lib/intelligence/retrieval/program-resources", () => ({
  indexedProgramResources: async () => ({ destinations: fixtures.program }),
}));
vi.mock("@/lib/intelligence/retrieval/published-resource-supplements", () => ({
  publishedResourceSupplements: async () => fixtures.supplements,
}));
vi.mock("@/lib/intelligence/orchestrator", () => ({ paused: async () => false }));

const origin = "https://pac.test";
const send = (question: string, resourcePath?: string, mode = "explain") => POST(new Request(origin + "/api/learn/resources", {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({ question, resourcePath, mode }),
}) as NextRequest);

function doc(overrides: Partial<Doc> = {}): Doc {
  return {
    id: "access-aid", title: "Accessible appointment notices", href: "/library/access-aid",
    text: "Use plain language and a clear callback option in appointment notices. Give recipients a way to request an accessible format.",
    summary: "Use plain language and a clear callback option in appointment notices.",
    kind: "content", authority: "guidance", type: "job_aid", status: "approved", reviewDate: "", scope: "agencywide",
    tags: ["notices"], intents: [], ...overrides,
  };
}

function fakeGemini(passageId: string, onRequest?: (payload: string) => void) {
  return vi.fn(async (_url: string, init: RequestInit) => {
    onRequest?.(String(init.body));
    return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({
      grounded: true,
      paragraphs: [{ text: "Give recipients a way to request an accessible format.", passageIds: [passageId] }],
    }) }] } }] });
  });
}

describe("published resource learning endpoint", () => {
  beforeEach(() => {
    fixtures.staff = [doc()];
    fixtures.program = [];
    fixtures.supplements = [];
    fixtures.reads.mockClear();
    fixtures.scope = "dsd";
    vi.stubEnv("GEMINI_API_KEY", "fixture-not-a-real-credential");
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("scopes to the published resource and PDF page, and screens contact, draft and private text before sending", async () => {
    const text = "Appointment notices offer accessible formats and direct confirmation.";
    const pdf = "/documents/access-aid.pdf#page=3";
    fixtures.supplements = [
      doc({ id: "pdf", title: "Notices — PDF page 3", type: "learning_pdf_page", href: pdf, graphRelated: ["/library/access-aid"], text, summary: text }),
      doc({ id: "personal", href: "/library/access-aid/contact", text: "Email: personal@example.invalid is the contact for appointment notices.", summary: "Email: personal@example.invalid is the contact for notices." }),
      doc({ id: "draft", href: "/library/access-aid/draft", status: "under_review", text: "Draft-only appointment notices sentence.", summary: "Draft-only appointment notices sentence." }),
      doc({ id: "private", href: "/consultant/private", type: "learning_reference_section", graphRelated: ["/library/access-aid"], text: "Hidden workspace appointment notices sentence.", summary: "Hidden workspace appointment notices sentence." }),
    ];
    fixtures.program = [doc({ id: "other", href: "/library/other", text: "Unrelated appointment notices sentence.", summary: "Unrelated appointment notices sentence." })];
    let matchingId = "";
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      const payload = String(init.body);
      expect(payload).not.toMatch(/personal@example|Draft-only|Hidden workspace|Unrelated/);
      const parsed = JSON.parse(payload);
      const request = JSON.parse(parsed.contents[0].parts[0].text);
      matchingId = request.excerpts.find((excerpt: { reading: string }) => excerpt.reading === "Notices — PDF page 3").id;
      return fakeGemini(matchingId)(_url, init);
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await send("What do the appointment notices say about accessible formats?", "/resources/access-aid");
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ grounded: true, sources: [{ href: pdf }] });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fixtures.reads.mock.calls).toEqual([["dsd"], ["dsd"]]);
  });

  it("withholds an answer when the published revision changes during generation", async () => {
    const fetcher = fakeGemini("1", () => {
      fixtures.staff = [doc({ evidenceRevisions: [{ sourceId: "access-aid", revisionId: null, scope: "agencywide", payloadHash: "a".repeat(64) }] })];
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await send("Explain the appointment notices.", "/library/access-aid");
    expect(result.status).toBe(409);
    expect(await result.json()).not.toHaveProperty("paragraphs");
  });

  it("uses the public directory summary while keeping the contact record out of Gemini", async () => {
    const summary = "This county office coordinates intake for local disability services and provides general program information.";
    const href = "/community-outreach/county-agencies#county-00000";
    fixtures.staff = [doc({
      id: "county-entry", type: "county_agency", title: "Example county agency", href, summary,
      text: summary + " For program information, call the named contact: Name Sample at 555-010-1000.",
    })];
    const fetcher = fakeGemini("1", payload => {
      expect(payload).toContain(summary);
      expect(payload).not.toMatch(/Name Sample|555-010-1000/);
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await send("What does the county office do for disability services?", "/community-outreach/county-agencies");
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ grounded: true, sources: [{ href }] });
  });

  it("rejects fabricated citation IDs", async () => {
    vi.stubGlobal("fetch", fakeGemini("999"));
    const result = await send("Explain the appointment notices.", "/library/access-aid");
    expect(result.status).toBe(502);
  });

  it("does not send identifying questions or questions about an unavailable selected resource", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const privateRequest = await send("Review the email address someone@example.invalid.");
    expect(privateRequest.status).toBe(400);
    expect(fixtures.reads).not.toHaveBeenCalled();
    const missing = await send("What does this resource say?", "/library/withdrawn-source");
    expect(missing.status).toBe(200);
    expect(await missing.json()).toMatchObject({ grounded: false, sources: [] });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("resolves player and podcast aliases using the app's active scope", async () => {
    fixtures.scope = "one-dhs";
    fixtures.program = [
      doc({ href: "/learn/equity-toolkit#podcast-equity-toolkit", title: "DHS equity policy and toolkit" }),
      doc({ id: "slide-course", href: "/learning/self-directed/index.html?course=F05", title: "F05 course" }),
    ];
    expect(await resourceStudyAvailability("/podcasts/equity-toolkit")).toEqual({ available: true, title: "DHS equity policy and toolkit" });
    expect(await resourceStudyAvailability("/library/self-directed-F05")).toEqual({ available: true, title: "F05 course" });
    expect(await resourceStudyAvailability("/%63onsultant/draft")).toEqual({ available: false });
    expect(learningResourcePath("//other.example/library/access-aid")).toBeUndefined();
    expect(fixtures.reads.mock.calls).toEqual([["one-dhs"], ["one-dhs"]]);
  });
});

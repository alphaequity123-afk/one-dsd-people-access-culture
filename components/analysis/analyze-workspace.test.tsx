// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResponse, AnalysisSource, Instrument } from "@/lib/analysis/contract";
import { ANALYSIS_NOTICE } from "@/lib/analysis/contract";

const fallbackInstruments = vi.hoisted((): Instrument[] => [
  "equity-analysis", "policy-review", "program-analysis", "engagement-plan", "plain-language", "working-group-plan",
].map((id, index) => ({
  id: id as Instrument["id"], title: `Method ${index + 1}: ${id.replace(/-/g, " ")}`, whatToUpload: `Upload material for ${id}.`, intro: `Intro for ${id}.`, basis: `Basis for ${id}.`,
  stages: [{ id: "stage-one", title: "Stage one", questions: [{ id: "q-one", prompt: "Who is affected?" }, { id: "q-two", prompt: "What does the material leave open?" }] }],
  guidance: [],
})));

vi.mock("@/lib/analysis/instruments", async importOriginal => {
  try { return await importOriginal<typeof import("@/lib/analysis/instruments")>(); } catch {
    return { INSTRUMENTS: fallbackInstruments, getInstrument: (id: string) => fallbackInstruments.find(item => item.id === id) };
  }
});
const sample: AnalysisSource = { id: "source-1", title: "Sample notice", text: "The notice is mailed to the person and the case manager." };
const untitled: AnalysisSource = { id: "source-2", title: "", text: "A second document with no title yet." };
vi.mock("@/components/analysis/source-intake", () => ({
  SourceIntake: ({ onChange }: { onChange: (sources: AnalysisSource[]) => void }) => <>
    <button type="button" onClick={() => onChange([sample])}>Add sample source</button>
    <button type="button" onClick={() => onChange([sample, untitled])}>Add untitled source</button>
  </>,
}));

import { INSTRUMENTS } from "@/lib/analysis/instruments";
import { AnalyzeWorkspace, BUSY_LINE, PRIVACY_LINE, UNAVAILABLE_REASON } from "./analyze-workspace";
import { AnalysisResult, analysisResultText } from "./analysis-result";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const BANNED = /\b(DSD|DHS|AI|HCBS)\b|\btutor\b/;
let root: Root;
const first = INSTRUMENTS[0];
const questionIds = first.stages.flatMap(stage => stage.questions.map(question => question.id));

function response(partial: Partial<AnalysisResponse> = {}): AnalysisResponse {
  return {
    instrumentId: first.id, summary: "A short summary of the material.", answers: [], limitations: [], nextSteps: [],
    counts: { evidence: 0, inference: 0, gap: 0 }, unavailable: false, notice: ANALYSIS_NOTICE, ...partial,
  };
}
const button = (name: string) => [...document.querySelectorAll("button")].find(item => item.textContent === name) as HTMLButtonElement;
async function mount(fetchImpl: typeof fetch) {
  vi.stubGlobal("fetch", fetchImpl);
  document.body.innerHTML = "<div id='root'></div>";
  root = createRoot(document.getElementById("root")!);
  await act(async () => { root.render(<AnalyzeWorkspace communities={[{ id: "hmong", title: "Hmong" }, { id: "native-american", title: "Native American" }]} />); });
}
async function analyze() {
  await act(async () => { button("Add sample source").click(); });
  await act(async () => { button("Analyze").click(); });
}

beforeEach(() => { localStorage.clear(); });
afterEach(() => { act(() => root?.unmount()); vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });

describe("Analyze a document workspace", () => {
  it("shows the six methods, the privacy line and the community select without native community pages", async () => {
    await mount(vi.fn());
    const text = document.body.textContent ?? "";
    for (const instrument of INSTRUMENTS) expect(text).toContain(instrument.title);
    expect(document.querySelectorAll("input[type=radio]")).toHaveLength(6);
    expect(text).toContain(PRIVACY_LINE);
    expect([...document.querySelectorAll("option")].map(option => option.textContent)).toEqual(["No particular community", "Hmong"]);
    expect(text).not.toMatch(BANNED);
  });

  it("groups the method radios under the step heading and ties each description to its radio", async () => {
    await mount(vi.fn());
    const group = document.querySelector("[role=radiogroup]");
    expect(group).not.toBeNull();
    const heading = document.getElementById(group!.getAttribute("aria-labelledby")!);
    expect(heading?.textContent).toBe("Choose what to analyze");
    for (const radio of document.querySelectorAll("input[type=radio]")) {
      const about = document.getElementById(radio.getAttribute("aria-describedby")!);
      expect(about?.textContent).toContain("Upload");
    }
    const status = document.querySelector("[role=status]");
    expect(status).not.toBeNull();
    expect(status?.textContent).toBe("");
    expect(document.querySelector("[aria-live]")?.textContent).toBe(INSTRUMENTS[0].intro);
  });

  it("asks for material before it sends anything", async () => {
    const fetchMock = vi.fn();
    await mount(fetchMock);
    await act(async () => { button("Analyze").click(); });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.querySelector("[role=alert]")?.textContent).toContain("at least one document");
    expect(document.querySelectorAll("[role=alert]")).toHaveLength(1);
  });

  it("names the source that needs a title in plain words, without sending anything", async () => {
    const fetchMock = vi.fn();
    await mount(fetchMock);
    await act(async () => { button("Add untitled source").click(); });
    await act(async () => { button("Analyze").click(); });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.querySelector("[role=alert]")?.textContent).toBe("Give source 2 a title.");
  });

  it("shows the worksheet when the site has not opened the answer service (403 with the staff lock code)", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ error: "This page does not accept or save staff submissions.", code: "staff_browse_download_only" }) })) as unknown as typeof fetch;
    await mount(fetchMock);
    await analyze();
    const text = document.body.textContent ?? "";
    expect(text).toContain("Worksheet");
    expect(text).toContain(UNAVAILABLE_REASON);
    expect(text).not.toContain("staff submissions");
    for (const stage of first.stages) for (const question of stage.questions) expect(text).toContain(question.prompt);
    expect(document.querySelector("[role=alert]")).toBeNull();
    expect(document.querySelector("[role=region][aria-label='Analysis result']")).not.toBeNull();
    expect(text).not.toMatch(BANNED);
  });

  it("shows the worksheet with the site's own reason while the service is paused (503)", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 503, json: async () => ({ error: "Analyze a document is paused for now. You can still browse resources." }) })) as unknown as typeof fetch;
    await mount(fetchMock);
    await analyze();
    const text = document.body.textContent ?? "";
    expect(text).toContain("Worksheet");
    expect(text).toContain("paused for now");
    expect(document.querySelector("[role=alert]")).toBeNull();
  });

  it("keeps a plain cross-origin or server error as an error, not a worksheet", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ error: "Please use Analyze a document from its page on this site." }) })) as unknown as typeof fetch;
    await mount(fetchMock);
    await analyze();
    expect(document.body.textContent).not.toContain("Worksheet");
    expect(document.querySelector("[role=alert]")?.textContent).toContain("from its page");
  });

  it("shows the worksheet with the reason when the answer service is unavailable", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => response({ unavailable: true, unavailableReason: "The answer service is not configured." }) })) as unknown as typeof fetch;
    await mount(fetchMock);
    await analyze();
    const body = JSON.parse((fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    expect(body).toEqual({ instrumentId: first.id, sources: [sample] });
    const text = document.body.textContent ?? "";
    expect(text).toContain("Worksheet");
    expect(text).toContain("The answer service is not configured.");
    for (const stage of first.stages) for (const question of stage.questions) expect(text).toContain(question.prompt);
    expect(text).toContain(ANALYSIS_NOTICE);
    expect(text).not.toContain(BUSY_LINE);
    expect(document.querySelector("[role=status]")?.textContent).toBe("");
    expect(text).not.toMatch(BANNED);
    expect(localStorage.length).toBe(0);
  });

  it("announces the busy line through a status control while the analysis runs", async () => {
    let release: (value: { ok: boolean; json: () => Promise<unknown> }) => void = () => undefined;
    const fetchMock = vi.fn(() => new Promise(resolve => { release = resolve; })) as unknown as typeof fetch;
    await mount(fetchMock);
    await act(async () => { button("Add sample source").click(); });
    await act(async () => { button("Analyze").click(); });
    expect(document.querySelector("[role=status]")?.textContent).toBe(BUSY_LINE);
    expect(button("Analyzing").disabled).toBe(true);
    await act(async () => { release({ ok: true, json: async () => response() }); });
    expect(document.querySelector("[role=status]")?.textContent).toBe("");
  });

  it("shows a refusal message and keeps the page usable", async () => {
    await mount(vi.fn(async () => ({ ok: true, json: async () => ({ refusal: true, message: "This material names a person." }) })) as unknown as typeof fetch);
    await analyze();
    expect(document.querySelector("[role=alert]")?.textContent).toBe("This material names a person.");
    expect(button("Analyze").disabled).toBe(false);
  });

  it("keeps the request and result in this browser only on request, and forgets them", async () => {
    const result = response({ answers: [{ questionId: questionIds[0], kind: "evidence", text: "The notice goes by mail.", citations: [{ sourceId: "source-1", excerpt: "The notice is mailed to the person" }] }], counts: { evidence: 1, inference: 0, gap: 0 } });
    await mount(vi.fn(async () => ({ ok: true, json: async () => result })) as unknown as typeof fetch);
    await analyze();
    expect(localStorage.length).toBe(0);
    await act(async () => { button("Keep in this browser").click(); });
    expect(localStorage.length).toBe(1);
    const stored = JSON.parse(localStorage.getItem("one-dsd-analyze-document-v1")!);
    expect(stored.request.sources[0].title).toBe("Sample notice");
    expect(stored.result.summary).toBe(result.summary);
    expect(document.body.textContent).toContain("kept in this browser only");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await act(async () => { button("Copy as text").click(); });
    expect(writeText.mock.calls[0][0]).toContain("Evidence: The notice goes by mail.");
    expect(writeText.mock.calls[0][0]).toContain("(Sample notice)");
    await act(async () => { button("Forget").click(); });
    expect(localStorage.length).toBe(0);
  });
});

describe("Analysis result", () => {
  it("renders kinds in words, quotations with the source title, next-step links and limitations", () => {
    const result = response({
      answers: [
        { questionId: questionIds[0], kind: "evidence", text: "The notice is mailed.", citations: [{ sourceId: "source-1", excerpt: "The notice is mailed to the person" }] },
        { questionId: questionIds[1] ?? "q-extra", kind: "gap", text: "The material does not say who follows up.", citations: [] },
      ],
      counts: { evidence: 1, inference: 0, gap: 1 },
      nextSteps: [{ questionId: questionIds[1] ?? "q-extra", label: "Plan an engagement", href: "/community-outreach/plan", why: "The material does not say how people affected were involved." }],
      limitations: ["Only one notice was supplied."],
    });
    const html = renderToStaticMarkup(<AnalysisResult result={result} instrument={first} sources={[sample]} />);
    expect(html).toContain("Evidence: 1");
    expect(html).toContain("Inference: 0");
    expect(html).toContain("Gap: 1");
    expect(html).toContain("quoted from the material");
    expect(html).toContain("From: Sample notice");
    expect(html).toContain("<blockquote>");
    expect(html).toContain('href="/community-outreach/plan"');
    expect(html).toContain("The material does not say how people affected were involved.");
    expect(html).toContain("Only one notice was supplied.");
    expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(BANNED);
    const text = analysisResultText(result, first, [sample]);
    expect(text).toContain("Gap: The material does not say who follows up.");
    expect(text).toContain("- Plan an engagement (/community-outreach/plan)");
  });
});

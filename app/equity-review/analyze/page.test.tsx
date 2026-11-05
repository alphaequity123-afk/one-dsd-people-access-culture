import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Instrument } from "@/lib/analysis/contract";

const fallbackInstruments = vi.hoisted((): Instrument[] => [
  "equity-analysis", "policy-review", "program-analysis", "engagement-plan", "plain-language", "working-group-plan",
].map((id, index) => ({
  id: id as Instrument["id"], title: `Method ${index + 1}: ${id.replace(/-/g, " ")}`, whatToUpload: `Upload material for ${id}.`, intro: `Intro for ${id}.`, basis: `Basis for ${id}.`,
  stages: [{ id: "stage-one", title: "Stage one", questions: [{ id: "q-one", prompt: "Who is affected?" }] }],
  guidance: [],
})));
vi.mock("@/lib/analysis/instruments", async importOriginal => {
  try { return await importOriginal<typeof import("@/lib/analysis/instruments")>(); } catch {
    return { INSTRUMENTS: fallbackInstruments, getInstrument: (id: string) => fallbackInstruments.find(item => item.id === id) };
  }
});
vi.mock("@/components/analysis/source-intake", () => ({ SourceIntake: () => <p>Source intake</p> }));
vi.mock("@/lib/content/community-design", () => ({
  communityDesignEntries: () => [{ id: "hmong", title: "Hmong" }, { id: "native-american", title: "Native American" }, { id: "tribal-nations", title: "Tribal Nations" }, { id: "alaska-native", title: "Alaska Native" }, { id: "somali", title: "Somali" }],
}));

import { INSTRUMENTS } from "@/lib/analysis/instruments";
import { PRIVACY_LINE } from "@/components/analysis/analyze-workspace";
import AnalyzeDocumentPage, { metadata } from "./page";

describe("Analyze a document page", () => {
  it("renders the title, the six methods, the privacy line and program links, without native community pages or banned words", () => {
    const html = renderToStaticMarkup(<AnalyzeDocumentPage />);
    const text = html.replace(/<[^>]+>/g, " ");
    expect(metadata.title).toBe("Analyze a document");
    expect(html).toContain("<h1");
    expect(text).toContain("Analyze a document");
    expect(INSTRUMENTS).toHaveLength(6);
    for (const instrument of INSTRUMENTS) expect(text).toContain(instrument.title);
    expect(text).toContain(PRIVACY_LINE);
    expect(text).toContain("How this works");
    for (const href of ["/equity-review", "/learn/equity-toolkit", "/community-outreach/plan", "/equity-review/working-group-plan"]) expect(html).toContain(`href="${href}"`);
    expect(html).toContain('<option value="hmong">Hmong</option>');
    expect(html).toContain('<option value="somali">Somali</option>');
    expect(html).not.toContain("native-american");
    expect(html).not.toContain("tribal-nations");
    expect(html).not.toContain("alaska-native");
    expect(text).not.toMatch(/\b(DSD|DHS|AI|HCBS)\b|\btutor\b/);
  });
});

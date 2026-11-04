import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { videoScenarioEvidenceHits } from "./video-transcript-evidence";
import { citationEvidenceFromDocs, validateEvidenceClaims } from "./evidence";
import { canonicalizeGeneratedEvidenceClaims } from "./generated-evidence";
import { publishedLeadershipVideoDocs } from "./public-learning-docs";
import { searchDocs, type Doc } from "./search";

const doc: Doc = {
  kind: "content", id: "leadership-video-democratic", title: "Democratic leadership: video transcript",
  href: "/learn/cultural-intelligence#leadership-style-democratic", authority: "learning", type: "leadership_video_transcript",
  status: "approved", reviewDate: "", scope: "dsd", summary: "Invite participation while maintaining accountability.",
  text: "Narrator: Democratic leadership invites participation.\n\nNarrator: These are examples, not assumptions.\n\nNarrator: Imagine a team in the Disability Services Division revising a meeting invitation. The invitation is only in English. The supervisor asks disabled people and partners what would support participation. The team provides accessible formats and language support.",
  tags: ["democratic", "leadership", "video"], intents: [],
};

describe("leadership video scenario evidence", () => {
  it("supplies an exact, current scenario passage to support a video example answer", () => {
    const question = "Using only this application, what example does the democratic leadership video give?";
    // A retrieval seed may carry only the style summary. Enrichment must supply
    // the actual scenario regardless of how keyword search selects its excerpt.
    const hits = searchDocs(question, [doc]).map(hit => ({ ...hit, excerpt: doc.summary }));
    const original = citationEvidenceFromDocs(hits, [doc])[0];
    expect(original.evidence!.excerpt.quote).toBe(doc.summary);
    const contextual = videoScenarioEvidenceHits(hits, [doc], question);
    const source = citationEvidenceFromDocs(contextual, [doc])[0];
    expect(source.evidence!.excerpt.quote).toContain("Imagine a team in the Disability Services Division");
    expect(source.evidence!.excerpt.quote).toContain("accessible formats and language support");
    const quote = source.evidence!.excerpt.quote;
    const claim = { kind: "source_excerpt", text: quote, references: [{ evidenceId: source.evidence!.evidenceId, start: 0, end: 1, quote }] };
    const canonical = canonicalizeGeneratedEvidenceClaims([claim], [source]);
    expect(validateEvidenceClaims(canonical, [source], [doc])).toHaveLength(1);
    const fabricated = { ...claim, text: "The video requires every meeting to be in English.", references: [{ ...claim.references[0], quote: "The video requires every meeting to be in English." }] };
    expect(() => canonicalizeGeneratedEvidenceClaims([fabricated], [source])).toThrow("generated_evidence_rejected");
    expect(() => validateEvidenceClaims(canonical, [source], [{ ...doc, text: doc.text + " Changed." }])).toThrow("generated_evidence_rejected");
    expect(() => validateEvidenceClaims(canonical, [source], [])).toThrow("generated_evidence_rejected");
  });

  it("does not retain scenario evidence if the public parent or media manifest is withdrawn", async () => {
    const text = doc.text;
    const hash = createHash("sha256").update(text).digest("hex");
    const prefix = "/learning/leadership-videos/";
    const video = "a".repeat(64) + ".mp4", captions = "b".repeat(64) + ".vtt", transcript = hash + ".txt";
    const manifest = { format: "leadership-video-v1", style: "democratic", video: prefix + video, captions: prefix + captions, transcript: prefix + transcript };
    let published = true;
    const read = async (name: string, method?: "GET" | "HEAD") => {
      if (name === "democratic.json" && published) return Response.json(manifest);
      if (method === "HEAD" && [video, captions].includes(name)) return new Response(null, { status: 200 });
      if (name === transcript) return new Response(text);
      return new Response(null, { status: 404 });
    };
    const surfaces = new Set(["learn.cultural-intelligence"]);
    const docs = await publishedLeadershipVideoDocs("dsd", surfaces, read);
    expect(docs).toHaveLength(1);
    const question = "What example does the democratic leadership video give?";
    const sources = citationEvidenceFromDocs(videoScenarioEvidenceHits(searchDocs(question, docs), docs, question), docs);
    const source = sources[0];
    const quote = source.evidence!.excerpt.quote;
    const claim = canonicalizeGeneratedEvidenceClaims([{ kind: "source_excerpt", text: quote, references: [{ evidenceId: source.evidence!.evidenceId, start: 0, end: 1, quote }] }], sources);
    expect(validateEvidenceClaims(claim, sources, docs)).toHaveLength(1);
    expect(await publishedLeadershipVideoDocs("dsd", new Set(), read)).toEqual([]);
    published = false;
    const withdrawn = await publishedLeadershipVideoDocs("dsd", surfaces, read);
    expect(withdrawn).toEqual([]);
    expect(() => validateEvidenceClaims(claim, sources, withdrawn)).toThrow("generated_evidence_rejected");
  });

  it("does not modify other document types or non-example questions", () => {
    const hits = searchDocs("democratic leadership", [doc]);
    expect(videoScenarioEvidenceHits(hits, [doc], "What is democratic leadership?")).toEqual(hits);
    expect(videoScenarioEvidenceHits(hits, [{ ...doc, type: "lesson" }], "Give an example")).toEqual(hits);
    expect(videoScenarioEvidenceHits(hits, [], "Give an example")).toEqual(hits);
  });
});

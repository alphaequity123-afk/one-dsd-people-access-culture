import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { publicCourseMediaDocs } from "./public-course-media-docs";
import { citationEvidenceFromDocs, validateEvidenceClaims } from "./evidence";
import { canonicalizeGeneratedEvidenceClaims } from "./generated-evidence";
import { searchDocs } from "./search";

describe("public course media retrieval", () => {
  it("indexes the completed podcast only for its currently published course", () => {
    const id = "ipe-18-cross-division-coordination";
    const docs = publicCourseMediaDocs("dsd", [{ id, lessons: [] }], new Set());
    expect(docs.length).toBeGreaterThan(1);
    expect(docs.every(doc => doc.href === `/courses/${id}`)).toBe(true);
    expect(docs.map(doc => doc.text).join(" ")).toContain("A plain-language version was drafted");
    expect(publicCourseMediaDocs("dsd", [], new Set())).toEqual([]);
    const hit = searchDocs("cross division coordination county notice plain language", docs)[0];
    expect(hit).toBeDefined();
    const source = citationEvidenceFromDocs([hit], docs)[0];
    const quote = source.evidence!.excerpt.quote;
    const claims = canonicalizeGeneratedEvidenceClaims([{ kind: "source_excerpt", text: quote, references: [{ evidenceId: source.evidence!.evidenceId, start: 0, end: 1, quote }] }], [source]);
    expect(validateEvidenceClaims(claims, [source], docs)).toHaveLength(1);
    expect(() => validateEvidenceClaims(claims, [source], [])).toThrow("generated_evidence_rejected");
  });

  it("projects only active player and published lesson discussion fields, never hidden or orphan media", () => {
    const base = path.join(process.cwd(), ".data"); mkdirSync(base, { recursive: true });
    const temp = mkdtempSync(path.join(base, "public-media-fixture-"));
    try {
      const folder = path.join(temp, "learning", "audio-discussions"); mkdirSync(folder, { recursive: true });
      const player = path.join(temp, "learning", "self-directed"); mkdirSync(path.join(player, "data"), { recursive: true });
      writeFileSync(path.join(player, "index.html"), `<script id="course-data" type="application/json">${JSON.stringify([{ number: "F23", dataFile: "data/F23-123456789abc.json" }])}</script>`);
      writeFileSync(path.join(player, "data", "F23-123456789abc.json"), JSON.stringify({ number: "F23", slides: [{ number: 1 }, { number: 2, hidden: true }] }));
      writeFileSync(path.join(folder, "index.json"), JSON.stringify({ F23: {}, F24: {}, "../../private": {} }));
      writeFileSync(path.join(folder, "F23.json"), JSON.stringify({ id: "F23", title: "Public evidence", before: "Visible introduction", turns: [{ text: "A visible public conversation" }], guidance: [{ afterSlide: 1, title: "Public guidance", text: "A visible instructional example" }, { afterSlide: 2, title: "Hidden slide sentinel", text: "Hidden slide text" }, { title: "Unplaced private sentinel", text: "Hidden unplaced text" }], ownerNotes: "Private owner sentinel" }));
      writeFileSync(path.join(folder, "F24.json"), JSON.stringify({ id: "F24", title: "Withdrawn course sentinel", turns: [{ text: "Unpublished player content" }] }));
      writeFileSync(path.join(folder, "gc-structural-racism.json"), JSON.stringify({ id: "gc-structural-racism", title: "Public anti-racism discussion", turns: [{ text: "Public discussion turn" }], guidance: [{ afterBlock: 0, title: "Public reflection", text: "Public reflection text" }, { title: "Private unplaced sentinel", text: "Hidden" }], ownerNotes: "Private owner sentinel" }));
      const courses = [{ id: "gc-structural-racism", lessons: [{ id: "gc-structural-racism-1", blockCount: 1, hasScenario: true }] }];
      const docs = publicCourseMediaDocs("dsd", courses, new Set(["F23"]), temp);
      expect(new Set(docs.map(doc => doc.href)).size).toBe(2);
      expect(docs.filter(doc => doc.href.endsWith("course=F23")).map(doc => doc.text).join(" ")).toContain("A visible instructional example");
      expect(docs.filter(doc => doc.href.includes("gc-structural-racism-1")).map(doc => doc.text).join(" ")).toContain("Public reflection text");
      expect(JSON.stringify(docs)).not.toMatch(/Private owner sentinel|Hidden unplaced|Hidden slide sentinel|Withdrawn course sentinel|Private unplaced/);
      expect(publicCourseMediaDocs("dsd", [], new Set(), temp)).toEqual([]);
      writeFileSync(path.join(folder, "index.json"), "{}");
      expect(publicCourseMediaDocs("dsd", [], new Set(["F23"]), temp)).toEqual([]);
    } finally {
      const resolved = realpathSync(temp), parent = realpathSync(base);
      if (!resolved.startsWith(parent + path.sep)) throw Error("Unsafe fixture cleanup");
      rmSync(resolved, { recursive: true, force: true });
    }
  });

  it("includes a lesson's visible practice dialogue only while its course and lesson are published", () => {
    const id = "working-with-an-interpreter", lesson = "wi-time";
    const docs = publicCourseMediaDocs("dsd", [{ id, lessons: [{ id: lesson, blockCount: 1, hasScenario: true }] }], new Set());
    expect(docs.some(doc => doc.href === `/courses/${id}/${lesson}` && doc.title.includes("practice conversation"))).toBe(true);
    expect(docs.map(doc => doc.text).join(" ")).toContain("Make room for each turn");
    expect(publicCourseMediaDocs("dsd", [{ id, lessons: [] }], new Set())).toEqual([]);
    expect(publicCourseMediaDocs("dsd", [], new Set())).toEqual([]);
  });

  it("indexes all four selected discussion records from the actual public player as citation-sized passages", () => {
    const ids = ["F23", "F24", "A21", "A22"];
    const docs = publicCourseMediaDocs("dsd", [], new Set(ids));
    expect(new Set(docs.map(doc => doc.href))).toEqual(new Set(ids.map(id => `/learning/self-directed/index.html?course=${id}`)));
    expect(docs.every(doc => doc.text.length <= 300 && doc.summary === doc.text)).toBe(true);
    expect(docs.filter(doc => doc.href.endsWith("course=F23")).map(doc => doc.text).join(" ")).toContain("Both routes recorded eight completions among ten enrolled people");
    expect(publicCourseMediaDocs("dsd", [], new Set(["F23"])).every(doc => doc.href.endsWith("course=F23"))).toBe(true);
  });
});

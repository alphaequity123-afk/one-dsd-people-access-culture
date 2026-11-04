import { describe, expect, it } from "vitest";
import { DIRECTOR_TEMPLATES, DIRECTOR_TOOLKIT_SECTIONS } from "@/lib/content/director-toolkit";
import { DIRECTOR_TOOLKIT_DOC_PREFIX, directorToolkitDocs } from "./director-toolkit-docs";
import { publicProjectionAuditId } from "./program-resources";
import { searchDocs } from "./search";

describe("Equity Director toolkit retrieval", () => {
  const docs = directorToolkitDocs("one-dhs");
  const id = (suffix: string) => `${DIRECTOR_TOOLKIT_DOC_PREFIX}${suffix}`;

  it("makes an overview, one document per section and one per template, each landing on its own anchor", () => {
    expect(docs).toHaveLength(1 + DIRECTOR_TOOLKIT_SECTIONS.length + DIRECTOR_TEMPLATES.length);
    expect(new Set(docs.map(doc => doc.id)).size).toBe(docs.length);
    expect(new Set(docs.map(doc => doc.href)).size).toBe(docs.length);
    for (const section of DIRECTOR_TOOLKIT_SECTIONS) expect(docs.find(doc => doc.id === id(`section-${section.id}`))?.href).toBe(`/equity-review/director-toolkit#${section.id}`);
    for (const template of DIRECTOR_TEMPLATES) expect(docs.find(doc => doc.id === id(`template-${template.id}`))?.href).toBe(`/equity-review/director-toolkit/templates#template-${template.id}`);
    for (const doc of docs) {
      expect(doc.authority).toBe("guidance");
      expect(doc.scope).toBe("agencywide");
      expect(doc.evidenceRevisions?.[0].payloadHash).toMatch(/^[a-f0-9]{64}$/);
      expect(publicProjectionAuditId(doc.id)).toMatch(/^asset-[a-f0-9]{32}$/);
    }
    expect(directorToolkitDocs("dsd").every(doc => doc.scope === "dsd")).toBe(true);
  });

  it("keeps the internal-only caution in the searchable text, with no status labels", () => {
    const data = docs.find(doc => doc.id === id("section-data-evaluation"))!;
    expect(data.text).toContain("Do not give PDFs or screenshots of it to external partners");
    const starter = docs.find(doc => doc.id === id("section-starter-package"))!;
    expect(starter.text).toContain("12. A small outcome scorecard.");
    expect(starter.text).toContain("1. Current DHS Equity Policy.");
    for (const doc of docs) expect(doc.text, doc.id).not.toMatch(/Existing DHS resource|ADSA guidance|Project recommendation/i);
  });

  it("lands plain questions on the right passage", () => {
    const top = (question: string) => searchDocs(question, docs, { limit: 3 }).map(hit => hit.id);
    expect(top("first 90 days plan for a new equity director")).toContain(id("section-first-90-days"));
    expect(top("budget equity worksheet who benefits from the expenditure")).toContain(id("template-budget-worksheet"));
    expect(top("Tribal consultation screening checklist")).toContain(id("template-tribal-screening"));
    expect(top("can I share screenshots of the person-level dashboard with partners")).toContain(id("section-data-evaluation"));
    expect(top("Language Block interpreter cards Limited English Proficiency Plan")).toContain(id("section-language-access"));
    expect(top("certified vendor directory Equity Select procurement")).toContain(id("section-procurement-grants"));
  });
});

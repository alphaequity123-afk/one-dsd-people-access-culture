import { describe, expect, it } from "vitest";
import { LEADERSHIP_SCENARIO_FAMILIES, LEADERSHIP_STYLE_LESSONS } from "@/lib/content/leadership-styles-pathway";
import { leadershipStylesPathwayDocs } from "./leadership-styles-pathway-docs";
import { publicProjectionAuditId } from "./program-resources";
import { searchDocs } from "./search";

describe("leadership styles pathway Ask documents", () => {
  const docs = leadershipStylesPathwayDocs("one-dhs");
  it("gives every passage its own id and its own anchored href", () => {
    expect(docs.length).toBe(4 + LEADERSHIP_STYLE_LESSONS.length * 4 + LEADERSHIP_SCENARIO_FAMILIES.length + 4 + 3);
    expect(new Set(docs.map(doc => doc.id)).size).toBe(docs.length);
    expect(new Set(docs.map(doc => doc.href)).size).toBe(docs.length);
    for (const doc of docs) {
      expect(doc.id.startsWith("leadership-")).toBe(true);
      expect(publicProjectionAuditId(doc.id)).toMatch(/^asset-[a-f0-9]{32}$/);
      expect(doc.href).toMatch(/^\/learn\/leadership-styles(?:\/[a-z-]+)?#[a-z-]+$/);
      expect(doc.text.length).toBeGreaterThan(100);
      expect(doc.evidenceRevisions?.[0]?.payloadHash).toMatch(/^[a-f0-9]{64}$/);
      expect(doc.graphRelated?.includes(doc.href.split("#")[0])).toBe(false);
    }
    expect(docs.map(doc => doc.href)).toContain("/learn/leadership-styles/servant#conflict");
    expect(docs.map(doc => doc.href)).toContain("/learn/leadership-styles/capstone#rubric");
  });
  it("lands a question on the matching passage", () => {
    const hit = (question: string) => searchDocs(question, docs, { limit: 3 })[0]?.href;
    expect(hit("How does laissez-faire leadership resolve a conflict between two colleagues who stop speaking?")).toBe("/learn/leadership-styles/laissez-faire#conflict");
    expect(hit("accommodation request phone-in meeting Deaf interpreter captions")).toBe("/learn/leadership-styles/scenarios#scenario-accessible-meetings");
    expect(hit("eight-point practice rubric for a leadership response")).toBe("/learn/leadership-styles/capstone#rubric");
  });
  it("keeps agencywide scope for One DHS and division scope for One DSD", () => {
    expect(new Set(docs.map(doc => doc.scope))).toEqual(new Set(["agencywide"]));
    expect(new Set(leadershipStylesPathwayDocs("dsd").map(doc => doc.scope))).toEqual(new Set(["dsd"]));
  });
});

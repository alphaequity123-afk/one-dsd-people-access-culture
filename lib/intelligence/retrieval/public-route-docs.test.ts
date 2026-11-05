import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { searchDocs } from "./search";
import { publicRouteDocs } from "./public-route-docs";

describe("public landing page retrieval", () => {
  it("keeps public summaries aligned with the actual pages and contains no unpublished course links", () => {
    const docs = publicRouteDocs("dsd");
    expect(docs).toHaveLength(12);
    for (const doc of docs) {
      const file = `app${doc.href}/page.tsx`;
      const page = readFileSync(file, "utf8");
      expect(page).toContain(doc.summary);
      for (const href of doc.graphRelated ?? []) expect(page).toContain(href);
      expect(doc.graphRelated?.some(href => href.startsWith("/courses/"))).toBe(false);
      expect(doc.evidenceRevisions?.[0].payloadHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("finds the referral boundary and does not imply One DSD supplies Tribal-specific training", () => {
    const docs = publicRouteDocs("dsd");
    const referral = searchDocs("Native American Tribal guidance office liaison", docs, { limit: 3 })
      .find(hit => hit.id === "public-route-tribal-referral");
    expect(referral).toBeDefined();
    const source = docs.find(doc => doc.id === referral?.id)!;
    expect(source.text).toContain("rather than providing its own training");
    expect(source.graphRelated).toContain("/support/right-person");
  });

  it("retains source and scope caveats rather than promoting summaries to agency policy", () => {
    const docs = publicRouteDocs("one-dhs");
    expect(docs.find(doc => doc.id === "public-route-understanding-dhs")?.text).toContain("original sources");
    expect(docs.find(doc => doc.id === "public-route-engagement-resources")?.text).toContain("does not make every example a requirement");
    expect(docs.every(doc => doc.scope === "agencywide")).toBe(true);
  });
});

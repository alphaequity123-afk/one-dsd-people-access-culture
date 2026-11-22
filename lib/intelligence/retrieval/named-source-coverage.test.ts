import { describe, expect, it } from "vitest";
import { communityProfileDocs, waterCollectionDoc, waterCourseDocs } from "./brain-content";
import { buildAnswerEvidenceReview } from "./answer-review";
import { citationEvidenceFromDocs, validateEvidenceClaims } from "./evidence";
import { resolveCitedStatements } from "./generated-evidence";
import { namedSourceCoverage, namedSourcePlan, uncitedNamedSources } from "./named-source-coverage";
import { projectPublicReadingPath } from "./public-source-paths";
import type { Doc } from "./search";

function doc(id: string, title: string, href: string, text: string, overrides: Partial<Doc> = {}): Doc {
  return { kind: "content", id, title, href, text, summary: "", authority: "learning", type: "reading",
    status: "approved", reviewDate: "", scope: "dsd", tags: [], intents: [], ...overrides };
}

const reference = doc("ext-dhs-equity-toolkit", "DHS Equity Analysis Toolkit", "/library/ext-dhs-equity-toolkit",
  "Confirm the current toolkit and any required process with the responsible DHS contact.", { authority: "external_verify", type: "external_reference" });
const companion = doc("companion", "Equity Analysis Toolkit", "/learn/equity-toolkit",
  "Compare accessible appointment response options. Record who faces barriers, the options tried and who will review the results.");
const unprojectedReadings = [
  ...waterCourseDocs("dsd"),
  ...communityProfileDocs("dsd", [
    doc("american", "Mainstream American culture", "/minnesota-communities/american", ""),
    doc("minnesota", "Mainstream Minnesota culture", "/minnesota-communities/minnesota", ""),
  ]),
  reference, companion,
];
const currentReadings = [...unprojectedReadings, waterCollectionDoc("dsd", unprojectedReadings)]
  .flatMap(reading => projectPublicReadingPath(reading, "dsd", true));
const synthesis = "Use The Water We Swim In, American Culture Brief, Minnesota Culture Brief, and DHS Equity Analysis Toolkit to draft a guide to accessible appointment notices in Minnesota.";

describe("Ask coverage of named published sources", () => {

  it("keeps a missing named brief visible and treats the official toolkit request as access only", () => {
    const docs = currentReadings.filter(reading => !reading.href.startsWith("/minnesota-communities/american/profile"));
    const question = "Compare the American Culture Brief and Minnesota Culture Brief to the original DHS Equity Analysis Toolkit.";
    const plan = namedSourcePlan(question, docs);
    const coverage = namedSourceCoverage(plan.groups, citationEvidenceFromDocs(plan.hits, docs, { question }));
    expect(coverage).toEqual([
      { title: "American Culture Brief", refs: [], limitation: expect.stringContaining("couldn't find a published passage") },
      { title: "Minnesota Culture Brief", refs: expect.arrayContaining(["S1"]) },
      { title: "DHS Equity Analysis Toolkit", refs: [], limitation: expect.stringContaining("current internal DHS version") },
    ]);
    expect(plan.hits.every(hit => hit.href.includes("/minnesota/profile"))).toBe(true);
    const companionOnly = namedSourcePlan("Use the DHS Equity Analysis Toolkit public companion for an appointment example.", [companion]);
    expect(companionOnly.hits.map(hit => hit.href)).toEqual([companion.href]);
  });

  it("finds other exact names and route aliases without treating scattered words as titles", () => {
    const root = doc("service-notice", "The Service Notice Guide", "/library/service-notice", "A short directory overview.");
    const page = doc("service-notice-pdf-page-2", "The Service Notice Guide page 2", "/materials/guide.pdf#page=2",
      "Check the appointment date, response choices and where residents can get help.", { type: "learning_pdf_page" });
    const other = doc("accessible-response", "Accessible Response Options", "/library/accessible-response", "List phone and online response choices.");
    const unpublished = doc("unpublished", "Private Workbook", "/library/private-workbook", "Draft content.", { status: "draft" });
    const docs = [root, page, other, unpublished];
    const plan = namedSourcePlan("Compare Service Notice Guide with /share/library/accessible-response for appointment response choices.", docs);
    expect(plan.groups.map(group => group.title)).toEqual([root.title, other.title]);
    expect(plan.hits.map(hit => hit.id)).toEqual([page.id, other.id]);
    expect(namedSourcePlan("What notice should guide this Minnesota service? How can people respond?", docs).groups).toEqual([]);
    expect(namedSourcePlan("Use Private Workbook", docs).groups).toEqual([]);
    expect(namedSourcePlan("What should a Minnesota community and an American office do about appointments?", currentReadings).groups).toEqual([]);
  });
});

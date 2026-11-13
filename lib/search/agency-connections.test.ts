import { expect, it } from "vitest";
import { agencyDocs } from "./site-search";
import { statePageDocs } from "./state-pages";

it("connects requested agencies to related published program material", () => {
  const docs = agencyDocs({ forAnswers: true });
  for (const id of ["administration-department-of", "labor-and-industry-department-of", "employment-and-economic-development-department", "minnesota-management-and-budget"]) {
    const doc = docs.find(item => item.id === `agency:${id}`);
    expect(doc, id).toBeTruthy();
    expect(doc!.graphRelated?.length, id).toBeGreaterThan(0);
    expect(doc!.graphRelated).not.toContain(doc!.href);
  }
});
it("connects substantive captured agency pages to their publisher and excludes access challenges", () => {
  const docs = statePageDocs();
  const labor = docs.filter(doc => doc.graphRelated?.includes("http://www.dli.mn.gov/"));
  expect(labor.length).toBeGreaterThan(0);
  expect(docs.every(doc => !/captcha|access denied|just a moment/i.test(doc.title))).toBe(true);
});

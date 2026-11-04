import { describe, expect, it } from "vitest";
import glossary from "@/lib/content/data/equity-glossary.json";
import { equityDataDocs } from "./equity-data-docs";

describe("equity data documents for Ask", () => {
  const docs = equityDataDocs("dsd");
  it("covers service access, income, vocational rehabilitation, statewide measures and the glossary", () => {
    const ids = docs.map(d => d.id);
    expect(ids).toContain("public-equity-data-service-access-adults-2024");
    expect(ids).toContain("public-equity-data-income-youth");
    expect(ids).toContain("public-equity-data-vocational-rehabilitation-outcomes");
    expect(ids).toContain("public-equity-data-statewide-people-earned-income");
    expect(ids).toContain("public-equity-data-glossary");
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("states real numbers from the source in plain words", () => {
    const adults2024 = docs.find(d => d.id === "public-equity-data-service-access-adults-2024")!;
    expect(adults2024.text).toContain("53,185 people");
    expect(adults2024.text).toMatch(/Employment Support Services, Group, fiscal year 2024: .*Black or African American: 81% less likely/);
    const exit = docs.find(d => d.id === "public-equity-data-vocational-rehabilitation-exit-income")!;
    expect(exit.text).toContain("$9,386");
  });
  it("never uses a short form outside the glossary document", () => {
    const shorts = glossary.terms.map(t => t.short).filter(s => /^[A-Z]{2,}/.test(s));
    for (const doc of docs.filter(d => d.id !== "public-equity-data-glossary")) {
      for (const s of shorts) expect(doc.text, `${doc.id} contains ${s}`).not.toMatch(new RegExp(`(^|[^A-Za-z])${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`));
    }
  });
  it("cites a dashboard page and carries evidence revisions", () => {
    for (const doc of docs) { expect(doc.href.startsWith("/data/equity-baseline")).toBe(true); expect(doc.evidenceRevisions?.length).toBe(1); }
  });
});

describe("per-year service documents", () => {
  it("gives each service and year its own document with the exact risk ratio", () => {
    const doc = equityDataDocs("dsd").find(d => d.id === "public-equity-data-service-adults-ess-group-2024")!;
    expect(doc.title).toContain("fiscal year 2024");
    expect(doc.text).toContain("Black or African American, fiscal year 2024: 125 people used Employment Support Services, Group. Risk ratio 0.19");
  });
});

describe("statewide summaries", () => {
  it("state the latest year's figures, so an answer can quote them", () => {
    const statewide = equityDataDocs("dsd").filter(d => d.id.startsWith("public-equity-data-statewide-"));
    expect(statewide.length).toBe(5);
    for (const doc of statewide) expect(doc.summary).toMatch(/In 2022: .*out of every 100|In 2022: .*\$/);
  });
});

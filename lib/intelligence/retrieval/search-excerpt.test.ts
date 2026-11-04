import { describe, expect, it } from "vitest";
import { searchExcerpt } from "./search";

const question = "In fiscal year 2024, how many Black or African American adults on a waiver used Employment Support Services, Group, and what was the risk ratio?";

describe("excerpt selection for line-structured data", () => {
  const title = "Employment Support Services, Group: who used it, age 22 to 64, fiscal year 2024";
  const text = [title,
    "In fiscal year 2024, 2,721 people on a disability waiver, age 22 to 64, used Employment Support Services, Group. Counts and risk ratios by race and ethnicity.",
    "American Indian or Alaska Native, fiscal year 2024: 48 people used Employment Support Services, Group. Risk ratio 0.68: 32% less likely than everyone else.",
    "Asian or Pacific Islander, fiscal year 2024: 48 people used Employment Support Services, Group. Risk ratio 0.46: 54% less likely than everyone else.",
    "Black or African American, fiscal year 2024: 125 people used Employment Support Services, Group. Risk ratio 0.19: 81% less likely than everyone else.",
    "Hispanic or Latino, fiscal year 2024: 51 people used Employment Support Services, Group. Risk ratio 0.66: 34% less likely than everyone else.",
    "White, fiscal year 2024: 2,412 people used Employment Support Services, Group. Risk ratio 3.85: 3.9 times as likely as everyone else.",
  ].join("\n");
  it("shows the line naming the requested group and year, not the first lines that share the title's words", () => {
    const excerpt = searchExcerpt(text, question, title);
    expect(excerpt).toContain("Black or African American, fiscal year 2024: 125 people used Employment Support Services, Group. Risk ratio 0.19");
    expect(searchExcerpt(text, "What was the risk ratio for White people using Employment Support Services, Group, in fiscal year 2024?", title))
      .toContain("White, fiscal year 2024: 2,412 people");
  });
  it("counts only the words that remain after the passage is cut at a sentence boundary", () => {
    const filler = "Background sentence about services. ".repeat(9);
    const body = `Opening. ${filler}Finding: the distinctive remedy is accessible invitations. ${"More background about services. ".repeat(12)}`;
    const excerpt = searchExcerpt(body, "distinctive remedy accessible invitations", "");
    expect(excerpt).toContain("distinctive remedy is accessible invitations");
  });
  it("keeps short text whole and the earliest passage when nothing distinguishes the candidates", () => {
    expect(searchExcerpt("A short note.", "note", "A short note")).toBe("A short note.");
    const plain = "First sentence of a long document. ".repeat(20);
    expect(searchExcerpt(plain, "unrelated words", "Title")).toMatch(/^First sentence/);
  });
});

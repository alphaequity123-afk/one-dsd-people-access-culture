import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseResearchMarkdown, researchPlainText } from "./research-markdown";

describe("parseResearchMarkdown", () => {
  it("reads paragraphs, lists, tables and content notes", () => {
    const blocks = parseResearchMarkdown("One\nline.\n\n- a\n- b\n\n1. first\n2. second\n\n| H1 | H2 |\n|---|---|\n| x | y |\n\n> **Content note:** Hard passage.");
    expect(blocks).toEqual([
      { type: "paragraph", text: "One line." },
      { type: "list", ordered: false, items: ["a", "b"] },
      { type: "list", ordered: true, items: ["first", "second"] },
      { type: "table", header: ["H1", "H2"], rows: [["x", "y"]] },
      { type: "note", text: "Hard passage." },
    ]);
  });

  it("reads a course scenario with its label, question and feedback", () => {
    const [block] = parseResearchMarkdown(":::scenario\nExample for discussion.\nA setup.\n? What do you do?\n- Wait. || It may help.\n:::");
    expect(block).toEqual({ type: "scenario", label: "Example for discussion.", blocks: [{ type: "paragraph", text: "A setup." }], question: "What do you do?", options: [{ choice: "Wait.", feedback: "It may help." }] });
  });

  it("drops addresses and markup from search text", () => {
    expect(researchPlainText("**Bold** and [a label](https://example.org/x) and https://example.org/y")).toBe("Bold and a label and");
  });
});

describe("imported Community 360 data", () => {
  const folder = path.join(process.cwd(), "lib", "content", "community-360");
  const files = readdirSync(folder);

  it("covers 39 communities and never a page under standing deference", () => {
    expect(files).toHaveLength(39);
    for (const id of ["native-american", "tribal-nations", "alaska-native"]) expect(files).not.toContain(`${id}.json`);
  });

  it("gives every community 14 sections and no research wording", () => {
    for (const file of files) {
      const raw = readFileSync(path.join(folder, file), "utf8");
      expect(JSON.parse(raw).sections, file).toHaveLength(14);
      expect(raw, file).not.toMatch(/opened source|\[\[PENDING/);
    }
  });

  it("marks an unconfirmed date as unconfirmed", () => {
    const { entries } = JSON.parse(readFileSync(path.join(process.cwd(), "lib", "content", "cultural-calendar.json"), "utf8")) as { entries: Array<{ dateCertainty: string; dates: Array<{ confirmed: boolean; date: string | null }> }> };
    expect(entries.length).toBeGreaterThan(500);
    expect(entries.flatMap(entry => entry.dates).some(date => !date.confirmed && date.date)).toBe(true);
  });
});

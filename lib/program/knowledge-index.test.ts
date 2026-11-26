import { expect, it } from "vitest";
import { knowledgeRows, learningPaths } from "./knowledge-index";

it("lists every course, guide, reading, policy reference and podcast once, with a tier and format", () => {
  const rows = knowledgeRows();
  expect(rows.length).toBeGreaterThan(1000);
  expect(new Set(rows.map(row => row[1])).size).toBe(rows.length);
  for (const [title, href, format, tier] of rows) {
    expect(title.length, href).toBeGreaterThan(0);
    expect(["course", "guide", "reading", "policy", "audio"]).toContain(format);
    expect(["start", "apply", "lead"]).toContain(tier);
  }
  expect(rows.some(row => row[2] === "audio")).toBe(true);
});

it("ties items to the five learning paths", () => {
  const paths = learningPaths();
  expect(paths.map(path => path.id)).toEqual(expect.arrayContaining(["access-and-communication", "perspectives-and-culture", "workplace-culture", "decisions-and-systems", "learning-and-leadership"]));
  for (const path of paths) expect(knowledgeRows().some(row => row[4].includes(path.id)), path.id).toBe(true);
});

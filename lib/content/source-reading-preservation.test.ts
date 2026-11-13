import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parseDocument } from "htmlparser2";
import { textContent, findAll } from "domutils";
import { expect, it } from "vitest";
import { EXTERNAL_READINGS } from "./external-readings";
import { readingSectionHtml, type ReadingBody } from "./external-reading-body";

it("preserves all licensed reading text and original section anchors when repairing navigation", () => {
  let sections = 0;
  for (const entry of EXTERNAL_READINGS) {
    const reading = JSON.parse(readFileSync(new URL(`../../data/source-readings/${entry.id}.json`, import.meta.url), "utf8")) as ReadingBody;
    for (const section of reading.sections ?? []) {
      const before = parseDocument(section.html);
      const after = parseDocument(readingSectionHtml(section.html, reading.title, false));
      expect(textContent(after), `${entry.id}: ${section.id} text`).toBe(textContent(before));
      const ids = (document: ReturnType<typeof parseDocument>) => findAll(node => Boolean(node.attribs.id), document.children).map(node => node.attribs.id).sort();
      expect(ids(after), `${entry.id}: ${section.id} anchors`).toEqual(ids(before));
      sections++;
    }
  }
  expect(sections).toBeGreaterThan(800);
});

it("the release verifier accepts preserved historical citations only after checking their effective navigation", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-source-readings.mjs"], { cwd: process.cwd(), encoding: "utf8", timeout: 30000 });
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("61 licensed readings");
  expect(result.stdout).toContain("827 sections");
});

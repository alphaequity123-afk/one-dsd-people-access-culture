/**
 * Program evals for the v2 rebuild (owner direction 2026-11-26). Each block states its definition of good, then
 * checks it against the real code and content. scripts/evals/program-evals.mjs runs this file and writes the report.
 */
import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

vi.mock("server-only", () => ({}));

import { PRIMARY_SECTIONS } from "@/lib/program/page-purpose";
import { ENGINES, SCOPES, programCatalog } from "@/lib/program/catalog";
import calendar from "@/lib/content/cultural-calendar.json";
import readings from "@/lib/content/reading-collection.json";
import { mergeRepeatedObservances, type CalendarEntry } from "@/lib/content/cultural-calendar";
import { tribalGate, askSafetyGates, askPrivacyGate } from "@/lib/intelligence/safety";
import { TRAINING_CREDIT_NOTICE } from "@/lib/program/learning-credit";

const root = process.cwd();
function files(dir: string, test: (file: string) => boolean, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) { if (name !== "node_modules") files(file, test, out); }
    else if (test(file)) out.push(file);
  }
  return out;
}
const source = [...files(path.join(root, "app"), f => /\.tsx$/.test(f) && !/\.test\./.test(f)), ...files(path.join(root, "components"), f => /\.tsx$/.test(f) && !/\.test\./.test(f))];

describe("Navigation: Home plus four pillars, Ask and Search on every page", () => {
  it("has exactly Practice, Leadership, Communities and Knowledge after Home", () => {
    expect(PRIMARY_SECTIONS.map(([label]) => label)).toEqual(["Practice", "Leadership", "Communities", "Knowledge"]);
    for (const [, href] of PRIMARY_SECTIONS) expect(existsSync(path.join(root, "app", href, "page.tsx")) || href === "/practice", href).toBe(true);
  });
  it("keeps About, the guide, support and the full charter on one page", () => {
    const about = readFileSync(path.join(root, "app/about/page.tsx"), "utf8");
    for (const id of ["how-to-use", "support", "charter", "stewardship"]) expect(about).toContain(`id="${id}"`);
  });
});

describe("Icons: none, except the paperclip on upload buttons", () => {
  // Data charts and maps draw with SVG; they show information, they are not icons.
  const CHART = /(chart|map|example|history|evidence)/i;
  const PAPERCLIP = "m8 12 7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3a2 2 0 0 1 3 3L5 17";
  it("draws no inline SVG outside charts and the paperclip", () => {
    const offenders = source.filter(file => !CHART.test(path.basename(file))).filter(file => {
      const text = readFileSync(file, "utf8");
      const svgs = text.match(/<svg[\s\S]*?<\/svg>/g) ?? [];
      return svgs.some(svg => !svg.includes(PAPERCLIP));
    }).map(file => path.relative(root, file));
    expect(offenders).toEqual([]);
  });
  it("installs no icon library", () => {
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(deps.filter(name => /lucide|heroicons|fontawesome|react-icons|phosphor|tabler-icons/.test(name))).toEqual([]);
  });
});

describe("Depth stays: nothing was removed by the rebuild", () => {
  it("keeps every calendar community entry inside the merged observances", () => {
    const entries = calendar.entries as CalendarEntry[];
    const merged = mergeRepeatedObservances(entries);
    expect(entries.length).toBe(569);
    expect(merged.flatMap(entry => entry.members ?? [entry]).length).toBe(569);
    expect(merged.length).toBeLessThan(entries.length);
  });
  it("keeps all 304 readings", () => { expect((readings as unknown[]).length).toBe(304); });
  it("indexes the whole collection in the program catalog", () => {
    const items = programCatalog();
    expect(items.length).toBeGreaterThan(1500);
    expect(items.filter(item => item.kind === "course").length).toBeGreaterThan(600);
    expect(items.filter(item => item.kind === "brief").length).toBeGreaterThanOrEqual(42);
  });
});

describe("Built to last: every item carries an engine, scope, tier and governance", () => {
  const items = programCatalog();
  it("gives every item one engine, at least one scope and a tier", () => {
    for (const item of items) {
      expect(ENGINES).toContain(item.engine);
      expect(item.scopes.length, item.id).toBeGreaterThan(0);
      for (const scope of item.scopes) expect(SCOPES).toContain(scope);
      expect(["start", "apply", "lead"]).toContain(item.tier);
    }
  });
  it("gives every item an owner, a steward and a review cycle, and never invents a review date", () => {
    for (const item of items) {
      expect(item.governance.owner.length, item.id).toBeGreaterThan(0);
      expect(item.governance.steward.length, item.id).toBeGreaterThan(0);
      expect(item.governance.reviewCycleMonths).toBeGreaterThan(0);
      if (item.governance.lastVerified) expect(item.governance.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("uses each id once, and each engine has content", () => {
    expect(new Set(items.map(item => item.id)).size).toBe(items.length);
    for (const engine of ENGINES) expect(items.some(item => item.engine === engine), engine).toBe(true);
  });
  it("gives People and Growth real mentoring, career and team content", () => {
    const growth = items.filter(item => item.engine === "people-growth").map(item => item.title.toLowerCase()).join(" | ");
    for (const word of ["mentor", "career", "team", "coaching", "onboarding"]) expect(growth).toContain(word);
  });
  it("links every catalog item to a page that exists", () => {
    const missing = items.filter(item => item.href.startsWith("/") && !item.href.startsWith("/r/")).filter(item => {
      const first = item.href.split(/[?#]/)[0].split("/").filter(Boolean)[0];
      return first && !existsSync(path.join(root, "app", first)) && !existsSync(path.join(root, "public", first));
    }).map(item => item.href);
    expect(missing).toEqual([]);
  });
});

describe("Voluntary and non-credit", () => {
  it("says plainly that the program offers no training credit", () => {
    expect(TRAINING_CREDIT_NOTICE).toMatch(/does not offer training credits/);
    expect(readFileSync(path.join(root, "app/knowledge/page.tsx"), "utf8")).toMatch(/not tracked, scored or counted toward training credit|nothing is tracked, scored or counted toward training credit/);
  });
});

describe("Compliance handoffs: Tribal, HR and private details go to the right place", () => {
  it("sends Tribal consultation questions to the Office of Indian Policy or a Tribal liaison", () => {
    const result = tribalGate("We want to plan engagement with Red Lake Nation about a waiver change");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Office of Indian Policy|Tribal liaison/);
  });
  it("sends a complaint about a named person to Human Resources, not into Ask", () => {
    const result = askSafetyGates("Maria Lopez filed a grievance against her supervisor and I need help with the investigation");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("hr_complaint_redirect");
  });
  it("keeps a named person's accommodation details out of Ask", () => {
    expect(askPrivacyGate("Ms. Lopez has an accommodation request pending").ok).toBe(false);
  });
  it("still answers a general, educational question", () => {
    expect(askSafetyGates("What is a reasonable accommodation?").ok).toBe(true);
  });
});

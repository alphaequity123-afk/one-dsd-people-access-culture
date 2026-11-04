import "server-only";
import { createHash } from "node:crypto";
import equity from "@/lib/content/data/equity-fy22-24.json";
import ltss from "@/lib/content/data/ltss-statewide.json";
import glossary from "@/lib/content/data/equity-glossary.json";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { Doc } from "./search";

// Aggregate public equity data as Ask documents. Every label is the full official
// name (owner rule: no acronyms). Each document cites the dashboard page it comes from;
// the statewide measures have no page of their own and cite the dashboard home.
const BASE = "/data/equity-baseline";
const RACES = equity.races as Record<string, string>;
type Ratios = Record<string, number | null>;
const race = (id: string) => RACES[id] ?? id;
const pct = (n: number | null, d: number | null) => n != null && d ? `${Math.round((n / d) * 100)} out of every 100` : null;
const rr = (v: number | null) => v == null ? "not shown (too few people to count)" : v >= 0.95 && v <= 1.05 ? "about the same as everyone else" : v < 1 ? `${Math.round((1 - v) * 100)}% less likely than everyone else` : `${v.toFixed(1)} times as likely as everyone else`;

type Page = { id: string; href: string; title: string; summary: string; text: string; tags: string[] };

function serviceAccessPages(): Page[] {
  const pages: Page[] = [];
  for (const [key, block] of Object.entries(equity.serviceAccess) as [string, typeof equity.serviceAccess.adults][]) {
    const ages = key === "youth" ? "age 14 to 21" : "age 22 to 64";
    for (const year of [2022, 2023, 2024]) {
      const lines: string[] = [];
      for (const service of block.services) {
        if (service.short === "Waiver") continue;
        const parts = block.rows.filter(r => r.year === year && r.race !== "all" && (r.riskRatios as Ratios)[service.short] != null)
          .map(r => `${race(r.race)}: ${rr((r.riskRatios as Ratios)[service.short])}`);
        if (parts.length) lines.push(`${service.full}, fiscal year ${year}: ${parts.join("; ")}.`);
      }
      const total = block.rows.find(r => r.year === year && r.race === "all");
      const shares = block.rows.filter(r => r.year === year && r.race !== "all").map(r => `${race(r.race)} ${pct(r.counts.Waiver, total?.counts.Waiver ?? null)}`);
      // One line per group names the services it was least and most likely to use that
      // year, so a question comparing services for one group is answered in one passage.
      const groups = block.rows.filter(r => r.year === year && r.race !== "all").flatMap(r => {
        const ratios = block.services.filter(s => s.short !== "Waiver" && (r.riskRatios as Ratios)[s.short] != null).map(s => ({ full: s.full, ratio: (r.riskRatios as Ratios)[s.short]! }));
        if (!ratios.length) return [];
        const lowest = ratios.reduce((a, b) => b.ratio < a.ratio ? b : a);
        const highest = ratios.reduce((a, b) => b.ratio > a.ratio ? b : a);
        if (ratios.length === 1) return [`${race(r.race)}, fiscal year ${year}: ${lowest.full} is the only service with enough people to compare (risk ratio ${lowest.ratio.toFixed(2)}: ${rr(lowest.ratio)}).`];
        return [`${race(r.race)}, fiscal year ${year}: compared with everyone else, least likely to use ${lowest.full} (risk ratio ${lowest.ratio.toFixed(2)}) and most likely to use ${highest.full} (risk ratio ${highest.ratio.toFixed(2)}).`];
      });
      pages.push({
        id: `service-access-${key}-${year}`, href: `${BASE}/goal/1`,
        title: `Employment service access for people on disability waivers, ${ages}, fiscal year ${year}`,
        summary: `Who received each employment service in fiscal year ${year}, by race and ethnicity, compared with their share of all people on a waiver.`,
        text: [`People on a disability waiver, ${ages}, fiscal year ${year}: ${total?.counts.Waiver?.toLocaleString() ?? "unknown"} people. Share by race and ethnicity: ${shares.join("; ")}.`, ...lines, ...groups].join("\n"),
        tags: ["equity data", "employment services", "disability waiver", ages, String(year)],
      });
    }
  }
  return pages;
}

function servicePages(): Page[] {
  const pages: Page[] = [];
  for (const [key, block] of Object.entries(equity.serviceAccess) as [string, typeof equity.serviceAccess.adults][]) {
    const ages = key === "youth" ? "age 14 to 21" : "age 22 to 64";
    for (const service of block.services) {
      if (service.short === "Waiver" || service.short === "EDS") continue;
      // One document per service per year, so every retrieved passage carries its own year and numbers.
      for (const year of [2022, 2023, 2024]) {
        const total = block.rows.find(r => r.year === year && r.race === "all");
        const used = (total?.counts as Ratios)[service.short];
        if (used == null) continue;
        const lines = block.rows.filter(r => r.year === year && r.race !== "all").map(r => {
          const n = (r.counts as Ratios)[service.short]; const ratio = (r.riskRatios as Ratios)[service.short];
          const count = n == null ? "fewer than 6 people (not shown)" : `${n.toLocaleString()} people`;
          return `${race(r.race)}, fiscal year ${year}: ${count} used ${service.full}.${ratio == null ? "" : ` Risk ratio ${ratio.toFixed(2)}: ${rr(ratio)}.`}`;
        });
        pages.push({
          id: `service-${key}-${service.short.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}-${year}`, href: `${BASE}/goal/1`,
          title: `${service.full}: who used it, ${ages}, fiscal year ${year}`,
          summary: `In fiscal year ${year}, ${used.toLocaleString()} people on a disability waiver, ${ages}, used ${service.full}. Counts and risk ratios by race and ethnicity.`,
          text: lines.join("\n"), tags: ["equity data", service.full, "employment services", "disability waiver", ages, String(year)],
        });
      }
    }
  }
  return pages;
}

function incomePages(): Page[] {
  const pages: Page[] = [];
  for (const [key, block] of Object.entries(equity.income) as [string, typeof equity.income.adults][]) {
    const ages = key === "youth" ? "age 14 to 21" : "age 22 to 64";
    const lines = block.rows.filter(r => r.race !== "all").map(r =>
      `Fiscal year ${r.year}, ${race(r.race)} (${r.total?.toLocaleString()} people): ${r.counts["No income"]?.toLocaleString()} had no reported income (${pct(r.counts["No income"], r.total)}); ${r.counts["$1-$599"]?.toLocaleString()} earned $1 to $599 a month (${pct(r.counts["$1-$599"], r.total)}); ${r.counts["$600+"]?.toLocaleString()} earned $600 or more a month (${pct(r.counts["$600+"], r.total)}).`);
    pages.push({
      id: `income-${key}`, href: `${BASE}/goal/1`,
      title: `Monthly reported income for people on disability waivers, ${ages}, fiscal years 2022 to 2024`,
      summary: `How many people had no income, $1 to $599 a month, or $600 or more a month, by race and ethnicity.`,
      text: lines.join("\n"), tags: ["equity data", "income", "earnings", "disability waiver", ages],
    });
  }
  return pages;
}

function vocationalRehabilitationPages(): Page[] {
  const o = equity.vocationalRehabilitationOutcomes.rows;
  const lines = o.filter(r => r.race !== "all" && r.percent != null).map(r =>
    `Fiscal year ${r.year}, ${race(r.race)}, ${r.group === "all" ? "everyone" : r.group === "waiver" ? "people on a waiver" : "people not on a waiver"}: ${Math.round(r.percent!)} out of every 100 who left Vocational Rehabilitation Services or State Services for the Blind had a job at exit (${r.employed} of ${r.exits}).`);
  const income = equity.vocationalRehabilitationExitIncome.rows.map(r =>
    `${race(r.race)}: people on a waiver earned $${r.waiver?.toLocaleString()} in the first year after leaving; people not on a waiver earned $${r.nonWaiver?.toLocaleString()}.`);
  // The summary carries the overall figures: a general question is answered by the passage shown first.
  const everyone = equity.vocationalRehabilitationExitIncome.rows.find(r => r.race === "all");
  return [
    { id: "vocational-rehabilitation-outcomes", href: `${BASE}/goal/1`, title: "Successful employment when leaving Vocational Rehabilitation Services or State Services for the Blind, age 22 to 64, fiscal years 2022 to 2024",
      summary: "Share of people who had a job when they left Vocational Rehabilitation Services or State Services for the Blind, by race and ethnicity, with and without a disability waiver.", text: lines.join("\n"), tags: ["equity data", "Vocational Rehabilitation Services", "State Services for the Blind", "employment outcomes"] },
    { id: "vocational-rehabilitation-exit-income", href: `${BASE}/goal/1`, title: "Average yearly income in the first year after leaving Vocational Rehabilitation Services or State Services for the Blind, age 22 to 64, fiscal years 2022 and 2023 combined",
      summary: `First-year earnings after exit for all people: $${everyone?.waiver?.toLocaleString()} on average for people on a waiver and $${everyone?.nonWaiver?.toLocaleString()} for people not on a waiver. Figures by race and ethnicity follow.`, text: income.join("\n"), tags: ["equity data", "earnings", "Vocational Rehabilitation Services"] },
  ];
}

function statewidePages(): Page[] {
  const perf = ltss.performance as Record<string, { columns: string[]; rows: { year: number; population: string; race: string; values: (number | string | null)[] }[] }>;
  const defs: [string, string, string, string][] = [
    ["People At Home", "Total Waiver Population", "People on a disability waiver who live at home instead of in a residential setting", "lived at home (did not use a residential service such as a group home)"],
    ["People Earned Income", "Total Waiver Population", "Working-age people on a disability waiver with earned income", "had income from wages or self-employment"],
    ["Earn$600+_Public", "Total Waiver Population", "People on a disability waiver earning $600 or more a month", "earned $600 or more a month"],
    ["People receiving HCBS", "Total LTSS Population", "People receiving Long-Term Services and Supports who get them as Home and Community-Based Services", "received Home and Community-Based Services rather than care in a facility"],
  ];
  const pages: Page[] = defs.map(([measure, population, title, phrase]) => {
    const rows = perf[measure]?.rows.filter(r => r.population === population && r.race !== "unknown") ?? [];
    const lines = rows.sort((a, b) => a.year - b.year || a.race.localeCompare(b.race)).map(r => {
      const v = typeof r.values[0] === "number" ? Math.round(r.values[0] * 100) : null;
      return v == null ? null : `${r.year}, ${race(r.race)}: ${v} out of every 100 ${phrase}.`;
    }).filter(Boolean);
    return { id: `statewide-${measure.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, href: BASE, title: `${title}, Minnesota statewide, 2018 to 2022`,
      summary: `${title}, by race and ethnicity, from the Minnesota Department of Human Services public Long-Term Services and Supports performance measures.`, text: lines.join("\n"), tags: ["equity data", "Long-Term Services and Supports", "statewide", "Home and Community-Based Services"] };
  });
  const spend = perf["Avg LTSS Spending"]?.rows.filter(r => r.population === "Total LTSS Population" && r.race !== "unknown") ?? [];
  pages.push({ id: "statewide-average-spending", href: BASE, title: "Average yearly Long-Term Services and Supports spending per person, Minnesota statewide, 2018 to 2022",
    summary: "Average spending per person receiving Long-Term Services and Supports, by race and ethnicity.",
    text: spend.sort((a, b) => a.year - b.year).map(r => typeof r.values[0] === "number" ? `${r.year}, ${race(r.race)}: $${Math.round(r.values[0]).toLocaleString()} per person.` : null).filter(Boolean).join("\n"),
    tags: ["equity data", "Long-Term Services and Supports", "spending"] });
  return pages;
}

function glossaryPage(): Page {
  return { id: "glossary", href: `${BASE}/glossary`, title: "Plain-language glossary for the equity baseline",
    summary: glossary.rule,
    text: glossary.terms.map(t => `${t.full} (written ${t.short} in state documents): ${t.plain} Source: ${t.source}.`).join("\n"),
    tags: ["glossary", "definitions", "equity data"] };
}

/** Public, aggregate equity data as citation-ready documents. No individual records. */
export function equityDataDocs(scope: StaffProgramScope): Doc[] {
  const pages = [...serviceAccessPages(), ...servicePages(), ...incomePages(), ...vocationalRehabilitationPages(), ...statewidePages(), glossaryPage()];
  return pages.map(page => ({
    kind: "content", id: `public-equity-data-${page.id}`, title: page.title, href: page.href,
    authority: "program_reference", type: "equity_data", status: "approved", reviewDate: "2026-11-03",
    scope: "dsd", summary: page.summary,
    text: `${page.title}\n${page.summary}\n${page.text}`, tags: page.tags, intents: [], graphRelated: [BASE, `${BASE}/glossary`],
    evidenceRevisions: [{ sourceId: `equity-data:${page.id}`, revisionId: null,
      payloadHash: createHash("sha256").update(page.text).digest("hex"), scope }],
  }));
}

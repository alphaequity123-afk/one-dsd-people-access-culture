import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  allPrograms,
  formatPolicyDate,
  getPolicies,
  getPoliciesData,
  getPolicy,
  getPolicyKinds,
  policiesByKind,
  policiesByTag,
  policiesForAppliesTo,
  policiesForProgram,
  policyHref,
  searchPolicies,
} from "./dsd-policies";

const data = getPoliciesData();
const policies = getPolicies();
const APP_DIR = path.resolve(__dirname, "../../../app");

const OFFICIAL_HOSTS = new Set([
  "dhs.state.mn.us", "www.dhs.state.mn.us", "edocs.dhs.state.mn.us",
  "mn.gov", "www.mn.gov", "revisor.mn.gov", "www.revisor.mn.gov", "lrl.mn.gov", "www.lrl.mn.gov",
  "medicaid.gov", "www.medicaid.gov", "cms.gov", "www.cms.gov", "ecfr.gov", "www.ecfr.gov",
  "federalregister.gov", "www.federalregister.gov", "govinfo.gov", "www.govinfo.gov",
]);
const GOVDELIVERY_PREFIX = "https://content.govdelivery.com/accounts/MNDHS/";

function official(url: string): boolean {
  if (!url.startsWith("https://")) return false;
  const host = new URL(url).hostname.toLowerCase();
  return OFFICIAL_HOSTS.has(host) || host.endsWith(".mn.gov") || url.startsWith(GOVDELIVERY_PREFIX);
}

const BANNED = /\b(DSD|DHS|HCBS|CBSM|CADI|CAC|CDCS|DWRS|PCA|CFSS|EVV|AI)\b|\btutor\b|recommended/;
const DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;

function visibleText(): { label: string; text: string }[] {
  const out: { label: string; text: string }[] = [];
  for (const k of data.kinds) out.push({ label: `kind ${k.id}`, text: `${k.title} ${k.intro}` });
  for (const p of policies) {
    const texts = [p.title, p.summary, ...p.requires, ...p.equityCheck, ...p.programs, ...p.appliesTo, ...p.tags, p.source.title, ...p.relatedSources.map(s => s.title)];
    for (const text of texts) out.push({ label: p.id, text });
  }
  return out;
}

describe("policies that shape disability services", () => {
  it("has a checked date, the eight kinds in order and at least 60 policies", () => {
    expect(data.checked).toMatch(FULL_DATE);
    expect(getPolicyKinds().map(k => k.id)).toEqual(["statute", "rule", "manual", "waiver-plan", "department-policy", "bulletin", "federal-rule", "report-or-plan"]);
    expect(getPolicyKinds().map(k => k.title)).toEqual([
      "Minnesota statutes",
      "Minnesota rules",
      "Community-Based Services Manual",
      "Federally approved waiver plans",
      "Department of Human Services policies",
      "Bulletins",
      "Federal rules",
      "Reports and plans",
    ]);
    for (const k of data.kinds) expect(k.intro.trim(), k.id).not.toBe("");
    expect(policies.length).toBeGreaterThanOrEqual(60);
  });

  it("gives every policy an https official source, a checked date and non-empty summary, requirements and equity checks", () => {
    const kindIds = new Set(data.kinds.map(k => k.id));
    for (const p of policies) {
      expect(p.title.trim(), p.id).not.toBe("");
      expect(kindIds.has(p.kind), `${p.id}: kind ${p.kind}`).toBe(true);
      expect(p.source.title.trim(), p.id).not.toBe("");
      expect(official(p.source.url), `${p.id}: ${p.source.url}`).toBe(true);
      expect(p.checked, p.id).toMatch(FULL_DATE);
      expect(p.summary.trim(), p.id).not.toBe("");
      expect(p.requires.length, p.id).toBeGreaterThan(0);
      expect(p.equityCheck.length, p.id).toBeGreaterThan(0);
      for (const r of p.requires) expect(r.trim(), p.id).not.toBe("");
      for (const e of p.equityCheck) expect(e.trim(), p.id).not.toBe("");
      expect(p.programs.length, p.id).toBeGreaterThan(0);
      expect(p.appliesTo.length, p.id).toBeGreaterThan(0);
      if (p.effective) expect(p.effective, p.id).toMatch(DATE);
      if (p.lastUpdated) expect(p.lastUpdated, p.id).toMatch(DATE);
      for (const s of p.relatedSources) {
        expect(s.title.trim(), p.id).not.toBe("");
        expect(official(s.url), `${p.id}: ${s.url}`).toBe(true);
      }
    }
  });

  it("has unique ids that match the page route pattern", () => {
    const ids = policies.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(policyHref(id)).toBe(`/community-outreach/policies/${id}`);
    }
  });

  it("points related pages only at routes that exist in the app", () => {
    for (const p of policies) {
      for (const route of p.relatedPages) {
        expect(route, p.id).toMatch(/^\/[a-z0-9/-]+$/);
        expect(route, p.id).not.toMatch(/^\/community-outreach\/policies/);
        const file = path.join(APP_DIR, ...route.split("/").filter(Boolean), "page.tsx");
        expect(existsSync(file), `${p.id}: ${route} -> ${file}`).toBe(true);
      }
      expect(new Set(p.relatedPages).size, p.id).toBe(p.relatedPages.length);
    }
  });

  it("is sorted by kind then title", () => {
    const order = new Map(data.kinds.map((k, i) => [k.id, i]));
    for (let i = 1; i < policies.length; i++) {
      const a = policies[i - 1];
      const b = policies[i];
      const ka = order.get(a.kind)!;
      const kb = order.get(b.kind)!;
      const ok = ka < kb || (ka === kb && a.title.toLowerCase() <= b.title.toLowerCase());
      expect(ok, `${a.id} before ${b.id}`).toBe(true);
    }
  });

  it("uses plain wording without banned short forms or words in visible text", () => {
    for (const { label, text } of visibleText()) {
      expect(text, label).not.toMatch(BANNED);
    }
  });

  it("writes waiver and agency names in full in visible text", () => {
    // Form numbers such as "CMS-179" are names, not short forms.
    const shortForms = /\b(BI|DD|EW|AC|ECS|CRS|ICF\/DD|MMIS|CMS(?!-\d)|LTSS)\b/;
    for (const p of policies) {
      for (const text of [p.summary, ...p.requires, ...p.equityCheck]) {
        expect(text, p.id).not.toMatch(shortForms);
      }
    }
  });
});

describe("policy lookups", () => {
  it("finds a policy by id and returns undefined for an unknown id", () => {
    const first = policies[0];
    expect(getPolicy(first.id)).toBe(first);
    expect(getPolicy("no-such-policy")).toBeUndefined();
  });

  it("groups by kind in order and covers every policy once", () => {
    const groups = policiesByKind();
    expect(groups.map(g => g.kind.id)).toEqual(data.kinds.map(k => k.id));
    expect(groups.reduce((n, g) => n + g.policies.length, 0)).toBe(policies.length);
    for (const g of groups) for (const p of g.policies) expect(p.kind).toBe(g.kind.id);
  });

  it("filters by program without regard to case", () => {
    const dd = policiesForProgram("Developmental Disabilities Waiver");
    expect(dd.length).toBeGreaterThan(0);
    for (const p of dd) expect(p.programs).toContain("Developmental Disabilities Waiver");
    expect(policiesForProgram("developmental disabilities waiver").length).toBe(dd.length);
    expect(allPrograms()).toContain("Developmental Disabilities Waiver");
    expect(policiesForProgram("No such program")).toEqual([]);
  });

  it("filters by tag and by who it applies to", () => {
    const tagged = policiesByTag(policies[0].tags[0]);
    expect(tagged).toContain(policies[0]);
    expect(policiesByTag("no-such-tag")).toEqual([]);
    const lead = policiesForAppliesTo("lead agencies");
    expect(lead.length).toBeGreaterThan(0);
    for (const p of lead) expect(p.appliesTo).toContain("lead agencies");
  });

  it("searches every word of a query across title, summary and requirements", () => {
    expect(searchPolicies("")).toHaveLength(policies.length);
    const hits = searchPolicies("Developmental Disabilities Waiver");
    expect(hits.length).toBeGreaterThan(0);
    expect(searchPolicies("zzzz-no-such-text")).toEqual([]);
  });

  it("formats dates in plain words", () => {
    expect(formatPolicyDate("2026-02-01")).toBe("February 1, 2026");
    expect(formatPolicyDate("2026-02")).toBe("February 2026");
    expect(formatPolicyDate("2026")).toBe("2026");
    expect(formatPolicyDate("")).toBe("");
    expect(formatPolicyDate("2026 Minnesota Statutes")).toBe("2026 Minnesota Statutes");
  });
});

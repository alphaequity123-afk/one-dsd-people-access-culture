import { beforeEach, describe, expect, it, vi } from "vitest";

const leaders = vi.hoisted(() => ({ allowed: true }));
vi.mock("@/lib/auth/leaders-access", () => ({ leadersAllowed: async () => leaders.allowed }));

import { communityDesignEntries } from "@/lib/content/community-design";
import { getPolicies } from "@/lib/content/hub/dsd-policies";
import { FIGURES_SOURCE } from "@/lib/content/hub/community-figures-format";
import { ORGANIZATIONS, isNativeCommunity } from "@/lib/content/hub/organizations";
import { HUB_KINDS, type DownloadKind } from "../catalog";
import { renderText } from "../exporters/text";
import { DOWNLOAD_FORMATS, type ResourceDocument } from "../model";
import { renderResourceDocument } from "../render";
import { resolveDownloadDocument } from "../resolve";
import { briefDocument } from "./community";
import { COMMUNITY_OUTREACH_IDS } from "./hub-outreach";
import { extraPageIds } from "./hub-pages";
import { EQUITY_REVIEW_IDS } from "./hub-review";

const SCOPE = "dsd" as const;
const NATIVE_IDS = ["native-american", "tribal-nations", "alaska-native"];
const COMMUNITY_IDS = communityDesignEntries().map(entry => entry.id);

async function resolve(kind: DownloadKind, id: string): Promise<ResourceDocument> {
  const document = await resolveDownloadDocument(kind, id, SCOPE);
  expect(document, `${kind}/${id}`).not.toBeNull();
  return document!;
}

async function renderAll(document: ResourceDocument, label: string) {
  for (const format of DOWNLOAD_FORMATS) {
    const file = await renderResourceDocument(document, format);
    expect(file.byteLength, `${label} ${format}`).toBeGreaterThan(0);
    const head = file.subarray(0, 4).toString("latin1");
    if (format === "pdf") expect(head, `${label} pdf`).toBe("%PDF");
    else expect(head.slice(0, 2), `${label} ${format}`).toBe("PK");
  }
}

/** The document's whole text, as the plain-text copy prints it. */
const textOf = (document: ResourceDocument) => renderText(document).toString("utf8");

/** Every record keeps its source and checked date, as a column or a source entry. */
function expectSourced(document: ResourceDocument, label: string) {
  const text = textOf(document);
  expect((document.sources?.length ?? 0) > 0 || /Source/.test(text), `${label} names its sources`).toBe(true);
  expect(/[Cc]hecked|Built on|Reviewed|Effective/.test(text), `${label} carries a checked date`).toBe(true);
}

/** Owner wording rules for text this adapter adds. */
function expectOwnerWording(document: ResourceDocument, label: string) {
  const text = textOf(document);
  expect(text, label).not.toMatch(/Project recommendation|Existing DHS resource|\btutor\b/i);
}

beforeEach(() => {
  leaders.allowed = true;
});

describe("hub downloads", () => {
  it("registers the five hub kinds", () => {
    expect([...HUB_KINDS].sort()).toEqual(["community", "community-outreach", "equity-review", "organization", "policy"]);
  });

  it("resolves and renders every organization page in all four formats", async () => {
    expect(ORGANIZATIONS.length).toBeGreaterThan(0);
    for (const org of ORGANIZATIONS) {
      const document = await resolve("organization", org.slug);
      expect(document.title).toBe(org.name);
      expectSourced(document, org.slug);
      expect(textOf(document)).toContain(org.records[0].url);
      await renderAll(document, org.slug);
    }
  });

  it("resolves every policy, and renders a sample in all four formats", async () => {
    const policies = getPolicies();
    expect(policies.length).toBe(274);
    for (const policy of policies) {
      const document = await resolve("policy", policy.id);
      expect(document.title).toBe(policy.title);
      expect(textOf(document)).toContain(policy.source.url);
      expectSourced(document, policy.id);
    }
    const sample = [0, 1, 50, 100, 150, 200, policies.length - 1].map(index => policies[index]);
    for (const policy of sample) await renderAll((await resolve("policy", policy.id)), policy.id);
  });

  it.each(COMMUNITY_OUTREACH_IDS)("resolves and renders the %s page", async id => {
    const document = await resolve("community-outreach", id);
    if (id !== "home" && id !== "plan") expectSourced(document, id);
    expectOwnerWording(document, id);
    await renderAll(document, id);
  });

  it("puts the large directories in spreadsheet tables", async () => {
    const counties = await resolve("community-outreach", "county-agencies");
    const countyTable = counties.sections.flatMap(entry => entry.blocks).find(block => block.kind === "table" && block.rows.length === 87);
    expect(countyTable).toBeDefined();
    const policies = await resolve("community-outreach", "policies");
    expect(policies.sections.flatMap(entry => entry.blocks).some(block => block.kind === "table" && block.rows.length === 274)).toBe(true);
    const map = await resolve("community-outreach", "county-map");
    expect(map.sections.flatMap(entry => entry.blocks).some(block => block.kind === "table" && block.rows.length === 88 * 7)).toBe(true);
  });

  it.each(EQUITY_REVIEW_IDS)("resolves and renders the %s equity review page", async id => {
    const document = await resolve("equity-review", id);
    expectOwnerWording(document, id);
    await renderAll(document, id);
  });

  it.each(extraPageIds())("resolves and renders the other public page %s", async id => {
    const document = await resolve("equity-review", id);
    expectOwnerWording(document, id);
    await renderAll(document, id);
  });

  it("keeps leaders-only pages behind the leaders check", async () => {
    leaders.allowed = false;
    expect(await resolveDownloadDocument("equity-review", "equity-baseline", SCOPE)).toBeNull();
    expect(await resolveDownloadDocument("community-outreach", "community-coverage", SCOPE)).toBeNull();
  });

  it("never shows activity counts in the equity baseline copy", async () => {
    const text = textOf(await resolve("equity-review", "equity-baseline"));
    expect(text).not.toMatch(/reviews? completed|Equity reviews completed/i);
  });

  it("returns nothing for unknown ids", async () => {
    for (const kind of HUB_KINDS) expect(await resolveDownloadDocument(kind as DownloadKind, "no-such-page", SCOPE)).toBeNull();
    for (const id of ["data", "general", "hcbs", "practice-guide~nope", "podcast~nope", "administration~nope"]) expect(await resolveDownloadDocument("equity-review", id, SCOPE)).toBeNull();
  });

  it("resolves and renders every community page", async () => {
    expect(COMMUNITY_IDS.length).toBeGreaterThan(0);
    for (const id of COMMUNITY_IDS) {
      const document = await resolve("community", id);
      await renderAll(document, id);
      const headings = document.sections.map(entry => entry.heading);
      if (isNativeCommunity(id)) continue;
      expect(headings, id).toContain("Numbers, with care");
      expect(headings, id).toContain("Organizations connected with the Disability Services Division");
      expect(headings, id).toContain("Before you reach out");
    }
  });

  it("adds nothing to Native community pages", async () => {
    for (const id of NATIVE_IDS) {
      expect(isNativeCommunity(id)).toBe(true);
      if (!COMMUNITY_IDS.includes(id)) continue;
      const document = await resolve("community", id);
      // Exactly what the page publishes: the brief, unchanged.
      expect(document).toEqual(await briefDocument(id, SCOPE));
      const text = textOf(document);
      for (const added of ["Numbers, with care", "Organizations connected with the Disability Services Division", "Before you reach out", "Minnesota counties", FIGURES_SOURCE.title, "People and contributions", "Community profile", "More to explore", "Organizations and media"]) {
        expect(text, `${id}: ${added}`).not.toContain(added);
      }
      for (const org of ORGANIZATIONS) expect(text, `${id}: ${org.name}`).not.toContain(org.name);
    }
  });
});

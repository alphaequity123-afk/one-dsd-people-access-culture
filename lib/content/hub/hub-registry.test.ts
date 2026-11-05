import { describe, expect, it } from "vitest";
import { communityDesignEntries } from "@/lib/content/community-design";
import { COMMUNITY_CROSSWALK, communityFigureGroups } from "./community-crosswalk";
import { NATIVE_COMMUNITY_IDS, ORGANIZATIONS, getOrganization, hasDivisionRecord, organizationsForCommunity } from "./organizations";
import { knowledgeGraph, relatedItems } from "@/lib/content/knowledge-graph";
import { COMMUNITY_OUTREACH_SURFACE } from "./hub-surface";
import { BEFORE_YOU_REACH_OUT, OUTREACH_PRACTICE } from "./before-you-reach-out";
import { sourcingEntries } from "./sourcing";

const visible = (org: (typeof ORGANIZATIONS)[number]) => JSON.stringify({ ...org, alsoKnownAs: "", records: [], contact: {}, slug: "" });

describe("Community Outreach and Engagement registry", () => {
  it("has one record per organization, each with public records and a checked date", () => {
    expect(ORGANIZATIONS.length).toBe(42);
    expect(new Set(ORGANIZATIONS.map(org => org.slug)).size).toBe(ORGANIZATIONS.length);
    for (const org of ORGANIZATIONS) {
      expect(org.records.length, org.slug).toBeGreaterThan(0);
      for (const record of org.records) expect(record.url, org.slug).toMatch(/^https:\/\//);
      expect(org.checked, org.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(org.withTheDivision.length, org.slug).toBeGreaterThan(0);
    }
  });

  it("links organizations only to community pages that exist, never to Native pages", () => {
    const ids = new Set(communityDesignEntries().map(entry => entry.id));
    for (const org of ORGANIZATIONS) for (const id of org.communities) {
      expect(ids.has(id), `${org.slug} → ${id}`).toBe(true);
      expect((NATIVE_COMMUNITY_IDS as readonly string[]).includes(id)).toBe(false);
    }
    for (const id of NATIVE_COMMUNITY_IDS) expect(organizationsForCommunity(id)).toEqual([]);
  });

  it("labels records that name the Department of Human Services but not the division", () => {
    const lighthouse = getOrganization("lighthouse-center-for-vital-living")!;
    expect(lighthouse.withTheDivision.some(rel => rel.departmentWide)).toBe(true);
    expect(hasDivisionRecord(getOrganization("autism-society-of-minnesota")!)).toBe(true);
  });

  it("keeps visible organization text free of short forms and banned words", () => {
    for (const org of ORGANIZATIONS) expect(visible(org), org.slug).not.toMatch(/\b(DSD|DHS|AI)\b|\btutor\b/);
  });

  it("gives Native community pages no figures", () => {
    for (const id of NATIVE_COMMUNITY_IDS) {
      expect(COMMUNITY_CROSSWALK.find(entry => entry.communityId === id)?.match).toBe("none");
      expect(communityFigureGroups(id)).toEqual([]);
    }
  });

  it("connects organizations to community pages in the knowledge graph", () => {
    const graph = knowledgeGraph();
    expect(graph.nodes.get("organization:somali-parents-autism-network")?.href).toBe("/community-outreach/organizations/somali-parents-autism-network");
    const related = relatedItems("brief:somali", { kinds: ["organization"], limit: 20 }).map(item => item.id);
    expect(related).toContain("organization:somali-parents-autism-network");
    for (const id of NATIVE_COMMUNITY_IDS) expect(relatedItems(`brief:${id}`, { kinds: ["organization"] })).toEqual([]);
  });

  it("keeps the hub copy free of short forms and banned words", () => {
    const text = JSON.stringify([COMMUNITY_OUTREACH_SURFACE.approvedValues, BEFORE_YOU_REACH_OUT, OUTREACH_PRACTICE]);
    expect(text).not.toMatch(/\b(DSD|DHS|AI)\b|\btutor\b/);
  });

  it("keeps the sourcing directory to verified, dated entries with secure links and no Native entries", () => {
    const entries = sourcingEntries();
    expect(entries.length).toBeGreaterThan(100);
    for (const entry of entries) {
      expect(entry.checked, entry.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (entry.website) expect(entry.website, entry.name).toMatch(/^https:\/\//);
      expect(entry.kind).not.toBe("referral");
      for (const id of NATIVE_COMMUNITY_IDS) expect(entry.communities).not.toContain(id);
    }
    expect(JSON.stringify(entries.map(e => ({ ...e, alsoKnownAs: "", website: "", dhsRecord: "" })))).not.toMatch(/\b(DSD|DHS|AI)\b|\btutor\b/);
  });
});

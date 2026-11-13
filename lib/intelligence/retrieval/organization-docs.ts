import "server-only";
import { createHash } from "node:crypto";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { ORGANIZATIONS, ORGANIZATIONS_CHECKED, organizationHref, relationshipLine } from "@/lib/content/hub/organizations";
import { getCountyAgencies } from "@/lib/content/hub/county-agencies";
import { getSystemConnections } from "@/lib/content/hub/system-connections";
import { getOfficialProviders } from "@/lib/content/hub/official-providers";
import { getPolicies, policyHref } from "@/lib/content/hub/dsd-policies";
import { SOURCING_CATEGORIES, SOURCING_CHECKED } from "@/lib/content/hub/sourcing";
import { externalReadingHref } from "@/lib/content/external-readings";
import type { Doc } from "./search";

// Organizations connected with the Disability Services Division, as Ask
// documents. Each one cites its own page, which lists the public records.
export function organizationDocs(scope: StaffProgramScope): Doc[] {
  return ORGANIZATIONS.map(org => {
    const relationships = org.withTheDivision.map(rel =>
      `${relationshipLine(rel)}${rel.departmentWide ? " (the record names the Department of Human Services, not the Disability Services Division)" : ""}: ${rel.what}`);
    const text = [
      `${org.name}${org.alsoKnownAs ? ` (also known as ${org.alsoKnownAs})` : ""}. ${org.kind}.${org.closed ? " This organization has closed." : ""}`,
      org.summary,
      `Who it serves: ${org.whoItServes}`,
      `Where it works: ${org.whereItWorks}`,
      `Connection with the Disability Services Division: ${relationships.join(" ")}`,
      `When staff might connect: ${org.whyItMattersForStaff}`,
      org.contact.website ? `Website: ${org.contact.website}` : "",
    ].filter(Boolean).join("\n");
    return {
      kind: "content", id: `public-community-organization-${org.slug}`, title: `${org.name}: organization connected with the Disability Services Division`,
      href: organizationHref(org.slug), authority: "program_reference", type: "community_organization", status: "approved",
      reviewDate: ORGANIZATIONS_CHECKED, scope: "dsd", summary: org.summary, text,
      tags: ["community outreach", "community engagement", "organization", ...org.relationshipTypes.map(t => t.toLowerCase()), ...org.communities],
      intents: [], graphRelated: ["/community-outreach/organizations", ...org.communities.map(id => `/minnesota-communities/${id}`)],
      evidenceRevisions: [{ sourceId: `community-organization:${org.slug}`, revisionId: null, payloadHash: createHash("sha256").update(text).digest("hex"), scope }],
    } satisfies Doc;
  });
}

// County agencies, one document per county, so Ask can answer "who serves people in this county".
export function countyAgencyDocs(scope: StaffProgramScope): Doc[] {
  const data = getCountyAgencies();
  return data.counties.map(c => {
    const text = [
      `${c.county} County: ${c.agencyName}${c.shared ? `, an agency shared by ${c.sharedCounties.join(", ")} counties` : ""}.`,
      "This is the county agency for Department of Human Services disability programs: MnCHOICES assessments, disability waivers, case management and other home and community-based services.",
      c.phone ? `Phone: ${c.phone} (${c.phoneLabel}).` : "",
      c.website ? `Website: ${c.website}` : "",
      c.notes,
    ].filter(Boolean).join("\n");
    return {
      kind: "content", id: `public-county-agency-${c.fips}`, title: `${c.county} County agency for disability services`,
      href: `/community-outreach/county-agencies#county-${c.fips}`, authority: "program_reference", type: "county_agency", status: "approved",
      reviewDate: c.checked, scope: "dsd", summary: text.split("\n")[0], text,
      tags: ["county", "lead agency", "county agency", c.county.toLowerCase(), "disability services"], intents: [],
      graphRelated: ["/community-outreach/county-map"],
      evidenceRevisions: [{ sourceId: `county-agency:${c.fips}`, revisionId: null, payloadHash: createHash("sha256").update(text).digest("hex"), scope }],
    } satisfies Doc;
  });
}

// Sources for recruitment, outreach and engagement, one document per category.
export function sourcingDocs(scope: StaffProgramScope): Doc[] {
  return SOURCING_CATEGORIES.map(category => {
    const text = [category.title, category.intro, ...category.entries.map(e =>
      `${e.name} (${[e.kind, e.region].filter(Boolean).join(", ")}): ${e.what} ${e.howToUse}${e.languages?.length ? ` Languages: ${e.languages.join(", ")}.` : ""}${e.website ? ` ${e.website}` : ""}`)].join("\n");
    return {
      kind: "content", id: `public-community-sources-${category.category}`, title: `Where to reach people: ${category.title}`,
      href: `/community-outreach/sources?category=${category.category}`, authority: "program_reference", type: "community_sources", status: "approved",
      reviewDate: SOURCING_CHECKED, scope: "dsd", summary: category.intro, text,
      tags: ["recruitment", "outreach", "engagement", category.title.toLowerCase()], intents: [],
      graphRelated: ["/community-outreach/sources"],
      evidenceRevisions: [{ sourceId: `community-sources:${category.category}`, revisionId: null, payloadHash: createHash("sha256").update(text).digest("hex"), scope }],
    } satisfies Doc;
  });
}

// How the Department of Human Services, the Disability Services Division, other
// divisions and lead agencies connect: one document per unit, role and referral path.
export function systemConnectionDocs(scope: StaffProgramScope): Doc[] {
  const data = getSystemConnections();
  const href = "/community-outreach/how-the-system-connects";
  const make = (id: string, title: string, text: string, anchor: string, tags: string[]): Doc => ({
    kind: "content", id: `public-system-connection-${id}`, title, href: `${href}#${anchor}`, authority: "program_reference",
    type: "system_connection", status: "approved", reviewDate: data.checked, scope: "dsd", summary: text.split("\n")[0].slice(0, 360), text,
    tags: ["how the system connects", "lead agency", "Department of Human Services", "Disability Services Division", ...tags], intents: [],
    graphRelated: [href, "/community-outreach/county-agencies"],
    evidenceRevisions: [{ sourceId: `system-connection:${id}`, revisionId: null, payloadHash: createHash("sha256").update(text).digest("hex"), scope }],
  });
  const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return [
    ...data.structure.map(item => make(`structure-${slug(item.name)}`, `${item.name}: role in disability services`,
      `${item.name} (${item.kind}). ${item.whatItDoesForDisabilityServices}\nConnection to the Disability Services Division: ${item.connectionToDivision}\nSource: ${item.source.title}, ${item.source.date}. ${item.source.url}`, "structure", [item.kind])),
    ...data.leadAgencyTypes.map(item => make(`lead-agency-${slug(item.type)}`, `Lead agency type: ${item.type}`,
      `${item.type}. ${item.description}${item.examples?.length ? ` Examples: ${item.examples.join("; ")}.` : ""}${item.programs?.length ? ` Programs: ${item.programs.join("; ")}.` : ""}\nSource: ${item.source.title}, ${item.source.date}. ${item.source.url}`, "lead-agencies", ["lead agency type"])),
    ...data.divisionRoles.map(item => make(`division-${slug(item.role)}`, `Disability Services Division and lead agencies: ${item.role}`,
      `${item.role}. ${item.description}\nHow lead agencies experience it: ${item.howLeadAgenciesExperienceIt}\nSource: ${item.source.title}, ${item.source.date}. ${item.source.url}`, "division-roles", ["division role"])),
    ...data.departmentRoles.map(item => make(`department-${slug(item.role)}`, `Department of Human Services and lead agencies: ${item.role}`,
      `${item.role}. ${item.description}\nSource: ${item.source.title}, ${item.source.date}. ${item.source.url}`, "department-roles", ["department role"])),
    ...data.referralPaths.map((item, i) => make(`referral-${i}-${slug(item.from)}`, `Referral: ${item.from} to ${item.to}`,
      `From ${item.from} to ${item.to}. ${item.when}\nSource: ${item.source.title}, ${item.source.date}. ${item.source.url}`, "referrals", ["referral"])),
    make("glossary", "Plain-language glossary for how the system connects", data.glossary.map(g => `${g.term}: ${g.plain}`).join("\n"), "glossary", ["glossary"]),
  ];
}

// Designated providers and agencies, one document per entry.
export function officialProviderDocs(scope: StaffProgramScope): Doc[] {
  const data = getOfficialProviders();
  return data.categories.flatMap(category => category.entries.map(entry => {
    const text = [
      `${entry.name}${entry.alsoKnownAs?.length ? ` (also known as ${entry.alsoKnownAs.join(", ")})` : ""}: ${category.title}. Designated by ${category.designatedBy}.`,
      entry.what,
      entry.counties.length ? `Counties served: ${entry.counties.join(", ")}.` : "No published county list.",
      entry.phone ? `Phone: ${entry.phone}.` : "",
      entry.website ? `Website: ${entry.website}` : "",
      `Record: ${entry.source.title}, ${entry.source.date}. ${entry.source.url}`,
    ].filter(Boolean).join("\n");
    const slug = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      kind: "content", id: `public-designated-provider-${slug}`, title: `${entry.name}: ${category.title}`,
      href: `/community-outreach/providers#cat-${category.id}`, authority: "program_reference", type: "designated_provider", status: "approved",
      reviewDate: data.checked, scope: "dsd", summary: entry.what.slice(0, 360), text,
      tags: ["designated provider", category.title.toLowerCase(), ...entry.counties.slice(0, 20).map(c => c.toLowerCase())], intents: [],
      graphRelated: ["/community-outreach/providers", "/community-outreach/how-the-system-connects"],
      evidenceRevisions: [{ sourceId: `designated-provider:${slug}`, revisionId: null, payloadHash: createHash("sha256").update(text).digest("hex"), scope }],
    } satisfies Doc;
  }));
}

// Policies that shape disability services, one document per policy.
export function policyDocs(scope: StaffProgramScope): Doc[] {
  return getPolicies().map(policy => {
    const text = [
      `${policy.title}.`,
      policy.summary,
      policy.programs.length ? `Programs: ${policy.programs.join(", ")}.` : "",
      policy.appliesTo.length ? `Applies to: ${policy.appliesTo.join(", ")}.` : "",
      policy.requires.length ? `What it requires: ${policy.requires.join(" ")}` : "",
      policy.equityCheck.length ? `What to check for equity: ${policy.equityCheck.join(" ")}` : "",
      policy.effective ? `Effective: ${policy.effective}.` : "",
      policy.lastUpdated ? `Last updated: ${policy.lastUpdated}.` : "",
      `Source: ${policy.source.title}${policy.source.date ? `, ${policy.source.date}` : ""}. ${policy.source.url}`,
    ].filter(Boolean).join("\n");
    return {
      kind: "content", id: `public-dsd-policy-${policy.id}`.slice(0, 120), title: `${policy.title} (policy summary)`,
      href: policyHref(policy.id), authority: "program_reference", type: "dsd_policy", status: "approved",
      reviewDate: policy.checked, scope: "dsd", summary: policy.summary.slice(0, 360), text,
      tags: ["policy", ...policy.tags.slice(0, 12)], intents: [],
      graphRelated: ["/community-outreach/policies", ...policy.relatedPages.filter(page => page.startsWith("/"))],
      graphLinks: [policy.source, ...policy.relatedSources].map(source => externalReadingHref(source.url) ?? source.url),
      evidenceRevisions: [{ sourceId: `dsd-policy:${policy.id}`, revisionId: null, payloadHash: createHash("sha256").update(text).digest("hex"), scope }],
    } satisfies Doc;
  });
}

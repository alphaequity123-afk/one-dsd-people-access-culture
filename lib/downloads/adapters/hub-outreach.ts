import "server-only";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import { communityDesignEntries } from "@/lib/content/community-design";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { stringValue } from "@/lib/content/staff-surface-registry";
import { BEFORE_YOU_REACH_OUT, OUTREACH_PRACTICE } from "@/lib/content/hub/before-you-reach-out";
import { getCountyAgencies, sharedAgencies } from "@/lib/content/hub/county-agencies";
import {
  GROUP_IDS,
  MEASURE_IDS,
  formatCount,
  formatValue,
  getCountyData,
  groupLabel,
  measureFor,
  statusText,
  type GroupId,
  type MeasureId,
} from "@/lib/content/hub/county-data";
import { formatPolicyDate, getPoliciesData, getPolicy, getPolicyKind, policyHref, policyPageTitle, relatedPolicies } from "@/lib/content/hub/dsd-policies";
import { PLAN_FIELDS, REPORT_BACK_INTRO, REPORT_FIELDS } from "@/lib/content/hub/engagement-plan-fields";
import { getOfficialProviders } from "@/lib/content/hub/official-providers";
import { ORGANIZATIONS, ORGANIZATIONS_CHECKED, getOrganization, hasDivisionRecord, isNativeCommunity, organizationHref, relationshipLine } from "@/lib/content/hub/organizations";
import { OUTREACH_TASKS, outreachSteps } from "@/lib/content/hub/outreach-home";
import { DEPARTMENT_WIDE_GRANTS } from "@/lib/content/hub/record-findings";
import { SOURCING_CATEGORIES, SOURCING_CHECKED } from "@/lib/content/hub/sourcing";
import { getSystemConnections, type Source as SystemSource } from "@/lib/content/hub/system-connections";
import {
  bullets,
  callout,
  compactSections,
  fields,
  heading,
  numbered,
  paragraph,
  section,
  table,
  type DocumentBlock,
  type DocumentSource,
  type ResourceDocument,
} from "../model";
import { kicker, linkList, programName } from "./shared";

const HUB = "Community Outreach and Engagement";
const TRIBAL_GUIDANCE = "Native American and Tribal-specific guidance — program page /learn/tribal-referral";

/** "2026-11-05" -> "November 5, 2026"; anything else is left as written. */
export function dateText(value: string | undefined): string {
  if (!value) return "";
  return /^\d{4}(-\d{2}(-\d{2})?)?$/.test(value) ? formatPolicyDate(value) : value;
}

function outreachDocument(scope: StaffProgramScope, parts: Omit<ResourceDocument, "kicker" | "attribution"> & { kickerNoun?: string }): ResourceDocument {
  const { kickerNoun, ...rest } = parts;
  return { kicker: kicker(scope, kickerNoun ?? HUB), attribution: programName(scope), ...rest };
}

function communityTitles(): Map<string, string> {
  return new Map(communityDesignEntries().map(entry => [entry.id, entry.title]));
}

function uniqueSources(sources: DocumentSource[]): DocumentSource[] {
  const seen = new Set<string>();
  return sources.filter(source => {
    const key = `${source.title}|${source.href ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------- Organization pages

export function organizationDocument(slug: string, scope: StaffProgramScope): ResourceDocument | null {
  const org = getOrganization(slug);
  if (!org) return null;
  const titles = communityTitles();
  const notConfirmed = "Not confirmed in the public records.";
  const uncertainties = org.uncertainties.filter(Boolean);
  return outreachDocument(scope, {
    kickerNoun: `${HUB} · ${org.kind}`,
    title: org.name,
    subtitle: org.summary,
    meta: [
      ...(org.alsoKnownAs ? [{ label: "Also known as", value: org.alsoKnownAs }] : []),
      { label: "Connection", value: org.relationshipTypes.join(", ") },
      { label: "Facts checked", value: dateText(org.checked) },
      { label: "Page", value: `program page ${organizationHref(org.slug)}` },
    ],
    sections: compactSections([
      section(undefined, [
        org.closed ? callout("This organization has closed, according to its own website. It is listed for the record of its work with the Disability Services Division, not as a place to refer people.", "Closed") : null,
      ]),
      section("Who it serves and where it works", [
        heading("Who it serves"),
        paragraph(org.whoItServes || notConfirmed),
        heading("Where it works"),
        paragraph(org.whereItWorks || notConfirmed),
        heading("What it does"),
        org.services.length ? bullets(org.services) : paragraph(notConfirmed),
      ]),
      section("Work with the Disability Services Division and the Department of Human Services", [
        table(
          ["Connection", "Program", "Years", "Amount", "What the record says", "The record names"],
          org.withTheDivision.map(rel => [
            rel.type,
            rel.program,
            rel.years ?? "",
            rel.amount ?? "",
            rel.what,
            rel.departmentWide ? "The Department of Human Services, not the Disability Services Division" : "The Disability Services Division",
          ]),
        ),
      ]),
      section("When staff might connect", [
        paragraph(org.whyItMattersForStaff),
        org.communities.length ? paragraph(`Community pages: ${org.communities.map(id => titles.get(id) ?? id).join(", ")}`) : null,
      ]),
      section("Contact", [
        org.contact.website || org.contact.phone || org.contact.email
          ? fields([
              { label: "Website", value: org.contact.website ?? "" },
              { label: "Phone", value: org.contact.phone ?? "" },
              { label: "Email", value: org.contact.email ?? "" },
            ])
          : paragraph("No general contact details were found in public sources."),
      ]),
      section("Public records", [
        table(["Record", "Date", "Link"], org.records.map(record => [record.title, record.date ?? "", record.url])),
        uncertainties.length ? heading("Not confirmed") : null,
        uncertainties.length ? bullets(uncertainties) : null,
        paragraph(`Facts checked against public sources on ${dateText(org.checked)}. Confirm current details with the organization before relying on them.`),
      ]),
    ]),
    sources: org.records.map(record => ({ title: record.title, href: record.url, note: [record.date, `facts checked ${dateText(org.checked)}`].filter(Boolean).join("; ") })),
  });
}

// ---------------------------------------------------------------- Policy pages

export function policyDocument(id: string, scope: StaffProgramScope): ResourceDocument | null {
  const policy = getPolicy(id);
  if (!policy) return null;
  const kind = getPolicyKind(policy.kind);
  const related = relatedPolicies(policy);
  return outreachDocument(scope, {
    kickerNoun: `Policies that shape disability services${kind ? ` · ${kind.title}` : ""}`,
    title: policy.title,
    subtitle: policy.summary,
    meta: [
      { label: "Programs", value: policy.programs.join(", ") },
      { label: "Applies to", value: policy.appliesTo.join(", ") },
      { label: "Facts checked", value: formatPolicyDate(policy.checked) },
    ].filter(entry => entry.value),
    sections: compactSections([
      section(undefined, [callout("This is a summary written in plain language. The policy itself is the source document listed below. Check the date on the source before relying on it.")]),
      section("Dates and source", [
        fields([
          { label: "Effective", value: policy.effective ? formatPolicyDate(policy.effective) : "Not stated on the source" },
          { label: "Last updated", value: policy.lastUpdated ? formatPolicyDate(policy.lastUpdated) : "Not shown on the source" },
          { label: "Facts checked", value: formatPolicyDate(policy.checked) },
          { label: "Source", value: `${policy.source.title}${policy.source.date ? ` (${formatPolicyDate(policy.source.date)})` : ""}` },
          { label: "Source link", value: policy.source.url },
        ]),
      ]),
      section("What it requires", [bullets(policy.requires)]),
      section("What to check for equity", [bullets(policy.equityCheck)]),
      section("Related sources", [policy.relatedSources.length ? linkList(policy.relatedSources.map(source => ({ label: source.title, href: source.url }))) : null]),
      section("Related program pages", [policy.relatedPages.length ? linkList(policy.relatedPages.map(route => ({ label: policyPageTitle(route), href: route }))) : null]),
      section("Policies on the same topics", [related.length ? linkList(related.map(other => ({ label: other.title, href: policyHref(other.id) }))) : null]),
      section("Topics", [policy.tags.length ? paragraph(policy.tags.join(", ")) : null]),
    ]),
    sources: [
      { title: policy.source.title, href: policy.source.url, note: [policy.source.date ? `Source dated ${formatPolicyDate(policy.source.date)}` : "", `facts checked ${formatPolicyDate(policy.checked)}`].filter(Boolean).join("; ") },
      ...policy.relatedSources.map(source => ({ title: source.title, href: source.url })),
    ],
  });
}

// ---------------------------------------------------------------- Community Outreach and Engagement pages

async function homeDocument(scope: StaffProgramScope): Promise<ResourceDocument | null> {
  const surface = await prepareEditableSurface("community-outreach.home", { scope, includeOwner: false });
  if (!surface.available) return null;
  const text = (key: string) => stringValue(surface.values, key);
  return outreachDocument(scope, {
    title: text("title"),
    subtitle: text("lede"),
    meta: [{ label: "Page", value: "program page /community-outreach" }],
    sections: compactSections([
      section(text("tasksTitle"), OUTREACH_TASKS.flatMap((task): DocumentBlock[] => [heading(task.title), paragraph(task.body), linkList([{ label: task.action, href: task.href }])!])),
      section(text("cycleTitle"), [
        paragraph(text("cycleIntro")),
        ...outreachSteps(ORGANIZATIONS.length).flatMap((step, index): DocumentBlock[] => [
          heading(`${index + 1}. ${text(`step${step.key}Title`)}`),
          paragraph(text(`step${step.key}`)),
          paragraph(step.capability),
          linkList(step.links)!,
        ]),
      ]),
      section("Before you use the figures and the directory", [
        callout(text("numbersNote")),
        paragraph(text("tribalNote")),
        paragraph(TRIBAL_GUIDANCE),
      ]),
    ]),
  });
}

function organizationsDirectoryDocument(scope: StaffProgramScope): ResourceDocument {
  const titles = communityTitles();
  return outreachDocument(scope, {
    title: "Organizations connected with the Disability Services Division",
    subtitle: "Each organization here has a published record of working with the Disability Services Division as a grantee, contractor, partner or advisory member. Each page lists the records it rests on.",
    meta: [
      { label: "Organizations", value: String(ORGANIZATIONS.length) },
      { label: "Facts checked", value: dateText(ORGANIZATIONS_CHECKED) },
    ],
    sections: compactSections([
      section(undefined, [
        callout(`Being listed here does not mean the organization speaks for a whole community, and it is not a ranking. Some connections ended years ago. Confirm current details with the organization before you rely on them. Facts were checked on ${dateText(ORGANIZATIONS_CHECKED)}.`),
      ]),
      section("Organizations", [
        table(
          ["Organization", "Kind", "Connection", "Summary", "Work on record", "Communities named in its records", "Status", "Public records", "Facts checked", "Page"],
          ORGANIZATIONS.map(org => [
            org.name,
            org.kind,
            org.relationshipTypes.join(", "),
            org.summary,
            org.withTheDivision.map(relationshipLine).join("; "),
            org.communities.map(id => titles.get(id) ?? id).join(", "),
            [org.closed ? "Closed" : "", hasDivisionRecord(org) ? "" : "Record names the Department of Human Services"].filter(Boolean).join("; "),
            org.records.map(record => `${record.title}${record.date ? `, ${record.date}` : ""}: ${record.url}`).join("\n"),
            dateText(org.checked),
            organizationHref(org.slug),
          ]),
        ),
      ]),
      section("Also on record with the Department of Human Services", [
        paragraph("These grants are recorded with the Department of Human Services, but the records do not name the Disability Services Division. They are listed so the record is complete."),
        table(
          ["Organizations", "Program", "Years", "Amounts", "Focus", "Record", "Record date", "Link"],
          DEPARTMENT_WIDE_GRANTS.map(grant => [grant.organizations, grant.program, grant.years, grant.amounts ?? "", grant.focus, grant.record.title, grant.record.date, grant.record.url]),
        ),
      ]),
      section("Where the records come from", [
        paragraph("Most connections come from the Disability Services Division's 2023 report to the Legislature, the list of Innovation Grant awards, Department of Human Services news releases, and the Minnesota law that sets up the Waiver Reimagine advisory task force. Where a record names the Department of Human Services but not the Disability Services Division, the organization's page says so."),
      ]),
    ]),
    sources: uniqueSources([
      ...ORGANIZATIONS.flatMap(org => org.records.map(record => ({ title: record.title, href: record.url, note: record.date }))),
      ...DEPARTMENT_WIDE_GRANTS.map(grant => ({ title: grant.record.title, href: grant.record.url, note: grant.record.date })),
    ]),
  });
}

function countyAgenciesDocument(scope: StaffProgramScope): ResourceDocument {
  const data = getCountyAgencies();
  return outreachDocument(scope, {
    title: "County agencies",
    subtitle: data.description,
    meta: [
      { label: "Counties", value: String(data.counties.length) },
      { label: "Facts checked", value: dateText(data.checked) },
    ],
    sections: compactSections([
      section(undefined, [
        callout(`Counties are where most people meet the disability services system: assessments, waivers and case management happen there. Most counties publish one human services line rather than a separate disability line. Details were checked on ${dateText(data.checked)}; confirm them before you share them.`),
        ...data.tribalNations.map(link => paragraph(`${link.note} ${link.title}: ${link.url}`)),
      ]),
      section("Counties that share one agency", [
        table(["Agency", "Counties", "Website"], sharedAgencies().map(agency => [agency.agencyName, agency.counties.join(", "), agency.website])),
      ]),
      section("All 87 counties", [
        table(
          ["County", "County code", "Agency", "Shared with", "Phone", "Phone line", "Website", "Confirmation", "Notes", "Source", "Source link", "Checked"],
          data.counties.map(county => [
            county.county,
            county.fips,
            county.agencyName,
            county.shared ? county.sharedCounties.filter(name => name !== county.county).join(", ") : "",
            county.phone || "Not published",
            county.phoneLabel,
            county.website,
            county.status === "partial" ? "Partly confirmed" : "Confirmed",
            county.notes,
            county.sourceTitle,
            county.sourceUrl,
            dateText(county.checked),
          ]),
        ),
      ]),
      section("Where the directory comes from", [bullets(data.sources.map(source => `${source.title}: ${source.usedFor}${source.url ? ` (${source.url})` : ""}`))]),
    ]),
    sources: data.sources.map(source => ({ title: source.title, href: source.url || undefined, note: source.usedFor })),
  });
}

function providersDocument(scope: StaffProgramScope): ResourceDocument {
  const data = getOfficialProviders();
  const licensed = data.licensedProviderCounts;
  const orgPage = (name?: string) => {
    const org = name ? ORGANIZATIONS.find(entry => entry.name === name) : undefined;
    return org ? organizationHref(org.slug) : "";
  };
  return outreachDocument(scope, {
    title: "Providers and designated agencies",
    subtitle: "Organizations that the State of Minnesota designates, contracts, licenses or certifies to serve people with disabilities, and which counties each one serves. Each entry names the public record of its designation.",
    meta: [{ label: "Facts checked", value: dateText(data.checked) }],
    sections: compactSections([
      section(undefined, [
        callout(`Designation is a matter of public record; it is not a judgment of quality, and it is not a referral. Confirm current details with the organization. Facts checked on ${dateText(data.checked)}.`),
        paragraph(data.tribalNote),
        paragraph(TRIBAL_GUIDANCE),
      ]),
      ...data.categories.map(category => {
        const healthPlans = category.entries.some(entry => entry.programCounties);
        return section(category.title, [
          paragraph(category.intro),
          category.id === "licensed-providers" && data.licensedProviderCountsNote ? paragraph(data.licensedProviderCountsNote) : null,
          paragraph(`Designated by: ${category.designatedBy}`),
          table(
            [
              "Name",
              "Also known as",
              "What it does",
              "Counties",
              ...(healthPlans ? ["Special Needs BasicCare counties", "Minnesota Senior Health Options or Senior Care Plus counties"] : []),
              "Phone",
              "Website",
              "Record",
              "Record date",
              "Record link",
              "Other records",
              "Its record with the Disability Services Division",
            ],
            category.entries.map(entry => [
              entry.name,
              entry.alsoKnownAs.join(", "),
              entry.what,
              entry.counties.length ? entry.counties.join(", ") : "No published county list",
              ...(healthPlans ? [entry.programCounties?.specialNeedsBasicCare.join(", ") ?? "", entry.programCounties?.seniorHealthOptions.join(", ") ?? ""] : []),
              entry.phone ?? "",
              entry.website ?? "",
              entry.source.title,
              dateText(entry.source.date),
              entry.source.url,
              (entry.additionalSources ?? []).map(source => `${source.title}${source.date ? `, ${source.date}` : ""}: ${source.url}`).join("\n"),
              orgPage(entry.organizationsName),
            ]),
          ),
        ]);
      }),
      section("Finding licensed providers", [
        paragraph("Providers of home and community-based services are licensed under Minnesota Statutes chapter 245D by the Department of Human Services. There are too many to list here; use the official lookups below to find current licensed providers by county and service."),
        heading("Official lookups"),
        bullets(data.lookups.map(lookup => `${lookup.name}: ${lookup.what} (${lookup.url})`)),
      ]),
      licensed
        ? section("Active licenses by county", [
            paragraph(`From ${licensed.source.title}${licensed.date ? ` (${licensed.date})` : ""}: ${licensed.source.url}`),
            table(["County", "Active licenses"], Object.entries(licensed.byCounty).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => [name, count.toLocaleString("en-US")])),
          ])
        : section(undefined, []),
    ]),
    sources: uniqueSources([
      ...data.categories.flatMap(category => category.entries.flatMap(entry => [entry.source, ...(entry.additionalSources ?? [])])).map(source => ({ title: source.title, href: source.url, note: source.date })),
      ...(licensed ? [{ title: licensed.source.title, href: licensed.source.url, note: licensed.date }] : []),
      ...data.lookups.map(lookup => ({ title: lookup.name, href: lookup.url, note: lookup.what })),
    ]),
  });
}

function systemConnectionsDocument(scope: StaffProgramScope): ResourceDocument {
  const data = getSystemConnections();
  const sourceCells = (source: SystemSource) => [source.title, dateText(source.date), source.url];
  const all: SystemSource[] = [
    ...data.structure.map(item => item.source),
    ...data.leadAgencyTypes.map(item => item.source),
    ...data.divisionRoles.flatMap(item => [item.source, ...(item.alsoSee ?? [])]),
    ...data.departmentRoles.map(item => item.source),
    ...data.referralPaths.map(item => item.source),
    data.tribalNations.source,
    data.tribalNations.relationshipSource,
  ].filter(Boolean);
  return outreachDocument(scope, {
    title: "How the system connects",
    subtitle: "Minnesota disability services are state-supervised and county-administered. The Department of Human Services sets policy and pays for services; the Disability Services Division leads the disability programs; lead agencies assess people and manage their services; and licensed providers deliver them. This page shows how those parts connect, with a source for each point.",
    meta: [{ label: "Facts checked", value: dateText(data.checked) }],
    sections: compactSections([
      section("Inside the Department of Human Services", [
        paragraph("The administrations, divisions and offices that connect to disability services, and what each one does in that connection."),
        table(
          ["Name", "Kind", "What it does for disability services", "Connection to the Disability Services Division", "Source", "Source date", "Source link"],
          data.structure.map(item => [item.name, item.kind, item.whatItDoesForDisabilityServices, item.connectionToDivision, ...sourceCells(item.source)]),
        ),
      ]),
      section("What a lead agency is", [
        table(
          ["Type", "Description", "Examples", "Programs", "Source", "Source date", "Source link"],
          data.leadAgencyTypes.map(item => [item.type, item.description, (item.examples ?? []).join("; "), (item.programs ?? []).join("; "), ...sourceCells(item.source)]),
        ),
      ]),
      section("What the Disability Services Division does with lead agencies", [
        table(
          ["Role", "Description", "How lead agencies experience it", "Source", "Source date", "Source link", "Also see"],
          data.divisionRoles.map(item => [item.role, item.description, item.howLeadAgenciesExperienceIt, ...sourceCells(item.source), (item.alsoSee ?? []).map(extra => `${extra.title}: ${extra.url}`).join("\n")]),
        ),
      ]),
      section("What the Department of Human Services does with lead agencies", [
        table(["Role", "Description", "Source", "Source date", "Source link"], data.departmentRoles.map(item => [item.role, item.description, ...sourceCells(item.source)])),
        paragraph("Plan a legislatively required working group — program page /equity-review/working-group-plan: the Waiver Case Management Advisory Working Group's charge turned into a month-by-month plan."),
      ]),
      section("How people are referred", [
        table(["From", "To", "When", "Source", "Source date", "Source link"], data.referralPaths.map(item => [item.from, item.to, item.when, ...sourceCells(item.source)])),
      ]),
      section("Tribal Nations", [
        ...data.tribalNations.lines.map(line => paragraph(line)),
        callout(data.tribalNations.note),
        paragraph(TRIBAL_GUIDANCE),
        data.tribalNations.source ? paragraph(`Source: ${data.tribalNations.source.title}${data.tribalNations.source.date ? `, ${data.tribalNations.source.date}` : ""} (${data.tribalNations.source.url})`) : null,
      ]),
      section("Plain-language glossary", [
        table(["Term", "In plain language"], data.glossary.map(item => [item.term, item.plain])),
        paragraph(`Facts checked on ${dateText(data.checked)}. Organizational structures change; confirm current names with the department.`),
      ]),
    ]),
    sources: uniqueSources(all.map(source => ({ title: source.title, href: source.url, note: source.date }))),
  });
}

function sourcingDocument(scope: StaffProgramScope): ResourceDocument {
  const titles = communityTitles();
  return outreachDocument(scope, {
    title: "Where to reach people",
    subtitle: "Places to find job candidates, share information and involve community members across Minnesota: colleges, workforce programs, professional associations, media, community places and events.",
    meta: [
      { label: "Sources", value: String(SOURCING_CATEGORIES.reduce((sum, category) => sum + category.entries.length, 0)) },
      { label: "Facts checked", value: dateText(SOURCING_CHECKED) },
    ],
    sections: compactSections([
      section(undefined, [
        callout(`These are possible sources, not partners. Being listed does not mean a source works with the Department of Human Services or speaks for a community. Where a public record of a connection exists, the entry says so. Facts were checked on ${dateText(SOURCING_CHECKED)}; confirm current details before you rely on them.`),
        paragraph("For Tribal colleges, Tribal Nations and Native American organizations, contact the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation."),
        paragraph(TRIBAL_GUIDANCE),
      ]),
      ...SOURCING_CATEGORIES.map(category =>
        section(category.title, [
          paragraph(category.intro),
          table(
            ["Name", "Also known as", "Kind", "Region", "Uses", "What it is", "How to use it", "Languages", "Communities", "Contact", "Website", "Department of Human Services record", "Checked"],
            category.entries.map(entry => [
              entry.name,
              entry.alsoKnownAs ?? "",
              entry.kind,
              entry.region,
              entry.uses.join(", "),
              entry.what,
              entry.howToUse,
              (entry.languages ?? []).join(", "),
              entry.communities.filter(id => titles.has(id)).map(id => titles.get(id)!).join(", "),
              entry.contact ?? "",
              entry.website ?? "",
              entry.dhsRecord ?? "",
              dateText(entry.checked),
            ]),
          ),
        ]),
      ),
    ]),
    sources: uniqueSources(SOURCING_CATEGORIES.flatMap(category => category.entries.filter(entry => entry.website).map(entry => ({ title: entry.name, href: entry.website, note: `Checked ${dateText(entry.checked)}` })))),
  });
}

function planDocument(scope: StaffProgramScope): ResourceDocument {
  const blankField = (field: { label: string; help?: string }): DocumentBlock[] => [
    heading(field.label),
    ...(field.help ? [paragraph([{ text: field.help, italic: true }])] : []),
    paragraph("______________________________________________"),
  ];
  return outreachDocument(scope, {
    title: "Plan an engagement",
    subtitle: "Answer these questions before you reach out. Then draft your engagement and report-back plan.",
    meta: [{ label: "Page", value: "program page /community-outreach/plan" }],
    sections: compactSections([
      section(undefined, [callout("This copy is blank. Keep it with your own working records.")]),
      section("Before you reach out", BEFORE_YOU_REACH_OUT.flatMap((group): DocumentBlock[] => [heading(group.title), bullets(group.items)])),
      section("Practice before you plan", [
        paragraph("Think through each situation, then compare your thinking with the reasoning."),
        ...OUTREACH_PRACTICE.flatMap((item, index): DocumentBlock[] => [heading(`Situation ${index + 1}`), paragraph(item.question), paragraph([{ text: "Reasoning: ", bold: true }, { text: item.response }])]),
      ]),
      section("Engagement plan", PLAN_FIELDS.flatMap(blankField)),
      section("Report-back plan", [paragraph(REPORT_BACK_INTRO), ...REPORT_FIELDS.flatMap(blankField)]),
    ]),
  });
}

function policiesCatalogDocument(scope: StaffProgramScope): ResourceDocument {
  const data = getPoliciesData();
  const kinds = new Map(data.kinds.map(kind => [kind.id, kind.title]));
  return outreachDocument(scope, {
    title: "Policies that shape disability services",
    subtitle: "The statutes, rules, manual pages, waiver plans, department policies, bulletins, federal rules and reports that decide who gets home and community-based services in Minnesota, what they get, and who is responsible.",
    meta: [
      { label: "Policies", value: String(data.policies.length) },
      { label: "Facts checked", value: formatPolicyDate(data.checked) },
    ],
    sections: compactSections([
      section(undefined, [
        callout(`These are summaries written in plain language. The policy itself is the source document: each entry names it and links to it. Check the date on the source before relying on it, because policies change. Facts checked on ${formatPolicyDate(data.checked)}.`),
      ]),
      section("Kinds of policy", [table(["Kind", "What it covers", "Policies"], data.kinds.map(kind => [kind.title, kind.intro, String(data.policies.filter(policy => policy.kind === kind.id).length)]))]),
      section("All policies", [
        table(
          ["Policy", "Kind", "Programs", "Applies to", "Summary", "What it requires", "What to check for equity", "Effective", "Last updated", "Facts checked", "Source", "Source date", "Source link", "Topics", "Page"],
          data.policies.map(policy => [
            policy.title,
            kinds.get(policy.kind) ?? policy.kind,
            policy.programs.join(", "),
            policy.appliesTo.join(", "),
            policy.summary,
            policy.requires.join("\n"),
            policy.equityCheck.join("\n"),
            policy.effective ? formatPolicyDate(policy.effective) : "Not stated on the source",
            policy.lastUpdated ? formatPolicyDate(policy.lastUpdated) : "Not shown on the source",
            formatPolicyDate(policy.checked),
            policy.source.title,
            policy.source.date ? formatPolicyDate(policy.source.date) : "",
            policy.source.url,
            policy.tags.join(", "),
            policyHref(policy.id),
          ]),
        ),
      ]),
      section("Use a policy", [
        paragraph("How the system connects (program page /community-outreach/how-the-system-connects) shows where each policy sits between the Department of Human Services, lead agencies, providers and the people they serve. Equity review (program page /equity-review) holds the review tools. Analyze a policy document (program page /equity-review/analyze) to work through the text of a policy section by section."),
      ]),
    ]),
    sources: uniqueSources(data.policies.map(policy => ({ title: policy.source.title, href: policy.source.url, note: policy.source.date ? formatPolicyDate(policy.source.date) : undefined }))),
  });
}

const MEASURE_HEADINGS: Record<MeasureId, string> = {
  population: "Share of the county's population",
  services: "Share of people receiving home and community-based services",
  comparison: "Services compared with population (times)",
  "earned-income": "Earned income",
};

function measureCell(fips: string, group: GroupId, measure: MeasureId): string {
  const value = measureFor(fips, group, measure);
  if (value.status !== "ok") return statusText(value.status);
  return formatValue(measure, value.value);
}

function countyMapDocument(scope: StaffProgramScope): ResourceDocument {
  const data = getCountyData();
  const measureNotes = (Object.entries(data.measures) as Array<[string, (typeof data.measures)[keyof typeof data.measures]]>).map(([, meta]) =>
    [meta.label, [meta.date, meta.compareDate ? `compared with ${meta.compareDate}` : "", meta.ages ?? ""].filter(Boolean).join("; "), [meta.method, meta.populationFilterPlain, meta.note].filter(Boolean).join(" "), meta.source ?? ""],
  );
  const sourceTitle = new Map(data.sources.map(source => [source.id, source.title]));
  return outreachDocument(scope, {
    title: "Minnesota county map",
    subtitle: "Compare each county's population with the people receiving home and community-based services, by race and ethnicity. A difference is a question to look into, not an explanation.",
    meta: [
      { label: "Places", value: `${data.places.length} (statewide and each county)` },
      { label: "Built on", value: dateText(data.builtOn) },
    ],
    sections: compactSections([
      section("What the figures mean", [
        table(["Measure", "Dates", "How it is worked out", "Source"], measureNotes.map(([label, dates, how, source]) => [label, dates, how, sourceTitle.get(source) ?? source])),
        heading("Definitions"),
        bullets([data.definitions.county, data.definitions.suppression, data.definitions.notReported, data.definitions.otherReportingUnitsNote].filter(Boolean)),
        data.definitions.countiesWithoutSeparateServiceRows.length
          ? paragraph(`Counties without separate service figures: ${data.definitions.countiesWithoutSeparateServiceRows.join(", ")}.`)
          : null,
      ]),
      section("County figures", [
        table(
          [
            "Place",
            "County code",
            "Group",
            "Total population (2025)",
            MEASURE_HEADINGS.population,
            "Share of the county's population (2018)",
            MEASURE_HEADINGS.services,
            "People in the group receiving services",
            "All people receiving services in the place",
            MEASURE_HEADINGS.comparison,
            MEASURE_HEADINGS["earned-income"],
          ],
          data.places.flatMap(place =>
            GROUP_IDS.map(group => {
              const g = place.groups[group];
              return [
                place.name,
                place.fips,
                groupLabel(group),
                formatCount(place.totalPopulation2025),
                measureCell(place.fips, group, "population"),
                group === "all" ? statusText("not-applicable") : g?.population.share2018 != null ? formatValue("population", g.population.share2018) : statusText("not-reported"),
                measureCell(place.fips, group, "services"),
                g?.services.count != null ? formatCount(g.services.count) : g?.services.suppressed ? statusText("suppressed") : "",
                formatCount(g?.services.countyCount ?? null),
                measureCell(place.fips, group, "comparison"),
                measureCell(place.fips, group, "earned-income"),
              ];
            }),
          ),
        ),
      ]),
      section("Measures in this table", [bullets(MEASURE_IDS.map(id => `${MEASURE_HEADINGS[id]}: ${data.measures[id].label}`))]),
    ]),
    sources: data.sources.map(source => ({ title: source.title, href: source.url, note: [source.publisher, source.date, source.pageName].filter(Boolean).join("; ") })),
  });
}

/** Native community pages are excluded from coverage rows (owner rule). */
export async function communityCoverageDocument(scope: StaffProgramScope): Promise<ResourceDocument | null> {
  const { leadersAllowed } = await import("@/lib/auth/leaders-access");
  if (!(await leadersAllowed())) return null;
  const [{ BRIEFS }, { CROSSWALK_BY_ID }, { NO_PUBLISHED_RECORD }] = await Promise.all([
    import("@/lib/content/briefs"),
    import("@/lib/content/hub/community-coverage"),
    import("@/lib/content/hub/record-findings"),
  ]);
  const today = "2026-11-05";
  const rows = communityDesignEntries().filter(entry => !isNativeCommunity(entry.id)).map(entry => {
    const brief = BRIEFS.find(b => b.id === entry.id);
    const orgs = ORGANIZATIONS.filter(org => org.communities.includes(entry.id) && !org.closed);
    return { id: entry.id, title: entry.title, brief, orgs, divisionOrgs: orgs.filter(hasDivisionRecord), figures: CROSSWALK_BY_ID.get(entry.id) };
  });
  const noOrgs = rows.filter(row => row.divisionOrgs.length === 0);
  const pendingReview = rows.filter(row => row.brief && row.brief.representationReview !== "reviewed");
  const overdue = rows.filter(row => row.brief && row.brief.reviewDate < today);
  return outreachDocument(scope, {
    kickerNoun: "Leaders' space",
    title: "Community coverage",
    subtitle: "Where the program and the Disability Services Division have gaps: communities with no organization on record, communities without figures, and briefs that members of the community have not yet reviewed.",
    meta: [{ label: "Research date", value: "November 5, 2026" }],
    sections: compactSections([
      section(undefined, [
        callout("These are findings about the system, not about any community. A missing organization means no published record of a connection was found, not that the community lacks organizations."),
      ]),
      section("Summary", [
        bullets([
          `${noOrgs.length} of ${rows.length} communities have no current organization with a published record naming the Disability Services Division.`,
          `${pendingReview.length} of ${rows.filter(row => row.brief).length} briefs are waiting for a review by members of the community.`,
          `${overdue.length} briefs are past their review date.`,
        ]),
      ]),
      section("By community", [
        table(
          ["Community", "Organizations on record", "Figures", "Community review", "Review date", "Page"],
          rows.map(row => [
            row.title,
            row.orgs.length ? row.orgs.map(org => `${org.name}${hasDivisionRecord(org) ? "" : " (Department of Human Services record)"}`).join(", ") : "None found",
            row.figures ?? "None",
            row.brief ? (row.brief.representationReview === "reviewed" ? "Reviewed" : "Not yet reviewed") : "No brief",
            row.brief ? `${dateText(row.brief.reviewDate)}${row.brief.reviewDate < today ? " (past)" : ""}` : "",
            `/minnesota-communities/${row.id}`,
          ]),
        ),
      ]),
      section("No published record found", [
        paragraph("Research on November 5, 2026 looked for published records of these relationships and found none. Someone inside the Department of Human Services may know more; add what you can confirm."),
        table(["Subject", "Finding"], NO_PUBLISHED_RECORD.map(item => [item.subject, item.finding])),
      ]),
      section("How a community review works", [
        numbered([
          "Invite two or more members of the community to review the brief, through an organization they choose or directly. Do not ask one person to speak for everyone.",
          "Offer compensation and supports through approved arrangements, and confirm them before the review starts.",
          "Ask reviewers to check names and terms, how people differ within the community, history, what staff are told to ask, and anything that could lead to a stereotype.",
          "Record what changed because of the review, and tell the reviewers.",
          "Mark the brief as reviewed and set the next review date. Plan a fresh review at least every two years, or sooner when something important changes.",
        ]),
        paragraph("Native American and Tribal Nation pages are not part of this review. They defer to the Office of Indian Affairs and the Department of Human Services offices that handle Tribal relations and consultation."),
      ]),
    ]),
    sources: uniqueSources(ORGANIZATIONS.filter(org => rows.some(row => row.orgs.includes(org))).flatMap(org => org.records.map(record => ({ title: record.title, href: record.url, note: record.date })))),
  });
}

export const COMMUNITY_OUTREACH_IDS = [
  "home",
  "organizations",
  "county-agencies",
  "providers",
  "how-the-system-connects",
  "sources",
  "plan",
  "policies",
  "county-map",
  "community-coverage",
] as const;

export async function communityOutreachDocument(id: string, scope: StaffProgramScope): Promise<ResourceDocument | null> {
  switch (id) {
    case "home":
      return homeDocument(scope);
    case "organizations":
      return organizationsDirectoryDocument(scope);
    case "county-agencies":
      return countyAgenciesDocument(scope);
    case "providers":
      return providersDocument(scope);
    case "how-the-system-connects":
      return systemConnectionsDocument(scope);
    case "sources":
      return sourcingDocument(scope);
    case "plan":
      return planDocument(scope);
    case "policies":
      return policiesCatalogDocument(scope);
    case "county-map":
      return countyMapDocument(scope);
    case "community-coverage":
      return communityCoverageDocument(scope);
    default:
      return null;
  }
}

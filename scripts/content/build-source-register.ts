/**
 * Source register: every evidence citation the program carries, correlated to the resources that rely on it.
 * Explicit maintenance build, run through scripts/content/source-register.config.mts. Reads only program
 * content in code and data; writes data/source-register/source-register.json and a summary under evidence/.
 * It records citations as they stand. It does not fetch or verify any source.
 */
import { it, expect } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { REFERRAL_ONLY_COURSE_IDS } from "@/lib/program/retired-features";
import { reviewResources, structuralReviewResource } from "@/lib/program/review-resources";
import { practiceGuides } from "@/lib/program/dsd-practice-guides";
import { CLAS_SOURCE } from "@/lib/content/clas-planning";
import { AUTHORED_COURSES, RECOVERED_COURSES } from "@/lib/content/courses/definitions";
import { BRIEFS } from "@/lib/content/briefs";
import { CORPUS } from "@/lib/content/corpus";
import { DOMAIN_CORPUS } from "@/lib/content/corpus-domains";
import { EQUITY_FRAMEWORK } from "@/lib/program/equity-framework";
import { GRADUATION_PATHS } from "@/lib/content/paths";
import { clarifyPracticePath } from "@/lib/content/practice-path-clarifications";
import { getEditableSurfaceDefinition } from "@/lib/content/staff-surface-registry";
import dhsReference from "@/data/organization/minnesota-dhs.json";
import { normalizeSourceHref as normalizeHref } from "@/lib/content/source-register";

type ResourceType = "authored_course" | "recovered_course" | "self_directed_course" | "review_resource" | "practice_guide" | "community_brief" | "corpus_item" | "domain_corpus_item" | "equity_framework" | "dhs_reference" | "practice_path" | "editable_surface";
type SourceKind = "external" | "program_route" | "program_document" | "legal_citation" | "placeholder";
type Citation = { resourceType: ResourceType; resourceId: string; resourceTitle: string; route: string; note: string; role: string };
type SourceEntry = {
  sourceId: string; title: string; href: string | null; host: string | null; kind: SourceKind;
  verification: "cited_unverified" | "program_document" | "program_route" | "legal_citation" | "checked_on_date" | "placeholder"; checkedOn?: string;
  citations: Citation[];
};
type ResourceEntry = { resourceType: ResourceType; resourceId: string; title: string; route: string; sourceIds: string[]; externalCount: number; programDocumentCount: number; programRouteCount: number; placeholderCount: number; links: string[]; publicationDisposition?: "active" | "referral_only"; learningLevel?: string; sourceMetadataOrigin?: string };

const sources = new Map<string, SourceEntry>();
const resources = new Map<string, ResourceEntry>();

function slug(text: string): string { return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }
function resourceKey(type: ResourceType, id: string) { return `${type}:${id}`; }

function resource(entry: Omit<ResourceEntry, "sourceIds" | "externalCount" | "programDocumentCount" | "programRouteCount" | "placeholderCount" | "links"> & { links?: string[] }): ResourceEntry {
  const key = resourceKey(entry.resourceType, entry.resourceId);
  let row = resources.get(key);
  if (!row) { row = { ...entry, sourceIds: [], externalCount: 0, programDocumentCount: 0, programRouteCount: 0, placeholderCount: 0, links: entry.links ?? [] }; resources.set(key, row); }
  return row;
}

function cite(input: { title: string; href?: string | null; note?: string; role: string; checkedOn?: string; programDocument?: boolean }, at: ResourceEntry) {
  const href = normalizeHref(input.href);
  const rawHref = (input.href ?? "").trim();
  const isRoute = /^\/(?!\/)/.test(rawHref);
  const isLegal = /\b(Pub\. L\.|U\.S\.C\.|Stat\.|Minn\. Stat\.|Minnesota Statutes|C\.F\.R\.|Act of \d{4})\b/.test(input.title);
  const placeholder = !href && !isRoute && (rawHref === "" || rawHref === "#") && !input.programDocument && !isLegal;
  const kind: SourceKind = href ? "external" : isRoute ? "program_route" : isLegal ? "legal_citation" : placeholder ? "placeholder" : "program_document";
  const sourceId = href ? `url:${href}` : isRoute ? `route:${rawHref}` : `title:${slug(input.title)}`;
  let entry = sources.get(sourceId);
  if (!entry) {
    entry = {
      // Keep the address as the resource wrote it (the runner checks that exact address); the normalized form is only the key.
      sourceId, title: isRoute && rawHref === "/courses/dc-l24-unintended-consequences-anticipating-harm-in-pol" ? "One DSD: Anticipating unintended effects—trying out a proposal" : input.title.trim(), href: href ? rawHref : (isRoute ? rawHref : null), host: href ? new URL(href).hostname : null, kind,
      verification: input.checkedOn ? "checked_on_date" : kind === "external" ? "cited_unverified" : kind,
      ...(input.checkedOn ? { checkedOn: input.checkedOn } : {}), citations: [],
    };
    sources.set(sourceId, entry);
  } else if (input.checkedOn && !entry.checkedOn) { entry.checkedOn = input.checkedOn; entry.verification = "checked_on_date"; }
  const already = entry.citations.some(c => c.resourceType === at.resourceType && c.resourceId === at.resourceId && c.role === input.role);
  if (!already) entry.citations.push({ resourceType: at.resourceType, resourceId: at.resourceId, resourceTitle: at.title, route: at.route, note: (input.note ?? "").trim(), role: input.role });
  if (!at.sourceIds.includes(sourceId)) {
    at.sourceIds.push(sourceId);
    if (entry.kind === "external") at.externalCount += 1; else if (entry.kind === "placeholder") at.placeholderCount += 1; else if (entry.kind === "program_route") at.programRouteCount += 1; else at.programDocumentCount += 1;
  }
}

it("builds the source register from every citation the program carries", () => {
  for (const [type, packs] of [["authored_course", AUTHORED_COURSES], ["recovered_course", RECOVERED_COURSES]] as const) {
    for (const pack of packs) {
      const at = resource({ resourceType: type, resourceId: pack.course.id, title: pack.course.title, route: `/courses/${pack.course.id}`, publicationDisposition: REFERRAL_ONLY_COURSE_IDS.has(pack.course.id) ? "referral_only" : "active" });
      for (const source of pack.sources) cite({ title: source.title, href: source.href, note: source.note, role: "course source" }, at);
    }
  }
  // Read only the actual player's metadata. Do not import slide/narration bodies into
  // the application or invent sources/dates from a title, cover or review claim.
  const browserPath = "public/learning/self-directed/index.html";
  const browser = readFileSync(browserPath, "utf8");
  const metadataText = browser.match(/<script\b[^>]*\bid=["']course-data["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  expect(metadataText, "Actual self-directed player metadata is required").toBeTruthy();
  type SelfDirectedMetadata = { number:string; title:string; level:string; dataFile:string; filename:string; sources:Array<{title:string;url?:string;note?:string}> };
  const selfDirected = JSON.parse(metadataText!) as SelfDirectedMetadata[];
  const catalog = JSON.parse(readFileSync("lib/content/self-directed-data.json", "utf8")) as Array<{number:string;title:string;level:string}>;
  expect(selfDirected).toHaveLength(72);
  expect(catalog).toHaveLength(72);
  expect(new Set(catalog.map(course=>course.number)).size).toBe(72);
  expect(new Set(selfDirected.map(course=>course.number)).size).toBe(72);
  for (const level of ["Foundation", "Intermediate", "Advanced"]) expect(selfDirected.filter(course=>course.level===level)).toHaveLength(24);
  for (const course of selfDirected) {
    expect(course.number).toMatch(/^[FIA](?:0[1-9]|1[0-9]|2[0-4])$/);
    expect(catalog.find(item=>item.number===course.number)?.title).toBe(course.title);
    expect(catalog.find(item=>item.number===course.number)?.level).toBe(course.level);
    expect(course.dataFile).toMatch(/^data\/[FIA]\d{2}-[a-f0-9]+\.json$/);
    expect(course.filename).toMatch(/^courses\/[^/\\]+\.pptx$/);
    const path = resolve("public/learning/self-directed", course.dataFile);
    const current = JSON.parse(readFileSync(path,"utf8")) as SelfDirectedMetadata;
    expect(current.number).toBe(course.number);
    expect(current.title).toBe(course.title);
    // The reviewed A13 slide data retains an older display title for this same
    // internal course. The live player has the current title and is the source
    // register's documented metadata authority. Do not ignore any other drift.
    const comparableSources = course.number === "A13" ? current.sources.map(source =>
      source.url === "/courses/ipe-34-co-design-partnership" && source.title === "One DSD: Co-design and Compensated Partnership"
        ? { ...source, title: "One DSD: Designing Together and Paying for Partnership" }
        : source,
    ) : current.sources;
    expect(comparableSources).toEqual(course.sources);
    expect(existsSync(resolve("public/learning/self-directed",course.filename))).toBe(true);
    const at = resource({resourceType:"self_directed_course",resourceId:"self-directed-"+course.number,title:course.title,route:"/learning/self-directed/index.html?course="+course.number,publicationDisposition:"active",learningLevel:course.level,sourceMetadataOrigin:browserPath+"#course-data"});
    for (const source of course.sources ?? []) cite({title:source.title || "Unnamed source",href:source.url,note:source.note,role:"self-directed course source"},at);
  }
  for (const item of reviewResources) {
    const at=resource({resourceType:"review_resource",resourceId:item.id,title:item.title,route:item.href,sourceMetadataOrigin:"lib/program/review-resources.ts"});
    cite({title:item.title+": retained program artifact",href:item.file,role:"program artifact",note:"A retained program-authored tool or guide, not external authority or independent source review."},at);
  }
  resource({resourceType:"review_resource",resourceId:structuralReviewResource.id,title:structuralReviewResource.title,route:structuralReviewResource.href,sourceMetadataOrigin:"lib/program/review-resources.ts"});
  for (const guide of practiceGuides) {
    const at=resource({resourceType:"practice_guide",resourceId:guide.slug,title:guide.title,route:"/practice-guides/"+guide.slug,sourceMetadataOrigin:"lib/program/dsd-practice-guides.ts"});
    for (const link of guide.resources) cite({title:link.title,href:link.href,note:link.purpose,role:"related practice resource"},at);
  }
  const clasPlan=resource({resourceType:"practice_guide",resourceId:"clas-planning",title:"Cultural and language access planning",route:"/practice/clas",sourceMetadataOrigin:"Program-authored preparation prompts"});
  cite({title:CLAS_SOURCE.title,href:CLAS_SOURCE.href,role:"framework reference",note:"Confirm current standards and context; this planning tool does not determine binding applicability or compliance."},clasPlan);
  cite({title:"Language and cultural access planning aid",href:"/resources/ja-language-cultural-access-planning",role:"related practice resource"},clasPlan);
  for (const brief of BRIEFS) {
    const at = resource({ resourceType: "community_brief", resourceId: brief.id, title: brief.title, route: `/minnesota-communities/${brief.id}` });
    for (const source of brief.sources) cite({ title: source.label, href: source.href, note: source.note, role: "brief source" }, at);
  }
  for (const [type, items] of [["corpus_item", CORPUS], ["domain_corpus_item", DOMAIN_CORPUS]] as const) {
    for (const item of items) {
      const at = resource({ resourceType: type, resourceId: item.id, title: item.title, route: `/library/${item.id}` });
      if (item.href && normalizeHref(item.href)) cite({ title: item.sourceName ? `${item.sourceName}: ${item.title}` : item.title, href: item.href, note: item.summary, role: "item is a tool card or external resource" }, at);
      if (item.provenance) cite({ title: item.provenance.length > 140 ? item.provenance.slice(0, 137) + "..." : item.provenance, note: item.provenance, role: "provenance", programDocument: true }, at);
      for (const action of item.nextActions ?? []) if (normalizeHref(action.href)) cite({ title: action.label, href: action.href, role: "next action link" }, at);
    }
  }
  const framework = resource({ resourceType: "equity_framework", resourceId: "equity-framework", title: "Equity Framework", route: "/equity-framework" });
  for (const line of EQUITY_FRAMEWORK.bibliography) {
    const url = line.match(/https?:\/\/[^\s]+?(?=\.?\s*$|\.$)/)?.[0] ?? null;
    cite({ title: line.replace(/\s*https?:\/\/[^\s]+\.?$/, "").trim(), href: url, note: line, role: "bibliography", programDocument: /^One DHS People, Access and Culture Program/.test(line) }, framework);
  }
  for (const source of dhsReference.sources as Array<{ id: string; title: string; url: string; checkedOn: string }>) {
    const users = (dhsReference.entries as Array<{ id: string; title: string; sourceIds: string[] }>).filter(entry => entry.sourceIds.includes(source.id));
    for (const entry of users) {
      const at = resource({ resourceType: "dhs_reference", resourceId: entry.id, title: entry.title, route: `/understanding-dhs#${entry.id.replace(/^ext-dhs-org-/, "")}` });
      cite({ title: source.title, href: source.url, role: "reference source", checkedOn: source.checkedOn }, at);
    }
  }
  for (const path of GRADUATION_PATHS.map(clarifyPracticePath)) {
    const links = path.steps.flatMap(step => step.links.map(link => link.href));
    const at=resource({ resourceType: "practice_path", resourceId: path.id, title: path.title, route: `/practice/${path.id}`, links });
    for (const step of path.steps) for (const link of step.links) cite({title:link.label,href:link.href,role:"related practice resource",note:"Existing pathway reference used during "+step.title+". A related resource is not itself proof of required review or authority."},at);
  }
  for (const surfaceId of ["learn.hub", "equity-toolkit.home"]) {
    const definition = getEditableSurfaceDefinition(surfaceId);
    if (!definition) continue;
    const at = resource({ resourceType: "editable_surface", resourceId: surfaceId, title: definition.label ?? surfaceId, route: definition.route ?? `/consultant/content/${surfaceId}` });
    for (const [key, value] of Object.entries(definition.approvedValues)) {
      if (!Array.isArray(value)) continue;
      for (const item of value as unknown[]) {
        if (item && typeof item === "object" && "href" in item && "label" in item && normalizeHref(String((item as { href: string }).href))) cite({ title: String((item as { label: string }).label), href: String((item as { href: string }).href), role: `link list (${key})` }, at);
      }
    }
  }

  const sourceRows = [...sources.values()].sort((a, b) => b.citations.length - a.citations.length || a.title.localeCompare(b.title));
  const resourceRows = [...resources.values()].sort((a, b) => a.resourceType.localeCompare(b.resourceType) || a.title.localeCompare(b.title));
  const hosts = new Map<string, { host: string; sources: number; citations: number }>();
  for (const row of sourceRows) if (row.host) { const h = hosts.get(row.host) ?? { host: row.host, sources: 0, citations: 0 }; h.sources += 1; h.citations += row.citations.length; hosts.set(row.host, h); }
  const byType = new Map<string, { resources: number; withExternal: number; withNone: number }>();
  for (const row of resourceRows) { const t = byType.get(row.resourceType) ?? { resources: 0, withExternal: 0, withNone: 0 }; t.resources += 1; if (row.externalCount > 0) t.withExternal += 1; if (row.sourceIds.length === 0) t.withNone += 1; byType.set(row.resourceType, t); }
  const register = {
    builtAt: new Date().toISOString(),
    scope: "Citations as they stand in program code and data on the build date. Nothing here was fetched or verified during the build.",
    verificationStates: { cited_unverified: "An outside address cited at authoring and not yet checked by the program.", checked_on_date: "An outside address the program checked on the recorded date (Understanding DHS reference).", program_document: "A program-authored or internal document, or a provenance note.", program_route: "A citation that points to another page inside the program.", legal_citation: "A statute or regulation cited by name without an address.", placeholder: "A citation with no address, kept as the source text left it." },
    totals: { sources: sourceRows.length, external: sourceRows.filter(s => s.kind === "external").length, programDocuments: sourceRows.filter(s => s.kind === "program_document").length, programRoutes: sourceRows.filter(s => s.kind === "program_route").length, legalCitations: sourceRows.filter(s => s.kind === "legal_citation").length, placeholders: sourceRows.filter(s => s.kind === "placeholder").length, citations: sourceRows.reduce((n, s) => n + s.citations.length, 0), resources: resourceRows.length, resourcesWithoutSources: resourceRows.filter(r => r.sourceIds.length === 0).length, hosts: hosts.size },
    byResourceType: Object.fromEntries(byType),
    courseCoverage: { nativeResources: AUTHORED_COURSES.length+RECOVERED_COURSES.length, nativeActive: resourceRows.filter(r=>["authored_course","recovered_course"].includes(r.resourceType)&&r.publicationDisposition==="active").length, referralOnly: resourceRows.filter(r=>r.publicationDisposition==="referral_only").length, selfDirected: selfDirected.length, activeTotal: resourceRows.filter(r=>r.publicationDisposition==="active").length },
    hosts: [...hosts.values()].sort((a, b) => b.citations - a.citations),
    sources: sourceRows,
    resources: resourceRows,
  };
  expect(sourceRows.length).toBeGreaterThan(200);
  expect(resourceRows.length).toBeGreaterThan(100);
  expect(resourceRows.filter(r=>r.resourceType==="self_directed_course")).toHaveLength(72);
  expect(resourceRows.filter(r=>r.publicationDisposition==="referral_only")).toHaveLength(REFERRAL_ONLY_COURSE_IDS.size);
  mkdirSync("data/source-register", { recursive: true });
  writeFileSync("data/source-register/source-register.json", JSON.stringify(register, null, 1) + "\n");
});

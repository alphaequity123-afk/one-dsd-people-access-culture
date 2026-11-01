import "server-only";
import { createHash } from "node:crypto";
import organizationReference from "@/data/organization/minnesota-dhs.json";
import { ADMINISTRATION_NAVIGATION, organizationTopics } from "@/lib/product/organization-navigation";
import { WORK_AREAS } from "@/lib/product/work-areas";
import { WORK_AREA_DOMAINS } from "@/lib/domains/surfaces";
import { areaFieldKey, stringListValue, stringValue } from "@/lib/content/staff-surface-registry";
import { practiceGuides } from "@/lib/program/dsd-practice-guides";
import type { EditableSurfaceValues } from "@/lib/content/editable-surface-contract";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { EvidenceRevision } from "@/lib/content/ask-evidence";
import type { Doc } from "./search";

type PublicSurface = { surfaceId: string; values: EditableSurfaceValues; editorialEvidence?: EvidenceRevision[] };
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Only code-authored public guidance and currently published area fields;
 * never user-entered work, owner drafts or unpublished linked resources. */
export function dynamicPublicRouteDocs(scope: StaffProgramScope, publications: readonly PublicSurface[]): Doc[] {
  const ids = new Set(publications.map(row => row.surfaceId));
  const make = (id: string, title: string, href: string, summary: string, text: string, links: string[], payload: unknown, evidence?: EvidenceRevision[], external = false): Doc => ({
    kind: "content", id, title, href, summary, text, authority: external ? "external_verify" : "guidance", type: "public_route_detail",
    status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide", tags: [title, "public guidance"], intents: [], graphRelated: links,
    evidenceRevisions: evidence?.length ? evidence : [{ sourceId: id, revisionId: null, payloadHash: hash(payload), scope }],
  });
  const administrations = ADMINISTRATION_NAVIGATION.map(area => {
    const topics = organizationTopics(area.topics);
    const caution = "Organizational information can change. Check the current official sources before relying on roles or services.";
    const document = make(`public-administration-${area.id}`, area.name, `/administrations/${area.id}`, `${area.description} ${caution}`,
      [area.description, caution, ...topics.map(topic => `${topic.title}: ${topic.facts}`)].join("\n"),
      ["/learn", "/practice", "/practice/requirements", ...topics.map(topic => `/understanding-dhs#${topic.id.replace(/^ext-dhs-org-/, "")}`), ...(area.divisions.includes("dsd") ? ["/administrations/adsa/divisions/dsd", "/learn/equity-toolkit/goals"] : [])],
      {area, topics}, undefined, true);
    return { ...document, graphLinks: [...new Set(topics.flatMap(topic => topic.sourceIds.flatMap(id => { const source = organizationReference.sources.find(item => item.id === id); return source ? [source.url] : []; }))) ] };
  });
  const parent = publications.find(row => row.surfaceId === "areas.page");
  const areas = parent ? WORK_AREAS.map(area => {
    const label = stringValue(parent.values, areaFieldKey(area.id, "label"));
    const summary = stringValue(parent.values, areaFieldKey(area.id, "summary"));
    const tasks = stringListValue(parent.values, areaFieldKey(area.id, "tasks"));
    const domains = WORK_AREA_DOMAINS[area.id].filter(id => ids.has(`domain.${id}`));
    return make(`public-work-area-${area.id}`, label, `/areas/work/${area.id}`, summary, [label, summary, ...tasks].join("\n"),
      ["/areas", ...domains.map(id => `/areas/${id}`)], {label, summary, tasks, domains}, parent.editorialEvidence);
  }) : [];
  const guides = practiceGuides.map(guide => make(`public-practice-guide-${guide.slug}`, guide.title, `/practice-guides/${guide.slug}`, guide.summary,
    [guide.purpose, guide.introduction, ...guide.steps.flatMap(step => [step.title, step.body, step.question]), guide.example, guide.review,
      ...guide.resources.map(resource => `${resource.title}: ${resource.purpose}`)].join("\n"),
    ["/program/practice", ...guide.resources.map(resource => resource.href)], guide));
  return [...administrations, ...areas, ...guides];
}

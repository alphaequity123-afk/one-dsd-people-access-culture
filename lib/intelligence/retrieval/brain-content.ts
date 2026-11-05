import "server-only";
import { isNativeCommunity } from "@/lib/content/hub/organizations";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { researchPlainText } from "@/lib/content/research-markdown";
import { WATER_COURSE_HREF, WATER_COURSE_TITLE, WATER_ESSAY, WATER_MODULES } from "@/lib/content/water-we-swim-in";
import type { Doc } from "./search";
import clasCurriculum from "@/lib/content/clas-curriculum.json";
import equityCurriculum from "@/lib/content/equity-everyday-decisions.json";
import interculturalCurriculum from "@/lib/content/intercultural-curriculum.json";

/**
 * Content that staff can read but pages hold outside the publication registry: community research,
 * the self-directed curriculum and recorded lesson transcripts. Everything here is already public on this site.
 */
const SELF_DIRECTED_HREF = "/learning/self-directed/index.html";
const TRANSCRIPT_COLLECTIONS = [
  { folder: "clas-curriculum", title: "CLAS curriculum", href: "/learn/clas/curriculum", modules: clasCurriculum.modules },
  { folder: "equity-everyday-decisions", title: "Equity in everyday decisions", href: "/learn/equity-toolkit/curriculum", requiredSurface: "equity-toolkit.home", modules: equityCurriculum.modules },
  { folder: "intercultural-curriculum", title: "Intercultural understanding in everyday work", href: "/learn/intercultural/curriculum", requiredSurface: "learn.intercultural", modules: interculturalCurriculum.modules },
] as const;

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const flat = (value: unknown): string => typeof value === "string" ? value
  : Array.isArray(value) ? value.map(flat).filter(Boolean).join("\n")
  : value && typeof value === "object" ? Object.entries(value).filter(([key]) => !["href", "url", "src", "sourceHref", "width", "height"].includes(key)).map(([, child]) => flat(child)).filter(Boolean).join("\n") : "";
const hrefsIn = (value: unknown): string[] => Array.isArray(value) ? value.flatMap(hrefsIn)
  : value && typeof value === "object" ? Object.entries(value).flatMap(([key, child]) => (key === "url" || key === "href") && typeof child === "string" && child.startsWith("/") ? [child] : hrefsIn(child)) : [];

function doc(scope: StaffProgramScope, fields: Pick<Doc, "kind" | "id" | "title" | "href" | "authority" | "type" | "summary" | "text" | "tags" | "intents"> & { graphLinks?: string[]; graphRelated?: string[]; payload: unknown }): Doc {
  const { payload, ...rest } = fields;
  return { ...rest, status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide",
    evidenceRevisions: [{ sourceId: fields.id, revisionId: null, payloadHash: hash(payload), scope }] };
}

/** One document per person, institution, organization and disability brief, only for a community page that is published. */
export function communityResearchDocs(scope: StaffProgramScope, publishedCommunities: Doc[]): Doc[] {
  const folder = path.join(process.cwd(), "lib", "content", "community-research");
  const out: Doc[] = [];
  for (const page of publishedCommunities) {
    const id = page.href.split("/").pop()!;
    // Owner rule: Native community pages defer to the Office of Indian Affairs and are never given research content.
    if (isNativeCommunity(id)) continue;
    const file = path.join(folder, `${id}.json`);
    if (!existsSync(file)) continue;
    const research = JSON.parse(readFileSync(file, "utf8")) as {
      people?: Array<{ name: string; body?: unknown }>; institutions?: Array<{ name: string; body?: unknown }>;
      disability?: unknown; organizations?: { intro?: string; entries?: Array<{ name?: string; title?: string }> };
    };
    const entity = (type: string, label: string, index: number, value: object) => {
      const text = flat(value);
      out.push(doc(scope, {
        kind: "brief", id: `research-${id}-${type}-${index}`, title: `${page.title}: ${label}`, href: page.href,
        authority: "community_brief", type: "community_research", summary: text.slice(0, 360), text,
        tags: ["community research", page.title, label], intents: ["intercultural", "access_barriers"], payload: value,
      }));
    };
    research.people?.forEach((person, index) => entity("person", person.name, index, person));
    research.institutions?.forEach((place, index) => entity("institution", place.name, index, place));
    research.organizations?.entries?.forEach((org, index) => entity("organization", org.name ?? org.title ?? "Organization", index, org));
    if (research.disability) entity("disability", "disability and access", 0, research.disability);
    if (research.organizations?.intro) entity("organizations-overview", "organizations overview", 0, { intro: research.organizations.intro });
  }
  return out;
}

/** Long research sections become several documents, so a question can find the passage that answers it. */
function passages(markdown: string, size = 1500): string[] {
  const out: string[] = [];
  let current = "";
  for (const paragraph of researchPlainText(markdown).split(/\n\s*\n/)) {
    if (current && current.length + paragraph.length > size) { out.push(current); current = ""; }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current) out.push(current);
  return out;
}

/** Full community profiles and business lists, only for a community page that is published. */
export function communityProfileDocs(scope: StaffProgramScope, publishedCommunities: Doc[]): Doc[] {
  const folder = path.join(process.cwd(), "lib", "content", "community-360");
  const out: Doc[] = [];
  for (const page of publishedCommunities) {
    const id = page.href.split("/").pop()!;
    // Owner rule: Native community pages defer to the Office of Indian Affairs and are never given research content.
    if (isNativeCommunity(id)) continue;
    const file = path.join(folder, `${id}.json`);
    if (!existsSync(file)) continue;
    const profile = JSON.parse(readFileSync(file, "utf8")) as {
      sections: Array<{ id: string; heading: string; body: string }>; limits?: string;
      businesses?: Array<{ name: string; type: string; place: string; about: string; status: string }>;
    };
    const add = (key: string, heading: string, text: string, index: number) => out.push(doc(scope, {
      kind: "brief", id: `profile-${id}-${key}-${index}`, title: `${page.title}: ${heading}`, href: page.href,
      authority: "community_brief", type: "community_research", summary: text.slice(0, 360), text,
      tags: ["community profile", page.title, heading], intents: ["intercultural", "access_barriers"], payload: text,
    }));
    for (const section of profile.sections) passages(section.body).forEach((text, index) => add(section.id, section.heading, text, index));
    if (profile.limits) passages(profile.limits).forEach((text, index) => add("limits", "what the sources could not establish", text, index));
    const listing = (profile.businesses ?? []).map(item => `${item.name} (${[item.type, item.place].filter(Boolean).join(", ")}): ${item.about}${item.status === "open" ? "" : ` Status: ${item.status}.`}`).join("\n\n");
    if (listing) passages(listing).forEach((text, index) => add("businesses", "businesses", text, index));
  }
  return out;
}

/** One document per observance. Dates carry whether a source confirmed them. */
export function culturalCalendarDocs(scope: StaffProgramScope, publishedCommunities: Doc[]): Doc[] {
  const file = path.join(process.cwd(), "lib", "content", "cultural-calendar.json");
  if (!existsSync(file)) return [];
  const published = new Set(publishedCommunities.map(page => page.href.split("/").pop()!));
  const { titles, entries } = JSON.parse(readFileSync(file, "utf8")) as { titles: Record<string, string>; entries: Array<{
    id: string; name: string; alsoKnownAs: string[]; communities: string[]; capsule: string; dateRule: string; whatItMarks: string; howCelebrated: string; workplaceNote: string | null;
    dates: Array<{ date: string | null; endDate: string | null; confirmed: boolean }>;
  }> };
  return entries.filter(entry => entry.communities.some(id => published.has(id))).map(entry => {
    const communities = entry.communities.filter(id => published.has(id)).map(id => titles[id] ?? id);
    const dates = entry.dates.filter(date => date.date).map(date => `${date.date}${date.endDate ? ` to ${date.endDate}` : ""} (${date.confirmed ? "confirmed" : "expected, confirm before planning"})`).join("; ");
    const text = [entry.name, entry.alsoKnownAs.join("; "), `Communities: ${communities.join(", ")}`, entry.capsule, entry.dateRule, dates && `Dates: ${dates}`, entry.whatItMarks, entry.howCelebrated, entry.workplaceNote ?? ""].filter(Boolean).join("\n");
    return doc(scope, {
      kind: "content", id: `calendar-${entry.id.normalize("NFKD").replace(/[^a-z0-9-]/g, "")}`, title: `Cultural calendar: ${entry.name}`, href: `/minnesota-communities/calendar?month=all&community=${entry.communities.find(id => published.has(id))}`,
      authority: "community_brief", type: "cultural_calendar", summary: entry.capsule, text,
      tags: ["cultural calendar", "observance", ...communities], intents: ["intercultural"],
      graphRelated: entry.communities.filter(id => published.has(id)).map(id => `/minnesota-communities/${id}`), payload: entry,
    });
  });
}

/** The Water We Swim In: course modules and its essay. */
export function waterCourseDocs(scope: StaffProgramScope): Doc[] {
  const out: Doc[] = [];
  const add = (key: string, title: string, href: string, text: string) => out.push(doc(scope, {
    kind: "content", id: `water-${key}`, title, href, authority: "learning", type: "curriculum", summary: text.slice(0, 360), text,
    tags: ["The Water We Swim In", "Minnesota culture"], intents: ["intercultural"], graphRelated: [WATER_COURSE_HREF], payload: text,
  }));
  out.push(doc(scope, { kind: "content", id: "water-course-hub", title: WATER_COURSE_TITLE, href: WATER_COURSE_HREF,
    authority: "learning", type: "learning_navigation", summary: "A learning course about Minnesota culture and reflection.",
    text: [WATER_COURSE_TITLE, ...WATER_MODULES.map(module => module.title)].join("\n"), tags: ["Minnesota culture", "learning"], intents: ["intercultural"],
    graphRelated: WATER_MODULES.map(module => `${WATER_COURSE_HREF}/${module.slug}`), payload: WATER_MODULES.map(module => ({slug: module.slug, title: module.title})) }));
  WATER_MODULES.forEach(module => passages(module.body).forEach((text, index) => add(`${module.slug}-${index}`, `${WATER_COURSE_TITLE}: ${module.title}`, `${WATER_COURSE_HREF}/${module.slug}`, text)));
  WATER_ESSAY.sections.forEach(section => passages(section.body).forEach((text, index) => add(`essay-${section.id}-${index}`, `${WATER_COURSE_TITLE} essay: ${section.heading}`, `${WATER_COURSE_HREF}/essay`, text)));
  return out;
}

/** Only the course files selected by the public player are current. Old hashed
 * data files can remain alongside them and must not become searchable. */
export function selfDirectedCurriculumDocs(scope: StaffProgramScope, root = path.join(process.cwd(), "public", "learning", "self-directed")): Doc[] {
  const player = path.join(root, "index.html");
  if (!existsSync(player)) return [];
  const metadata = readFileSync(player, "utf8").match(/<script\b[^>]*\bid=["']course-data["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!metadata) return [];
  let courses: unknown;
  try { courses = JSON.parse(metadata); } catch { return []; }
  if (!Array.isArray(courses)) return [];
  const out: Doc[] = [];
  const seen = new Set<string>();
  for (const item of courses) {
    if (!item || typeof item !== "object") continue;
    const { number, dataFile } = item as { number?: unknown; dataFile?: unknown };
    if (typeof number !== "string" || !/^[FIA](?:0[1-9]|1[0-9]|2[0-4])$/.test(number) || seen.has(number)
      || typeof dataFile !== "string" || !new RegExp(`^data/${number}-[a-f0-9]{12}\\.json$`).test(dataFile)) continue;
    seen.add(number);
    const file = path.join(root, dataFile);
    if (!existsSync(file)) continue;
    let course: { number?: string; title?: string; audience?: string; outcomes?: unknown; slides?: Array<{ text?: string; narration?: string; hidden?: boolean }>; sources?: unknown };
    try { course = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
    if (course.number !== number || !course.title || !Array.isArray(course.slides)) continue;
    const text = [course.title, flat(course.outcomes), ...course.slides.filter(slide => !slide.hidden).flatMap(slide => [slide.text ?? "", slide.narration ?? ""])].filter(Boolean).join("\n");
    out.push(doc(scope, {
      kind: "content", id: `curriculum-${path.basename(dataFile, ".json")}`, title: course.title, href: `${SELF_DIRECTED_HREF}?course=${number}`,
      authority: "learning", type: "curriculum", summary: course.audience ? `Self-directed course for ${course.audience}` : course.title, text,
      tags: ["self-directed course", number], intents: [], graphLinks: hrefsIn(course.sources), payload: course,
    }));
  }
  return out;
}

export function curriculumDocs(scope: StaffProgramScope, publishedSurfaces: ReadonlySet<string>): Doc[] {
  const out: Doc[] = [];
  out.push(...selfDirectedCurriculumDocs(scope));
  for (const collection of TRANSCRIPT_COLLECTIONS) {
    if ("requiredSurface" in collection && !publishedSurfaces.has(collection.requiredSurface)) continue;
    out.push(doc(scope, { kind: "content", id: `curriculum-hub-${collection.folder}`, title: collection.title, href: collection.href,
      authority: "learning", type: "learning_navigation", summary: `Explore the ${collection.title} lessons.`,
      text: collection.modules.map(module => module.title).join("\n"), tags: ["curriculum", collection.title], intents: [],
      graphRelated: collection.modules.map(module => `${collection.href}/${module.id}`), payload: collection.modules.map(module => ({id: module.id, title: module.title})) }));
    for (const lessonModule of collection.modules) {
      const text = flat(lessonModule);
      out.push(doc(scope, { kind: "content", id: `learning-lesson-${collection.folder}-${lessonModule.id}`, title: `${collection.title}: ${lessonModule.title}`,
        href: `${collection.href}/${lessonModule.id}`, authority: "learning", type: "learning_lesson", summary: lessonModule.title, text,
        tags: ["curriculum", collection.title], intents: [], graphRelated: [collection.href], payload: lessonModule }));
    }
    const root = path.join(process.cwd(), "public", "learning", collection.folder);
    if (!existsSync(root)) continue;
    for (const lesson of readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
      if (!collection.modules.some(module => module.id === lesson.name)) continue;
      const file = path.join(root, lesson.name, "transcript.txt");
      if (!existsSync(file)) continue;
      const text = readFileSync(file, "utf8");
      out.push(doc(scope, {
        kind: "content", id: `curriculum-${collection.folder}-${lesson.name}`, title: `${collection.title}: lesson ${Number(lesson.name)} transcript`, href: `${collection.href}/${lesson.name}`,
        authority: "learning", type: "curriculum", summary: text.slice(0, 360), text,
        tags: ["lesson transcript", collection.title], intents: [], graphRelated: [`${collection.href}/${lesson.name}`], payload: text,
      }));
    }
  }
  return out;
}

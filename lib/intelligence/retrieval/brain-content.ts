import "server-only";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { researchPlainText } from "@/lib/content/research-markdown";
import { WATER_COURSE_HREF, WATER_COURSE_TITLE, WATER_ESSAY, WATER_MODULES } from "@/lib/content/water-we-swim-in";
import type { Doc } from "./search";

/**
 * Content that staff can read but pages hold outside the publication registry: community research,
 * the self-directed curriculum and recorded lesson transcripts. Everything here is already public on this site.
 */
const SELF_DIRECTED_HREF = "/learning/self-directed/index.html";
const TRANSCRIPT_COLLECTIONS: Array<{ folder: string; title: string; href: string }> = [
  { folder: "clas-curriculum", title: "CLAS curriculum", href: "/learn/clas" },
  { folder: "equity-everyday-decisions", title: "Equity in everyday decisions", href: "/learn/equity-in-practice" },
  { folder: "intercultural-curriculum", title: "Intercultural understanding in everyday work", href: "/learn/intercultural/curriculum" },
];

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const flat = (value: unknown): string => typeof value === "string" ? value
  : Array.isArray(value) ? value.map(flat).filter(Boolean).join("\n")
  : value && typeof value === "object" ? Object.entries(value).filter(([key]) => !["href", "url", "src", "sourceHref", "width", "height"].includes(key)).map(([, child]) => flat(child)).filter(Boolean).join("\n") : "";
const hrefsIn = (value: unknown): string[] => Array.isArray(value) ? value.flatMap(hrefsIn)
  : value && typeof value === "object" ? Object.entries(value).flatMap(([key, child]) => (key === "url" || key === "href") && typeof child === "string" && child.startsWith("/") ? [child] : hrefsIn(child)) : [];

function doc(scope: StaffProgramScope, fields: Pick<Doc, "kind" | "id" | "title" | "href" | "authority" | "type" | "summary" | "text" | "tags" | "intents"> & { graphLinks?: string[]; payload: unknown }): Doc {
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
      tags: ["cultural calendar", "observance", ...communities], intents: ["intercultural"], payload: entry,
    });
  });
}

/** The Water We Swim In: course modules and its essay. */
export function waterCourseDocs(scope: StaffProgramScope): Doc[] {
  const out: Doc[] = [];
  const add = (key: string, title: string, href: string, text: string) => out.push(doc(scope, {
    kind: "content", id: `water-${key}`, title, href, authority: "learning", type: "curriculum", summary: text.slice(0, 360), text,
    tags: ["The Water We Swim In", "Minnesota culture"], intents: ["intercultural"], payload: text,
  }));
  WATER_MODULES.forEach(module => passages(module.body).forEach((text, index) => add(`${module.slug}-${index}`, `${WATER_COURSE_TITLE}: ${module.title}`, `${WATER_COURSE_HREF}/${module.slug}`, text)));
  WATER_ESSAY.sections.forEach(section => passages(section.body).forEach((text, index) => add(`essay-${section.id}-${index}`, `${WATER_COURSE_TITLE} essay: ${section.heading}`, `${WATER_COURSE_HREF}/essay`, text)));
  return out;
}

export function curriculumDocs(scope: StaffProgramScope): Doc[] {
  const out: Doc[] = [];
  const data = path.join(process.cwd(), "public", "learning", "self-directed", "data");
  if (existsSync(data)) for (const name of readdirSync(data).filter(file => file.endsWith(".json"))) {
    const course = JSON.parse(readFileSync(path.join(data, name), "utf8")) as { number?: string; title?: string; audience?: string; outcomes?: unknown; slides?: Array<{ text?: string; narration?: string; hidden?: boolean }>; sources?: unknown };
    if (!course.title || !Array.isArray(course.slides)) continue;
    const text = [course.title, flat(course.outcomes), ...course.slides.filter(slide => !slide.hidden).flatMap(slide => [slide.text ?? "", slide.narration ?? ""])].filter(Boolean).join("\n");
    out.push(doc(scope, {
      kind: "content", id: `curriculum-${name.replace(/\.json$/, "")}`, title: course.title, href: SELF_DIRECTED_HREF,
      authority: "learning", type: "curriculum", summary: course.audience ? `Self-directed course for ${course.audience}` : course.title, text,
      tags: ["self-directed course", course.number ?? ""].filter(Boolean), intents: [], graphLinks: hrefsIn(course.sources), payload: course,
    }));
  }
  for (const collection of TRANSCRIPT_COLLECTIONS) {
    const root = path.join(process.cwd(), "public", "learning", collection.folder);
    if (!existsSync(root)) continue;
    for (const lesson of readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
      const file = path.join(root, lesson.name, "transcript.txt");
      if (!existsSync(file)) continue;
      const text = readFileSync(file, "utf8");
      out.push(doc(scope, {
        kind: "content", id: `curriculum-${collection.folder}-${lesson.name}`, title: `${collection.title}: lesson ${Number(lesson.name)}`, href: collection.href,
        authority: "learning", type: "curriculum", summary: text.slice(0, 360), text,
        tags: ["lesson transcript", collection.title], intents: [], payload: text,
      }));
    }
  }
  return out;
}

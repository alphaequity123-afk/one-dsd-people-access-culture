import "server-only";

/**
 * Grounding for the guide: the standards a lesson addresses, its working
 * example and job aid, plus the lesson's own text. Titles and short
 * text only, capped at about 1,500 words. Nothing here is about a person.
 */
import curriculum from "@/lib/content/clas-curriculum.json";
import { loadPracticeContent } from "@/lib/content/clas-curriculum-page-data";
import { practiceModule } from "@/lib/content/clas-curriculum-practice";
import { leadershipGrounding } from "./leadership-grounding";

export type GroundingLink = { title: string; href: string };
export type Grounding = { text: string; links: GroundingLink[] };

export const GROUNDING_WORD_CAP = 1500;

function words(text: string): number { return text.split(/\s+/).filter(Boolean).length; }

function clip(text: string, max: number): string {
  const parts = text.split(/\s+/).filter(Boolean);
  return parts.length <= max ? parts.join(" ") : parts.slice(0, max).join(" ") + " …";
}

type Section = { title: string; body: string };

/** The standards a lesson addresses, read from the curriculum content. */
function contentSections(lessonId: string, links: GroundingLink[]): Section[] {
  const sections: Section[] = [];
  for (const standard of curriculum.standards.filter(s => s.lesson === lessonId)) {
    sections.push({ title: `Standard ${standard.number}: ${standard.focus}`, body: standard.focus });
    links.push({ title: `Standard ${standard.number}: ${standard.focus}`, href: "/learn/clas" });
  }
  return sections;
}

export function tutorGrounding(lessonId: string, root?: string): Grounding {
  const leadership = leadershipGrounding(lessonId, GROUNDING_WORD_CAP);
  if (leadership) return leadership;
  const lesson = curriculum.modules.find(m => m.id === lessonId);
  if (!lesson) return { text: "", links: [] };
  const links: GroundingLink[] = [];
  const sections: Section[] = [
    { title: `This part: ${lesson.title}`, body: lesson.deliverable },
    { title: `Working example: ${lesson.example.title}`, body: `${lesson.example.situation} ${lesson.example.response} ${lesson.example.reason}` },
  ];
  sections.push(...contentSections(lessonId, links));
  const aid = practiceModule(loadPracticeContent(root), lessonId)?.jobAid;
  if (aid) {
    sections.push({ title: `Job aid: ${aid.title}`, body: [aid.useWhen, ...aid.sections.map(s => `${s.heading}: ${s.items.join(" ")}`), ...aid.remember].join(" ") });
    if (!links.some(link => link.href === `/learn/clas/curriculum/${lessonId}/job-aid`)) links.push({ title: `Job aid: ${aid.title}`, href: `/learn/clas/curriculum/${lessonId}/job-aid` });
  }
  for (const section of lesson.sections) sections.push({ title: `Lesson section: ${section.title}`, body: section.paragraphs.join(" ") });

  // Cap at about 1,500 words: earlier sections (standards, example, job aid) are kept whole; lesson text is clipped.
  const out: string[] = [];
  let used = 0;
  for (const section of sections) {
    const remaining = GROUNDING_WORD_CAP - used;
    if (remaining <= 20) break;
    const body = clip(section.body, remaining - words(section.title));
    const block = `## ${section.title}\n${body}`;
    out.push(block);
    used += words(block);
  }
  const unique = new Map<string, GroundingLink>();
  for (const link of links) if (!unique.has(link.href)) unique.set(link.href, link);
  return { text: out.join("\n\n"), links: [...unique.values()] };
}

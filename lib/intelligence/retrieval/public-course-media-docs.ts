import "server-only";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import completedPodcasts from "@/lib/content/courses/completed-podcasts.json";
import { LEARNING_DIALOGUES } from "@/components/multimedia/learning-dialogue-data";
import { getLearningCompanion } from "@/components/multimedia/learning-companion-data";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { Doc } from "./search";

export type PublicMediaCourse = { id: string; title?: string; lessons: readonly { id: string; blockCount: number; hasScenario: boolean }[] };
type Discussion = { id?: unknown; title?: unknown; src?: unknown; before?: unknown; after?: unknown; checkIn?: unknown; afterSlide?: unknown; turns?: unknown; guidance?: unknown };
type Item = { title?: unknown; text?: unknown; afterSlide?: unknown; afterBlock?: unknown; beforeScenario?: unknown };

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const text = (value: unknown): string => typeof value === "string" ? value : "";
const items = (value: unknown): Item[] => Array.isArray(value) ? value.filter((item): item is Item => !!item && typeof item === "object" && !Array.isArray(item)) : [];

function makeDoc(scope: StaffProgramScope, key: string, title: string, href: string, content: string, related: string[]): Doc {
  const payload = { key, title, href, content, related };
  return { kind: "content", id: `asset-media-${hash(key).slice(0, 32)}`, title, href, authority: "learning", type: "public_media_transcript",
    status: "approved", reviewDate: "", scope: scope === "dsd" ? "dsd" : "agencywide", summary: content,
    text: content, tags: ["recording", "transcript", title], intents: [], graphRelated: related,
    evidenceRevisions: [{ sourceId: `asset-media-${hash(key).slice(0, 32)}`, revisionId: null, payloadHash: hash(payload), scope }] };
}

/** Small, non-overlapping public passages stay retrievable and fit wholly in
 * the current evidence excerpt. No extra text is supplied to the writer that
 * it cannot reference from that passage. */
export function publicMediaPassages(scope: StaffProgramScope, key: string, title: string, href: string, body: string, related: string[]): Doc[] {
  const clean = body.replace(/\s+/g, " ").trim();
  const out: Doc[] = [];
  let rest = clean;
  while (rest) {
    let end = Math.min(300, rest.length);
    if (end < rest.length) {
      const boundary = rest.lastIndexOf(" ", end);
      if (boundary > 150) end = boundary;
    }
    const passage = rest.slice(0, end).trim();
    if (passage) out.push(makeDoc(scope, `${key}:${out.length}`, title, href, passage, related));
    rest = rest.slice(end).trimStart();
  }
  return out;
}

/** Project only transcripts actually shown by current public course pages and
 * the selected self-directed player. Supplied course IDs/lessons must come
 * from the current scoped publication registry, never owner drafts. */
export function publicCourseMediaDocs(scope: StaffProgramScope, publishedCourses: readonly PublicMediaCourse[], activeSelfDirected: ReadonlySet<string>, publicRoot = path.join(process.cwd(), "public")): Doc[] {
  const courses = new Map(publishedCourses.map(course => [course.id, course]));
  const result: Doc[] = [];
  for (const [id, podcast] of Object.entries(completedPodcasts)) {
    if (!courses.has(id) || !podcast.transcript.trim()) continue;
    const href = `/courses/${id}`;
    result.push(...publicMediaPassages(scope, `course-podcast:${id}`, `${courses.get(id)?.title || id}: course podcast transcript`, href, podcast.transcript, [href]));
  }
  const folder = path.join(publicRoot, "learning", "audio-discussions");
  const load = (id: string): Discussion | undefined => {
    const file = path.join(folder, `${id}.json`);
    try { return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) as Discussion : undefined; } catch { return undefined; }
  };
  let manifest: Record<string, unknown> = {};
  try {
    const value: unknown = JSON.parse(readFileSync(path.join(folder, "index.json"), "utf8"));
    if (value && typeof value === "object" && !Array.isArray(value)) manifest = value as Record<string, unknown>;
  } catch { /* absent public media */ }
  const activeSlides = (id: string): ReadonlySet<number> => {
    try {
      const player = path.join(publicRoot, "learning", "self-directed");
      const html = readFileSync(path.join(player, "index.html"), "utf8");
      const source = html.match(/<script\b[^>]*\bid=["']course-data["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
      const list: unknown = source ? JSON.parse(source) : [];
      if (!Array.isArray(list)) return new Set();
      const entry = list.find((item: { number?: unknown }) => item?.number === id);
      const file: unknown = entry?.dataFile;
      if (typeof file !== "string" || !new RegExp(`^data/${id}-[a-f0-9]{12}\\.json$`).test(file)) return new Set();
      const data = JSON.parse(readFileSync(path.join(player, file), "utf8")) as { number?: unknown; slides?: unknown };
      if (data.number !== id || !Array.isArray(data.slides)) return new Set();
      return new Set(data.slides.filter((slide: { number?: unknown; hidden?: unknown }) => Number.isInteger(slide?.number) && !slide.hidden).map((slide: { number: number }) => slide.number));
    } catch { return new Set(); }
  };
  for (const id of Object.keys(manifest)) {
    if (!/^[FIA](?:0[1-9]|1[0-9]|2[0-4])$/.test(id) || !activeSelfDirected.has(id)) continue;
    const row = load(id);
    if (!row || row.id !== id) continue;
    const visibleSlides = activeSlides(id);
    if (!visibleSlides.size) continue;
    // The self-directed player displays these text fields beside active audio.
    const turns = items(row.turns);
    const showPanel = (typeof row.src === "string" && !!row.src || turns.length > 0) && visibleSlides.has(typeof row.afterSlide === "number" ? row.afterSlide : 1);
    const body = [ ...(showPanel ? [text(row.title), text(row.before), ...turns.map(turn => text(turn.text))] : []),
      ...items(row.guidance).filter(item => typeof item.afterSlide === "number" && visibleSlides.has(item.afterSlide)).flatMap(item => [text(item.title), text(item.text)])].filter(Boolean).join("\n");
    if (!body) continue;
    const href = `/learning/self-directed/index.html?course=${id}`;
    result.push(...publicMediaPassages(scope, `self-directed-audio:${id}`, `${text(row.title) || id}: audio discussion`, href, body, [href]));
  }
  const id = "gc-structural-racism", lesson = "gc-structural-racism-1";
  const publishedLesson = courses.get(id)?.lessons.find(item => item.id === lesson);
  if (publishedLesson) {
    const row = load(id);
    if (row?.id === id) {
      const body = [text(row.title), text(row.before), ...items(row.turns).map(turn => text(turn.text)), text(row.after), text(row.checkIn),
        ...items(row.guidance).filter(item => typeof item.afterBlock === "number" && Number.isInteger(item.afterBlock) && item.afterBlock >= 0 && item.afterBlock < publishedLesson.blockCount || item.beforeScenario === true && publishedLesson.hasScenario).flatMap(item => [text(item.title), text(item.text)])].filter(Boolean).join("\n");
      if (body) { const href = `/courses/${id}/${lesson}`; result.push(...publicMediaPassages(scope, `course-discussion:${id}:${lesson}`, `${text(row.title) || id}: audio discussion`, href, body, [`/courses/${id}`])); }
    }
  }
  // These dialogues render only when there is no replacement learning
  // companion for the same published course lesson.
  for (const dialogue of LEARNING_DIALOGUES) {
    if (!courses.get(dialogue.courseId)?.lessons.some(item => item.id === dialogue.lessonId) || getLearningCompanion(dialogue.courseId, dialogue.lessonId)) continue;
    const body = [dialogue.title, dialogue.intro, ...(dialogue.audio ?? []).flatMap(clip => [clip.label, clip.transcript]),
      ...dialogue.moments.flatMap(moment => [moment.title, moment.dialogue, moment.question, moment.feedback])].filter(Boolean).join("\n");
    const href = `/courses/${dialogue.courseId}/${dialogue.lessonId}`;
    result.push(...publicMediaPassages(scope, `course-dialogue:${dialogue.courseId}:${dialogue.lessonId}`, `${dialogue.title}: practice conversation`, href, body, [`/courses/${dialogue.courseId}`]));
  }
  return result;
}

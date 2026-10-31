import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ContentItem } from "./types";
import type { CoursePack } from "./courses/source-types";
import { SELF_DIRECTED_COURSES, selfDirectedHref } from "./self-directed";
import { resourceThemeIds, type ResourceThemeId } from "./resource-organization";

export type CourseListening = { id: string; title: string; href: string; themes: ResourceThemeId[]; sources: string[] };

/** Only media linked by a published course or its active manifest is eligible. */
export function listCourseListening(packs: readonly CoursePack[], publishedSelfDirected: readonly ContentItem[], publicRoot = path.join(process.cwd(), "public")): CourseListening[] {
  const root = path.resolve(publicRoot);
  const available = (src: unknown): src is string => {
    if (typeof src !== "string" || !src.startsWith("/") || src.startsWith("//")) return false;
    let pathname: string;
    try { pathname = decodeURIComponent(src.split(/[?#]/)[0]); } catch { return false; }
    if (!/\.(mp3|wav|m4a)$/i.test(pathname)) return false;
    const resolved = path.resolve(root, "." + pathname);
    return resolved.startsWith(root + path.sep) && existsSync(resolved);
  };
  const approvedSelfDirected = new Set(publishedSelfDirected.filter(item => item.status === "approved").map(item => item.id));
  const results: CourseListening[] = [];
  for (const pack of packs) {
    const sources = [...new Set([pack.course.introAudio, ...pack.course.lessons.flatMap(lesson => lesson.blocks.filter(block => block.type === "audio").map(block => block.src))].filter(available))];
    if (!sources.length) continue;
    const id = "course-" + pack.course.id;
    results.push({ id, title: pack.course.title, href: "/courses/" + encodeURIComponent(pack.course.id), themes: resourceThemeIds({ id, type: "learning_module", tags: [] }), sources });
  }
  const audioRoot = path.join(root, "learning", "audio-discussions");
  let manifest: Record<string, unknown> = {};
  try { manifest = JSON.parse(readFileSync(path.join(audioRoot, "index.json"), "utf8")); } catch { /* No course recordings have been published in this copy. */ }
  for (const course of SELF_DIRECTED_COURSES) {
    if (!approvedSelfDirected.has("self-directed-" + course.number) || !Object.hasOwn(manifest, course.number)) continue;
    try {
      const record = JSON.parse(readFileSync(path.join(audioRoot, course.number + ".json"), "utf8")) as { src?: unknown; guidance?: { src?: unknown }[] };
      const sources = [...new Set([record.src, ...(Array.isArray(record.guidance) ? record.guidance.map(clip => clip.src) : [])].filter(available))];
      if (!sources.length) continue;
      const id = "self-directed-" + course.number;
      results.push({ id, title: course.title, href: selfDirectedHref(id)!, themes: resourceThemeIds({ id, type: "learning_module", tags: [] }), sources });
    } catch { /* Incomplete or absent metadata is not promoted as a recording. */ }
  }
  return results;
}

import type { RiseBlock, RiseCourse } from "./types";
import { equityVsEquality } from "./equity-vs-equality";
import { equityAnalysisToolkit } from "./equity-analysis-toolkit";
import recordings from "./recordings.json";

export type { RiseCourse, RiseLesson, RiseBlock, RiseSection } from "./types";
export { riseLessons } from "./types";

type Recordings = Record<string, { narration?: { src: string; seconds: number }; lines?: Record<string, string> }>;

const plain = (text: string) => text.replace(/[“”]/g, "\"").replace(/[‘’]/g, "'");
/**
 * The narration Kelly reads for a lesson: its teaching text in order. The recorder (rise-course-redesign/voices)
 * builds its script the same way, so the transcript shown beside the audio matches what is heard.
 */
export function narrationScript(title: string, blocks: RiseBlock[]): string {
  const parts: string[] = [title + "."];
  for (const b of blocks) {
    if (b.kind === "text") { if (b.heading) parts.push(b.heading + "."); parts.push(...b.paragraphs); }
    else if (b.kind === "statement") parts.push(b.text);
    else if (b.kind === "twoColumn") for (const c of b.columns) parts.push(`${c.heading}: ${c.text}`);
    else if (b.kind === "numbered") parts.push("To keep in mind. " + b.items.join(" "));
    else if (b.kind === "note") parts.push(`${b.lead} ${b.text}`);
  }
  return plain(parts.join("\n\n"));
}

/** Adds the finished recordings: lesson narration and each scenario line's audio. Missing recordings are left out. */
function withRecordings(course: RiseCourse): RiseCourse {
  const rec = recordings as Recordings;
  return {
    ...course,
    sections: course.sections.map(section => ({
      ...section,
      lessons: section.lessons.map(lesson => {
        const r = rec[lesson.id];
        if (!r) return lesson;
        return {
          ...lesson,
          narration: r.narration ? { src: r.narration.src, seconds: r.narration.seconds, script: narrationScript(lesson.title, lesson.blocks) } : lesson.narration,
          blocks: lesson.blocks.map((block, bi) => block.kind === "scenario" && block.lines
            ? { ...block, lines: block.lines.map((line, li) => ({ ...line, audio: r.lines?.[`${bi}.${li}`] ?? line.audio })) }
            : block),
        };
      }),
    })),
  };
}

/** Courses rebuilt in the Rise structure. Each one replaces the earlier pages at the same address. */
const RISE_COURSES: RiseCourse[] = [equityVsEquality, equityAnalysisToolkit].map(withRecordings);

export function riseCourse(courseId: string): RiseCourse | undefined {
  return RISE_COURSES.find(course => course.id === courseId);
}

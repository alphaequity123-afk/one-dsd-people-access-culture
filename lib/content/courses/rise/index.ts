import type { RiseCourse } from "./types";
import { narrationScript } from "./types";
import { equityVsEquality } from "./equity-vs-equality";
import { equityAnalysisToolkit } from "./equity-analysis-toolkit";
import recordings from "./recordings.json";

export type { RiseCourse, RiseLesson, RiseBlock, RiseSection } from "./types";
export { riseLessons, narrationScript } from "./types";

type Recordings = Record<string, { narration?: { src: string; seconds: number }; lines?: Record<string, string> }>;

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

/**
 * Lists everything a Rise course needs recorded: each lesson's narration (read by Kelly, C3) and each
 * spoken scenario line (read by its own cast member). Writes one job file the local recorder reads, so
 * the recorder never parses the course source itself.
 *
 *   node scripts/media/rise-recording-jobs.mjs --course dhs-equity-analysis-toolkit --out output/rise-jobs.json
 *
 * With no --course it lists every Rise course. Narration text comes from narrationScript, the same
 * function the player shows beside the audio as its transcript.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const { equityVsEquality } = await import(`file://${root}/lib/content/courses/rise/equity-vs-equality.ts`);
const { equityAnalysisToolkit } = await import(`file://${root}/lib/content/courses/rise/equity-analysis-toolkit.ts`);
const { narrationScript, riseLessons } = await import(`file://${root}/lib/content/courses/rise/types.ts`);

const argument = name => {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
};

const courses = [equityVsEquality, equityAnalysisToolkit];
const wanted = argument("--course");
const chosen = wanted ? courses.filter(course => course.id === wanted) : courses;
if (!chosen.length) throw new Error(`No Rise course with id ${wanted}`);

const jobs = [];
for (const course of chosen) {
  for (const lesson of riseLessons(course)) {
    const lines = [];
    lesson.blocks.forEach((block, blockIndex) => {
      if (block.kind !== "scenario" || !block.lines) return;
      block.lines.forEach((line, lineIndex) => {
        lines.push({ key: `${blockIndex}.${lineIndex}`, cast: line.cast, role: line.role, text: line.text });
      });
    });
    jobs.push({
      course: course.id,
      lesson: lesson.id,
      title: lesson.title,
      narration: { cast: 3, text: narrationScript(lesson.title, lesson.blocks) },
      lines,
    });
  }
}

const out = resolve(root, argument("--out") ?? "output/rise-recording-jobs.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), jobs }, null, 1) + "\n", "utf8");
const words = jobs.reduce((n, job) => n + job.narration.text.split(/\s+/).length + job.lines.reduce((m, l) => m + l.text.split(/\s+/).length, 0), 0);
console.log(`${jobs.length} lessons, ${jobs.reduce((n, j) => n + j.lines.length, 0)} spoken lines, about ${words} words. Wrote ${out}`);

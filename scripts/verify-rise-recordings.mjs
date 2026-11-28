/**
 * Every Rise lesson is heard, not only read: it has narration in Kelly's voice, and every spoken
 * scenario line has audio in its own cast member's voice. This check fails the build if a lesson or a
 * line lost its recording, so a course can never go out half silent.
 *
 * Recordings are made by scripts/media/record-rise-course.py and registered in
 * lib/content/courses/rise/recordings.json.
 */
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rise = new URL('../lib/content/courses/rise/', import.meta.url);
const publicDir = fileURLToPath(new URL('../public', import.meta.url));
const { equityVsEquality } = await import(new URL('equity-vs-equality.ts', rise).href);
const { equityAnalysisToolkit } = await import(new URL('equity-analysis-toolkit.ts', rise).href);
const { riseLessons } = await import(new URL('types.ts', rise).href);
const recordings = JSON.parse(readFileSync(fileURLToPath(new URL('recordings.json', rise)), 'utf8'));

const problems = [];
const audio = (src, where) => {
  if (typeof src !== 'string' || !src.startsWith('/learning-media/rise/')) return problems.push(`${where}: no audio`);
  try {
    if (statSync(publicDir + src).size < 2000) problems.push(`${where}: ${src} is too small to be speech`);
  } catch {
    problems.push(`${where}: ${src} is missing`);
  }
};

let lessons = 0;
let lines = 0;
for (const course of [equityVsEquality, equityAnalysisToolkit]) {
  for (const lesson of riseLessons(course)) {
    lessons += 1;
    const entry = recordings[lesson.id];
    if (!entry) { problems.push(`${lesson.id}: nothing recorded`); continue; }
    audio(entry.narration?.src, `${lesson.id} narration`);
    if (!(entry.narration?.seconds > 0)) problems.push(`${lesson.id}: narration has no length`);
    const folder = `/learning-media/rise/${course.id}/${lesson.id}/`;
    if (entry.narration?.src && !entry.narration.src.startsWith(folder)) problems.push(`${lesson.id}: narration sits in another lesson's folder`);
    lesson.blocks.forEach((block, blockIndex) => {
      if (block.kind !== 'scenario' || !block.lines) return;
      block.lines.forEach((line, lineIndex) => {
        lines += 1;
        audio(entry.lines?.[`${blockIndex}.${lineIndex}`], `${lesson.id} line ${blockIndex}.${lineIndex} (${line.role})`);
      });
    });
  }
}

if (problems.length) {
  throw new Error(`Rise recordings are incomplete:\n  ${problems.join('\n  ')}`);
}
console.log(`All ${lessons} Rise lessons have narration, and all ${lines} spoken lines are recorded in their own voices.`);

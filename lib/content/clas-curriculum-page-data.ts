import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import curriculum from '@/lib/content/clas-curriculum.json';
import { EMPTY_PRACTICE, normalizePracticeContent, practiceModule, recallForLesson, type PracticeContent } from '@/lib/content/clas-curriculum-practice';
import { walkthroughOf } from '@/lib/learning/clas-walkthrough';
import type { ClasFrontPageData, ClasLessonPageData } from '@/lib/learning/clas-page-data';
import { groupCuesIntoSentences, parseVtt, type Cue } from '@/lib/learning/vtt';

export const PRACTICE_CONTENT_PATH = 'lib/content/clas-curriculum-practice.json';

/** The practice content file, or empty content when it is absent, unreadable or not yet complete. */
export function loadPracticeContent(root = process.cwd()): PracticeContent {
  try { return normalizePracticeContent(JSON.parse(fs.readFileSync(path.join(root, PRACTICE_CONTENT_PATH), 'utf8'))); } catch { return EMPTY_PRACTICE; }
}

/**
 * Sentence-level cues from a captions file under public/. Empty when the path is not a local file
 * (for example a media volume URL); the player then fetches the captions in the browser.
 */
export function loadCaptionCues(publicPath: string | null | undefined, root = process.cwd()): Cue[] {
  if (!publicPath || !publicPath.startsWith('/') || publicPath.includes('..')) return [];
  try { return groupCuesIntoSentences(parseVtt(fs.readFileSync(path.join(root, 'public', publicPath), 'utf8'))); } catch { return []; }
}

export function loadClasLessonPageData(lessonId: string, root = process.cwd()): ClasLessonPageData {
  const module = curriculum.modules.find(m => m.id === lessonId);
  const content = loadPracticeContent(root);
  const practice = practiceModule(content, lessonId);
  const walkthrough = walkthroughOf(module);
  return {
    cues: loadCaptionCues(module?.captions, root),
    practice,
    recall: recallForLesson(content, curriculum.modules.map(m => m.id), lessonId),
    walkthrough,
    walkthroughCues: loadCaptionCues(walkthrough?.captions, root),
    jobAidAvailable: Boolean(practice?.jobAid),
  };
}

export function loadClasFrontPageData(root = process.cwd()): ClasFrontPageData {
  const content = loadPracticeContent(root);
  return {
    walkthroughs: curriculum.modules.flatMap(m => { const walkthrough = walkthroughOf(m); return walkthrough ? [{ id: m.id, title: m.title, walkthrough }] : []; }),
    jobAidIds: content.modules.filter(m => m.jobAid).map(m => m.id),
  };
}

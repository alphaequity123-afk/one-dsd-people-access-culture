import type { PracticeModule, RecallQuestion } from '@/lib/content/clas-curriculum-practice';
import type { Walkthrough } from '@/lib/learning/clas-walkthrough';
import type { Cue } from '@/lib/learning/vtt';

/** Everything a lesson page needs beyond the base curriculum; every field has an empty default. */
export type ClasLessonPageData = {
  cues: Cue[];
  practice: PracticeModule | null;
  recall: RecallQuestion[];
  walkthrough: Walkthrough | null;
  walkthroughCues: Cue[];
  jobAidAvailable: boolean;
};
export type ClasFrontPageData = {
  walkthroughs: { id: string; title: string; walkthrough: Walkthrough }[];
  jobAidIds: string[];
};

export const EMPTY_LESSON_PAGE_DATA: ClasLessonPageData = { cues: [], practice: null, recall: [], walkthrough: null, walkthroughCues: [], jobAidAvailable: false };
export const EMPTY_FRONT_PAGE_DATA: ClasFrontPageData = { walkthroughs: [], jobAidIds: [] };

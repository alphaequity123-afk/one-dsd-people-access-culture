export type Chapter = { title: string; start: number };
export type Resource = { title: string; href: string; description?: string };
export type Lesson = {
  id: string;
  title: string;
  deliverable: string;
  video?: string;
  captions?: string;
  poster?: string;
  durationSeconds?: number;
  chapters?: Chapter[];
  /** Set by the release process only after all of the lesson's media is verified. */
  mediaReady?: boolean;
  example: { title: string; situation: string; response: string; reason: string };
  practice: {
    question: string;
    options: { text: string; feedback: string; correct?: boolean }[];
    reflection: string;
    artifact?: string;
  };
  sections: { title: string; paragraphs: string[] }[];
  resources?: Resource[];
};
export type Curriculum = { title: string; modules: Lesson[]; sources?: Resource[] };

/** No incomplete or unverified player should be exposed in a preview or release. */
export function hasReadyMedia(lesson: Lesson): boolean {
  if (!/^0[1-8]$/.test(lesson.id)) return false;
  const prefix = `/learning/equity-everyday-decisions/${lesson.id}/`;
  const resource = (path: unknown, name: string) => path === prefix + name;
  return lesson.mediaReady === true &&
    resource(lesson.video, 'lesson.mp4') && resource(lesson.captions, 'captions.vtt') &&
    resource(lesson.poster, 'poster.png') &&
    typeof lesson.durationSeconds === 'number' && Number.isFinite(lesson.durationSeconds) && lesson.durationSeconds > 0 &&
    Array.isArray(lesson.chapters) && lesson.chapters.length > 0 &&
    lesson.chapters.every((chapter, index, list) =>
      typeof chapter.title === 'string' && chapter.title.trim().length > 0 &&
      Number.isFinite(chapter.start) && chapter.start >= 0 && chapter.start < lesson.durationSeconds! &&
      (index === 0 || chapter.start > list[index - 1].start));
}

export function validCompleted(value: unknown, modules: Lesson[]): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(modules.map(module => module.id));
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && allowed.has(id)))];
}

export function workbookText(curriculum: Curriculum): string {
  const reflections = curriculum.modules.map(module =>
    `Part ${Number(module.id)}: ${module.title}\n${module.practice.reflection}\n\nMy notes:\n\n\n`).join('\n');
  return `${curriculum.title}\n\nThese notes are for your own use. Leave names, case details, health or personnel information, and other confidential information in approved systems. A working note is not an approved decision or a completed official analysis.\n\nMY DECISION PLAN\n\nDecision and purpose:\n\nPeople and communities affected, and how they may experience the decision:\n\nWhat is known, what remains uncertain, and whose perspectives are needed:\n\nApplicable requirements and questions for the person or area responsible:\n\nThe level of analysis needed and why:\n\nOptions and their likely benefits, burdens, and tradeoffs:\n\nAccessible participation, communication, and language support:\n\nRecommendation and reasons, including unresolved questions:\n\nWhat I can do in my role and what needs coordination or approval:\n\nResponsible roles, next steps, and review date:\n\nHow I will learn whether the change helped, and for whom:\n\n\nREFLECTIONS BY LESSON\n\n${reflections}\nAfter the review, what changed in my understanding? What remains open?\n`;
}

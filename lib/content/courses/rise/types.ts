/**
 * Rise-style courses (owner decision 2026-11-27): every e-learning course moves to the Articulate Rise 360 structure.
 * A course is a cover page plus sections of lessons; a lesson is a stack of blocks; a "continue" block hides what
 * follows until it is pressed. Structure reference: rise-course-redesign/HOW-RISE-COURSES-ARE-BUILT.md (project folder).
 * Progress lives only in the learner's own browser; knowledge checks give feedback and keep no score.
 */
export type RiseImage = { src: string; alt: string };

export type RiseBlock =
  | { kind: "audio"; title: string; src: string; seconds?: number; transcript?: string }
  | { kind: "text"; heading?: string; paragraphs: string[] }
  | { kind: "twoColumn"; columns: { heading: string; text: string }[] }
  | { kind: "image"; image: RiseImage; caption?: string }
  | { kind: "statement"; text: string }
  | { kind: "note"; lead: string; text: string }
  | { kind: "accordion"; heading: string; intro?: string; items: { title: string; body: string }[] }
  | { kind: "tabs"; heading: string; intro?: string; items: { label: string; body: string }[] }
  | { kind: "flashcards"; heading: string; intro?: string; cards: { front: string; back: string }[] }
  | { kind: "process"; title: string; intro: string; steps: { title: string; body: string }[] }
  | { kind: "sorting"; heading: string; intro: string; categories: string[]; items: { text: string; category: number }[]; done: string }
  | { kind: "scenario"; image: RiseImage; character?: RiseImage & { role: string }; title: string; setup: string;
      /** Spoken lines before the question. Each is voiced by its cast member (C1–C8, docs/media-scripts/CAST.md) and named by role. */
      lines?: RiseLine[];
      question: string; options: { text: string; feedback: string; best?: boolean }[] }
  /** Where this lesson's skill is used at work: a tool, and the step in it. */
  | { kind: "useAtWork"; tool: string; step?: string; href: string; text: string; also?: { label: string; href: string }[] }
  | { kind: "check"; question: string; options: { text: string; correct?: boolean }[]; right: string; wrong: string }
  | { kind: "numbered"; heading: string; items: string[] }
  | { kind: "quote"; text: string; who: string }
  | { kind: "continue" };

export type RiseLine = { cast: number; role: string; text: string; audio?: string };
/** Lesson narration, read by the narrator voice (Kelly, C3). The script is kept beside the audio as its transcript. */
export type RiseNarration = { src?: string; seconds?: number; script: string };
export type RiseLesson = { id: string; title: string; minutes: number; blocks: RiseBlock[]; narration?: RiseNarration };
export type RiseSection = { title: string; lessons: RiseLesson[] };
export type RiseCourse = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  description: string[];
  cover: RiseImage;
  introVideo?: { src: string; captions?: string; poster?: string; seconds?: number };
  outcomes: string[];
  sections: RiseSection[];
  sources: { title: string; href: string; note: string }[];
};

export function riseLessons(course: RiseCourse): RiseLesson[] {
  return course.sections.flatMap(section => section.lessons);
}

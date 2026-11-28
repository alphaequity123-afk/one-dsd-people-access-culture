import data from "./courses.json";

export type Finding = {
  claim: string;
  detail: string;
  source: string;
  url: string;
  tag: string;
};
export type Section = { title: string; text: string };
export type Depth = { minutes: number; sections: Section[] };
export type Choice = {
  label: string;
  feedback: string;
  quality: "strong" | "partial" | "weak";
  next: string;
};
export type Step = {
  id: string;
  situation: string;
  question: string;
  choices: Choice[];
};
export type DeepCourse = {
  id: string;
  series: string;
  title: string;
  theme: string;
  roles: string[];
  guide: number;
  photo?: { src: string; alt: string };
  absorbs: string[];
  objective: string;
  outcomes: string[];
  evidence: { summary: string; findings: Finding[] };
  counterintuitive: { headline: string; text: string };
  depths: { brief: Depth; working: Depth; full: Depth };
  simulation: { setup: string; steps: Step[]; debrief: string };
  mistakes: { mistake: string; why: string; instead: string }[];
  jobAid: { title: string; use: string; steps: string[] };
  media: {
    kind: "narration" | "conversation";
    reason: string;
    script: { speaker: string; role: string; text: string }[];
  };
  plan: { prompts: string[] };
  sources: { title: string; authors: string; year: number; url: string }[];
};

export const deepCourses = data as DeepCourse[];
export const deepCourse = (id: string) => deepCourses.find((c) => c.id === id);
/** The new course that absorbed an older course id, so old links keep working. */
export const absorbedBy = (id: string) =>
  deepCourses.find((c) => c.absorbs.includes(id));

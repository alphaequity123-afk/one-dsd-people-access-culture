import leadership from "./leadership.json";
import intercultural from "./intercultural.json";
import podcastData from "./podcasts.json";
import photoData from "./photos.json";
import guides from "./guides.json";
import audioLessons from "./guided-audio.json";
import families from "./families.json";

export type Course = {
  id: string;
  title: string;
  series: string;
  theme: string;
  guide: number;
  objective: string;
  learn: string;
  teaching: { title: string; text: string }[];
  scenario: string;
  decision: string;
  choices: { label: string; feedback: string }[];
  perspective: string;
  reconsider: string;
  followup: string;
  transfer: string;
  reflection: string;
  roles: string[];
  articleId?: string;
  sources?: { title: string; url: string }[];
};

export const courses: Course[] = [...leadership, ...intercultural];
export const root = "/learn/leadership/courses";
export const courseHref = (id: string) => root + "/" + id;
export const podcasts = podcastData;
export const guidedLessons: { id: string; paragraphs: string[] }[] =
  audioLessons;
export const photos: Record<string, { src: string; alt: string }> = photoData;
export { guides, families };

import data from "./style-podcasts.json";

/**
 * Two-voice podcasts for the leadership styles (owner decision 2026-11-23: every style, the approved two-host voices).
 * Recorded and checked locally; `style-podcasts.json` and the files under /learning-media/leadership-styles/ are written
 * by the assembler in the recording folder. A style shows its podcast only when its recording is listed here.
 */
export type StylePodcast = {
  title: string;
  minutes: number;
  src: string;
  captions: string;
  turns: { speaker: "Host" | "Co-host"; text: string }[];
};

const podcasts = data as Record<string, StylePodcast>;

export const podcastFor = (slug: string): StylePodcast | undefined => podcasts[slug];

import { defineEditableSurface, type EditableSurfaceDefinition } from "./editable-surface-contract";

/** Approved supplied recordings. The original WAV and MP3 remain preserved separately. */
export const PODCASTS = [
  {
    id: "equity-toolkit",
    surfaceId: "podcast.equity-toolkit",
    href: "/learn/equity-toolkit#podcast-equity-toolkit",
    src: "/audio/dhs-equity-policy-and-toolkit.mp3?v=trim25-20260926",
    title: "DHS equity policy and toolkit",
    intro: "Listen to the podcast about DHS equity policy and the toolkit.",
    duration: "46 minutes, 48 seconds",
    durationSeconds: 2807.72,
    bytes: 33693741,
    themes: ["structural", "partnership"],
    searchTerms: ["DHS", "equity", "policy", "toolkit", "podcast", "audio"],
  },
  {
    id: "anti-racism-public-service",
    surfaceId: "podcast.anti-racism-public-service",
    href: "/learn#podcast-anti-racism-public-service",
    src: "/audio/anti-racism-public-service.mp3?v=229809628b3f",
    title: "Fair access in public service: the rules we inherit",
    intro: "Two colleagues talk through how inherited rules, forms and systems shape who gets fair access to public services, and what staff can check, measure and fix in their own work.",
    duration: "15 minutes, 43 seconds",
    durationSeconds: 943.478,
    bytes: 18871245,
    themes: ["structural", "culture"],
    searchTerms: ["fair access", "civil rights", "public", "service", "rules", "systems", "podcast", "audio"],
  },
] as const;

export type Podcast = (typeof PODCASTS)[number];

export const PODCAST_SURFACES: EditableSurfaceDefinition[] = PODCASTS.map(podcast => defineEditableSurface({
  surfaceId: podcast.surfaceId,
  route: podcast.href,
  label: `${podcast.title} podcast`,
  scopePolicy: "inheritable",
  fields: [
    { key: "title", label: "Podcast title", kind: "short", maxLength: 300 },
    { key: "intro", label: "Podcast introduction", kind: "long", maxLength: 2000 },
    { key: "downloadLabel", label: "Download wording", kind: "short", maxLength: 200 },
    { key: "retryLabel", label: "Try again wording", kind: "short", maxLength: 200 },
    { key: "errorMessage", label: "Playback error", kind: "long", maxLength: 500 },
  ],
  protectedFields: ["audioAsset", "duration", "sourceFingerprint"],
  approvedValues: {
    title: podcast.title,
    intro: podcast.intro,
    downloadLabel: "Download the recording",
    retryLabel: "Try playback again",
    errorMessage: "This recording could not be played. Please try again.",
  },
}));

export function podcastMatches(podcast: Podcast, options: { q?: string; theme?: string; type?: string }, title: string = podcast.title, intro: string = podcast.intro): boolean {
  if (options.type && options.type !== "podcast") return false;
  if (options.theme && !(podcast.themes as readonly string[]).includes(options.theme)) return false;
  const text = `${title} ${intro} ${podcast.searchTerms.join(" ")}`.toLocaleLowerCase();
  return (options.q ?? "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).every(term => text.includes(term));
}

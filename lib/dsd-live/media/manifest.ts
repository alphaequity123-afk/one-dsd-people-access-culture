/**
 * Media manifests: one JSON file per course in data/media, listing each part's video, audio, captions, transcript, poster
 * and chapters. A part's media are shown only when its manifest entry says ready, so a course page is complete before
 * the recordings exist. URLs are site paths (/media/...) or https addresses on an asset store.
 * To mark a part ready once its files are served: node scripts/media/mark-ready.ts <course> --from <folder with v1, v2 ...>
 */
import { z } from "zod";
import assertiveCommunication from "@/data/dsd-live/media/assertive-communication.json" with { type: "json" };
import culturalHumility from "@/data/dsd-live/media/cultural-humility.json" with { type: "json" };
import psychologicalSafety from "@/data/dsd-live/media/psychological-safety.json" with { type: "json" };

const mediaUrl = z.string().regex(/^(\/[^\s]*|https:\/\/[^\s]+)$/, "Use a site path starting with / or an https address.");
export const ChapterSchema = z.object({ title: z.string().min(1), start: z.number().nonnegative() }).strict();
export const MediaPartSchema = z.object({
  part: z.number().int().positive(),
  title: z.string().min(1).optional(),
  lesson_slug: z.string().min(1),
  ready: z.boolean(),
  video: mediaUrl,
  audio: mediaUrl,
  captions: mediaUrl,
  transcript: mediaUrl,
  poster: mediaUrl,
  chapters: z.array(ChapterSchema),
}).strict().superRefine((part, ctx) => {
  if (!part.ready) return;
  if (part.chapters.length === 0) ctx.addIssue({ code: "custom", path: ["chapters"], message: "A ready part needs its chapters." });
  for (let i = 1; i < part.chapters.length; i++)
    if (part.chapters[i].start <= part.chapters[i - 1].start) ctx.addIssue({ code: "custom", path: ["chapters", i, "start"], message: "Chapter starts must increase." });
});
export const MediaManifestSchema = z.object({ course: z.string().min(1), parts: z.array(MediaPartSchema).min(1) }).strict();
export type MediaPart = z.infer<typeof MediaPartSchema>;
export type MediaManifest = z.infer<typeof MediaManifestSchema>;

export const MEDIA_MANIFESTS: MediaManifest[] = [assertiveCommunication, culturalHumility, psychologicalSafety].map(m => MediaManifestSchema.parse(m));

/** The parts whose media are ready to show, in order. Optionally only the part for one lesson. */
export function readyParts(manifest: MediaManifest | undefined, lessonSlug?: string): MediaPart[] {
  if (!manifest) return [];
  return manifest.parts.filter(p => p.ready && p.chapters.length > 0 && (!lessonSlug || p.lesson_slug === lessonSlug)).sort((a, b) => a.part - b.part);
}

export function mediaFor(courseSlug: string, manifests: MediaManifest[] = MEDIA_MANIFESTS): MediaManifest | undefined {
  return manifests.find(m => m.course === courseSlug);
}

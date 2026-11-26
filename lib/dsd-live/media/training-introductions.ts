import { z } from "zod";
import introductions from "@/data/dsd-live/media/training-introductions.json" with { type: "json" };
import { MediaPartSchema } from "./manifest";

const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
export const IntroductionReleaseSchema = z.object({
  course: z.string().min(1),
  version: z.string().min(1),
  figure: z.string().regex(/^C[1-8]$/),
  script: z.string().min(1),
  sourceFingerprint: sha256,
  profileId: z.literal("one-dsd-selected-preview-podcast-voices-v1"),
  wordReview: z.literal("accepted"),
  part: MediaPartSchema,
  files: z.array(z.object({ name: z.string(), sha256, bytes: z.number().int().positive(), liveVerified: z.literal(true) }).strict()).length(6),
}).strict();
export type IntroductionRelease = z.infer<typeof IntroductionReleaseSchema>;
export const INTRODUCTION_RELEASES = IntroductionReleaseSchema.array().parse(introductions.entries);

/** Hide a recording if the selected role's spoken text or assigned figure has changed. */
export function introductionFor(course: string, version: string, script: string, figure: string, releases = INTRODUCTION_RELEASES) {
  const release = releases.find(row => row.course === course && row.version === version);
  return release?.part.ready && release.script === script && release.figure === figure ? release : undefined;
}

export function checkIntroductionReleases(trainings: Array<{ id: string; simulations: Array<{ version: string; intro: string; intro_by: string }> }>, releases = INTRODUCTION_RELEASES) {
  const seen = new Set<string>();
  for (const row of releases) {
    IntroductionReleaseSchema.parse(row);
    const key = `${row.course}/${row.version}`;
    if (seen.has(key)) throw Error(`Duplicate introduction recording: ${key}`);
    seen.add(key);
    const sim = trainings.find(t => t.id === row.course)?.simulations.find(s => s.version === row.version);
    if (!sim || sim.intro !== row.script || sim.intro_by !== row.figure) throw Error(`Introduction recording does not match its reviewed role: ${key}`);
    if (!row.part.ready || row.part.part !== 1 || row.part.chapters.length !== 1 || row.part.chapters[0].start !== 0)
      throw Error(`Introduction recording is not a complete single clip: ${key}`);
    const files = ["video.mp4", "audio.mp3", "captions.vtt", "transcript.txt", "poster.png", "chapters.json"];
    if (new Set(row.files.map(f => f.name)).size !== 6 || files.some(name => !row.files.some(f => f.name === name)))
      throw Error(`Introduction release is missing a companion file: ${key}`);
    for (const [field, file] of Object.entries({ video: "video.mp4", audio: "audio.mp3", captions: "captions.vtt", transcript: "transcript.txt", poster: "poster.png" })) {
      const url = row.part[field as keyof typeof row.part];
      const prefix = `/media/${row.course}-intro-${row.version}/v`;
      const suffix = typeof url === "string" && url.startsWith(prefix) ? url.slice(prefix.length).match(/^(\d+)\/([^/]+)$/) : null;
      if (!suffix || suffix[2] !== file)
        throw Error(`Introduction companion URL does not match its role: ${key}`);
    }
    const revisions = [row.part.video, row.part.audio, row.part.captions, row.part.transcript, row.part.poster].map(url => url.split("/").at(-2));
    if (new Set(revisions).size !== 1) throw Error(`Introduction companions use different revisions: ${key}`);
  }
}

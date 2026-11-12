import "server-only";

import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { configuredCourseMediaRoot, publicCourseMedia, publishedCourseMedia } from "@/lib/content/course-media";
import { safeOpen } from "@/lib/content/geffen-volume";
import { PODCASTS } from "@/lib/content/podcasts";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import { waterCompanion, waterLesson, waterModuleId } from "@/lib/content/water-curriculum";
import { WATER_COURSE_HREF, WATER_MODULES } from "@/lib/content/water-we-swim-in";
import { formatTime, groupCuesIntoSentences, parseVtt, type Cue } from "@/lib/learning/vtt";
import { curriculumMediaSources } from "./curriculum-media-sources";
import { publishedRecordingTranscript } from "./podcast-reading";
import extracts from "./published-resource-text.json";
import { publicMediaPassages } from "./public-course-media-docs";
import type { Doc } from "./search";

const TRAINING_HUB = "/learning/training-companions/index.html";
const MAX_TEXT = 256 * 1024;
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const pathOnly = (href: string) => href.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
const localUrl = (asset: string) => asset.split("/").map(encodeURIComponent).join("/");

async function publicAsset(publicRoot: string, href: string, maxBytes: number) {
  if (!href.startsWith("/") || href.split("/").some(part => part === "." || part === ".." || part.includes("\\"))) return null;
  try {
    const root = await realpath(publicRoot);
    const file = path.resolve(root, "." + href);
    if (!file.startsWith(root + path.sep) || await realpath(file) !== file) return null;
    const stat = await lstat(file);
    return stat.isFile() && stat.size > 0 && stat.size <= maxBytes ? { file, stat } : null;
  } catch {
    return null;
  }
}

const verified = new Map<string, { time: number; size: number; hash: string }>();

async function matchesExtraction(publicRoot: string, href: string, sha256: string) {
  const asset = await publicAsset(publicRoot, href, 20 * 1024 * 1024);
  if (!asset) return false;
  const cached = verified.get(asset.file);
  if (cached?.time === asset.stat.mtimeMs && cached.size === asset.stat.size) return cached.hash === sha256;
  try {
    const actual = hash(await readFile(asset.file));
    if (verified.size >= 40) verified.clear();
    verified.set(asset.file, { time: asset.stat.mtimeMs, size: asset.stat.size, hash: actual });
    return actual === sha256;
  } catch {
    return false;
  }
}

function evidenceDoc(scope: StaffProgramScope, key: string, title: string, href: string, text: string, type: string, related: string[], sourceVersion: string, parent?: Doc): Doc {
  const id = `asset-learning-${hash(key).slice(0, 32)}`;
  return {
    id, title, href, text, type, kind: "content", status: "approved",
    authority: parent?.authority ?? "learning", reviewDate: parent?.reviewDate ?? "",
    scope: parent?.scope ?? (scope === "dsd" ? "dsd" : "agencywide"), summary: text.slice(0, 200),
    tags: [type === "public_media_transcript" ? "recording transcript" : "original resource", ...(parent?.tags ?? [])],
    intents: parent?.intents ?? [],
    graphRelated: related,
    evidenceRevisions: [
      ...(parent?.evidenceRevisions ?? []),
      { sourceId: id, revisionId: null, payloadHash: hash(JSON.stringify({ href, text, sourceVersion })), scope },
    ],
  };
}

/** Extra pages of the original downloads. Parent publications still determine
 * whether a guide or current resource is eligible as answer evidence. */
async function downloadDocs(scope: StaffProgramScope, paths: ReadonlyMap<string, Doc>, publicRoot: string) {
  const groups = await Promise.all(extracts.map(async resource => {
    const parent = paths.get(resource.parent);
    const companion = resource.parent === TRAINING_HUB;
    if (!parent && (!companion || !await publicAsset(publicRoot, TRAINING_HUB, MAX_TEXT))) return [];
    if (!await matchesExtraction(publicRoot, resource.path, resource.sha256)) return [];
    const download = localUrl(resource.path);
    return resource.passages.map((passage, index) => evidenceDoc(
      scope, `${resource.path}:${index}`, `${resource.title} — ${passage.label}`,
      "fragment" in passage ? `${download}#${passage.fragment}` : download,
      passage.text, resource.kind, [resource.parent, download], resource.sha256, parent,
    ));
  }));
  return groups.flat();
}

function timedDocs(scope: StaffProgramScope, key: string, title: string, href: string, cues: readonly Cue[], digest: string, related: string[], parent?: Doc) {
  const docs: Doc[] = [];
  let open: Cue | undefined;
  function flush() {
    if (!open) return;
    const seconds = Math.floor(open.start);
    docs.push(evidenceDoc(
      scope, `${key}:${docs.length}`, `${title} — ${formatTime(seconds)}`,
      `${href}#t=${seconds}`, open.text, "public_media_transcript", related, digest, parent,
    ));
    open = undefined;
  }
  for (const cue of cues) {
    if (open && (open.text.length + cue.text.length > 600 || cue.end - open.start > 30)) flush();
    open = open ? { ...open, text: `${open.text} ${cue.text}`, end: cue.end } : cue;
  }
  flush();
  return docs;
}

function timedCaptionDocs(scope: StaffProgramScope, key: string, title: string, href: string, captions: string, related: string[], parent?: Doc) {
  if (!/^(?:\uFEFF)?WEBVTT/.test(captions)) return [];
  return timedDocs(scope, key, title, href, groupCuesIntoSentences(parseVtt(captions)), hash(captions), related, parent);
}

async function recordingDocs(scope: StaffProgramScope, docs: readonly Doc[], publicRoot: string) {
  const groups = await Promise.all(PODCASTS.map(async podcast => {
    const parent = docs.find(doc => doc.status === "approved" && doc.href === podcast.href);
    const revision = parent?.evidenceRevisions?.find(item => item.sourceId === `${podcast.surfaceId}.machine-transcript`);
    const transcript = publishedRecordingTranscript(podcast.id);
    const audio = pathOnly(podcast.src);
    if (!parent || !revision || !transcript || transcript.source !== podcast.src ||
      !await publicAsset(publicRoot, audio, 64 * 1024 * 1024)) return [];
    return timedDocs(scope, `public-podcast:${podcast.id}`, `${parent.title} — unofficial transcript`,
      podcast.src, transcript.segments, revision.payloadHash, [podcast.href, `/podcasts/${podcast.id}`, audio], parent);
  }));
  return groups.flat();
}

async function waterPodcastDocs(scope: StaffProgramScope, paths: ReadonlyMap<string, Doc>, publicRoot: string) {
  const episodes = WATER_MODULES.flatMap(module => {
    const id = waterModuleId(module.number);
    const podcast = waterLesson(id)?.podcast;
    return podcast ? [{ id, podcast, parent: `${WATER_COURSE_HREF}/${module.slug}` }] : [];
  });
  const companion = waterCompanion()?.podcast;
  if (companion) episodes.push({ id: "companion", podcast: companion, parent: WATER_COURSE_HREF });
  const sources = episodes.map(({ id, podcast, parent }) => ({
    key: `water-podcast:${id}`, title: `${podcast.title}: podcast`, media: podcast.src,
    captions: podcast.captions, transcript: podcast.transcript, parent,
  }));
  return (await Promise.all(sources.map(source => readStaticRecording(scope, source, paths, publicRoot)))).flat();
}

type StaticRecording = ReturnType<typeof curriculumMediaSources>[number];

function transcriptDocs(scope: StaffProgramScope, key: string, title: string, href: string, transcript: string, related: string[], parent?: Doc) {
  return publicMediaPassages(scope, key, `${title} — transcript`, href, transcript, related).map(doc => ({
    ...doc,
    authority: parent?.authority ?? doc.authority,
    evidenceRevisions: [...(parent?.evidenceRevisions ?? []), ...(doc.evidenceRevisions ?? [])],
  }));
}

async function readStaticRecording(scope: StaffProgramScope, source: StaticRecording, paths: ReadonlyMap<string, Doc>, publicRoot: string) {
  const parent = paths.get(source.parent);
  if (!parent || !await publicAsset(publicRoot, pathOnly(source.media), 256 * 1024 * 1024)) return [];
  const related = [source.parent, pathOnly(source.media), pathOnly(source.transcript)];
  try {
    const captions = await publicAsset(publicRoot, pathOnly(source.captions), MAX_TEXT);
    const timed = captions ? timedCaptionDocs(scope, source.key, source.title, source.media, await readFile(captions.file, "utf8"), related, parent) : [];
    if (timed.length) return timed;
    const transcript = await publicAsset(publicRoot, pathOnly(source.transcript), MAX_TEXT);
    return transcript ? transcriptDocs(scope, source.key, source.title, source.transcript, await readFile(transcript.file, "utf8"), related, parent) : [];
  } catch {
    return [];
  }
}

// Names are immutable SHA-256 addresses. The current manifest and file
// presence are checked independently before these previously verified bytes are used.
const verifiedVolumeText = new Map<string, string>();

async function readVolumeText(root: string, filename: string) {
  const cacheKey = `${root}:${filename}`;
  const cached = verifiedVolumeText.get(cacheKey);
  if (cached !== undefined) return cached;
  const opened = await safeOpen(root, ["course-media", "assets", filename]);
  if (!opened) return null;
  try {
    if (opened.info.size <= 0 || opened.info.size > MAX_TEXT) return null;
    const bytes = await opened.file.readFile();
    if (hash(bytes) !== filename.slice(0, 64)) return null;
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (verifiedVolumeText.size >= 120) verifiedVolumeText.clear();
    verifiedVolumeText.set(cacheKey, text);
    return text;
  } catch {
    return null;
  } finally {
    await opened.file.close();
  }
}

async function volumeMediaDocs(scope: StaffProgramScope, paths: ReadonlyMap<string, Doc>) {
  const root = configuredCourseMediaRoot(process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  if (!root) return [];
  const result: Doc[] = [];
  // The learner index requires the current manifest even when the player is
  // allowed to retain its previous one-minute list.
  for (const item of await publishedCourseMedia(root, true)) {
    const related = item.pages.map(pathOnly).filter(page => paths.has(page));
    if (!related.length) continue;
    const publicItem = publicCourseMedia(item);
    const captions = await readVolumeText(root, item.captions);
    const parent = paths.get(related[0]);
    const owners = [...new Set([...related, publicItem.media, publicItem.transcript])];
    const timed = captions ? timedCaptionDocs(scope, `course-media:${item.id}`, item.title, publicItem.media, captions, owners, parent) : [];
    if (timed.length) {
      result.push(...timed);
      continue;
    }
    const transcript = await readVolumeText(root, item.transcript);
    if (transcript) result.push(...transcriptDocs(scope, `course-media:${item.id}`, item.title, publicItem.transcript, transcript, owners, parent));
  }
  return result;
}

/** Augment the app's current scoped Ask corpus with missing original passages. */
export async function publishedResourceSupplements(scope: StaffProgramScope, docs: readonly Doc[], publicRoot = path.join(process.cwd(), "public")): Promise<Doc[]> {
  const paths = new Map(docs.filter(doc => doc.status === "approved" && doc.href.startsWith("/") && !doc.href.startsWith("//"))
    .map(doc => [pathOnly(doc.href), doc]));
  const results = await Promise.all([
    downloadDocs(scope, paths, publicRoot), waterPodcastDocs(scope, paths, publicRoot),
    recordingDocs(scope, docs, publicRoot), volumeMediaDocs(scope, paths),
    ...curriculumMediaSources().map(source => readStaticRecording(scope, source, paths, publicRoot)),
  ]);
  return results.flat();
}

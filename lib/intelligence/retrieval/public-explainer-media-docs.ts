import "server-only";
import { createHash } from "node:crypto";
import { openSync, readFileSync, closeSync, statSync, realpathSync, readSync } from "node:fs";
import path from "node:path";
import explainers from "@/lib/program/explainer-videos.json";
import guide from "@/lib/program/end-user-guide-media.json";
import toolkit from "@/lib/program/equity-toolkit-tutorial-media.json";
import { FIRST_CONTACT_CLIPS } from "@/components/multimedia/dsd-first-contact-data";
import type { StaffProgramScope } from "@/lib/content/staff-publications";
import type { Doc } from "./search";
import { publicMediaPassages } from "./public-course-media-docs";
import { offloadedFileAt, type OffloadedPublicFile } from "@/lib/storage/public-offload-manifest";

type Clip = { title: string; summary: string; src: string; poster: string; captions: string; transcript: string };
type Entry = { id: string; href: string; related: string[]; gates?: string[] };
const ENTRIES: Entry[] = [
  { id: "core-fifteen", href: "/learn", related: ["/learn"], gates: ["learn.page"] },
  { id: "decision-depth", href: "/equity-review", related: ["/equity-review"] },
  { id: "how-program-works", href: "/program/model", related: ["/program/model"] },
  { id: "program-charter", href: "/program-foundation", related: ["/program-foundation"] },
  { id: "welcome-to-one-dsd", href: "/user-guide", related: ["/user-guide"] },
  { id: "community-briefs", href: "/minnesota-communities", related: ["/minnesota-communities"], gates: ["communities.index"] },
  { id: "draft-review", href: "/practice/gp-9", related: ["/practice/gp-9"], gates: ["practice.path-shell", "graduation-path.gp-9"] },
  { id: "equity-pause", href: "/practice/gp-12", related: ["/practice/gp-12"], gates: ["practice.path-shell", "graduation-path.gp-12"] },
  // My work plays the same journey video above the saved plans.
  { id: "learning-journey", href: "/learn/paths", related: ["/learn/paths", "/my-work"] },
];

/** Only fixed public video paths may enter this projection; no owner or volume data. */
function resolvePublicMedia(root: string, url: string): { file: string; hashPrefix?: string; moved?: OffloadedPublicFile } | null {
  if (typeof url !== "string" || !/^\/videos\/[a-zA-Z0-9._/-]+(?:\?v=[a-f0-9]{12,64})?$/.test(url)) return null;
  const [pathname, query] = url.split("?");
  if (pathname.split("/").some(part => part === "." || part === "..")) return null;
  try {
    const base = realpathSync(root); const file = realpathSync(path.resolve(base, "." + pathname));
    if (!file.startsWith(base + path.sep)) return null;
    return { file, hashPrefix: query?.slice(2) };
  } catch {
    // Not on disk: the Docker build may have moved it to the media bucket after checking its bytes.
    const file = path.resolve(root, "." + pathname);
    const moved = offloadedFileAt(file);
    return moved ? { file, hashPrefix: query?.slice(2), moved } : null;
  }
}

function readPublic(root: string, url: string, maximum: number): Buffer | null {
  try {
    const resolved = resolvePublicMedia(root, url); if (!resolved || resolved.moved) return null;
    const stat = statSync(resolved.file); if (!stat.isFile() || stat.size <= 0 || stat.size > maximum) return null;
    const bytes = readFileSync(resolved.file);
    if (resolved.hashPrefix && !createHash("sha256").update(bytes).digest("hex").startsWith(resolved.hashPrefix)) return null;
    return bytes;
  } catch { return null; }
}

/** A poster or video is present: on disk with readable, matching bytes, or moved with a matching identity. */
function publicMediaPresent(root: string, url: string, maximum: number): boolean {
  const resolved = resolvePublicMedia(root, url); if (!resolved) return false;
  if (resolved.moved) return resolved.moved.bytes > 0 && resolved.moved.bytes <= maximum && (!resolved.hashPrefix || resolved.moved.sha256.startsWith(resolved.hashPrefix));
  return readPublic(root, url, maximum) !== null;
}

function availableTranscript(root: string, clip: Clip): string | null {
  try {
    const video = resolvePublicMedia(root, clip.src); if (!video) return null;
    if (video.moved) {
      // Same checks against the identity recorded when the build checked and moved the bytes.
      const moved = video.moved;
      if (moved.bytes < 1024 || moved.bytes > 64 * 1024 * 1024) return null;
      if (video.hashPrefix && !moved.sha256.startsWith(video.hashPrefix)) return null;
      if (Buffer.from(moved.head, "base64").subarray(4, 8).toString("ascii") !== "ftyp") return null;
    } else {
      const stat = statSync(video.file); if (!stat.isFile() || stat.size < 1024 || stat.size > 64 * 1024 * 1024) return null;
      // Check full bytes for a versioned asset; otherwise only inspect its header.
      if (video.hashPrefix && !readPublic(root, clip.src, 64 * 1024 * 1024)) return null;
      const fd = openSync(video.file, "r"); const header = Buffer.alloc(8);
      try { if (readSync(fd, header) !== 8 || header.subarray(4).toString("ascii") !== "ftyp") return null; }
      finally { closeSync(fd); }
    }
    if (!publicMediaPresent(root, clip.poster, 8 * 1024 * 1024)) return null;
    const captions = readPublic(root, clip.captions, 1024 * 1024);
    if (!captions?.toString("utf8").startsWith("WEBVTT")) return null;
    const transcript = readPublic(root, clip.transcript, 512 * 1024); if (!transcript) return null;
    return new TextDecoder("utf-8", { fatal: true }).decode(transcript).trim() || null;
  } catch { return null; }
}

/** Exact current public transcript text, split into citation-sized passages. */
export function publicExplainerMediaDocs(scope: StaffProgramScope, published: ReadonlySet<string>, publicRoot = path.join(process.cwd(), "public")): Doc[] {
  const entries = [...ENTRIES];
  // Both support pages play the right-person video; each published one is a related page.
  const supportPages = [...(published.has("support.right-person") ? ["/support/right-person"] : []), ...(published.has("support.page") ? ["/support"] : [])];
  if (supportPages.length) entries.push({ id: "right-person", href: supportPages[0], related: supportPages });
  const docs: Doc[] = [];
  for (const entry of entries) {
    if (entry.gates?.some(gate => !published.has(gate))) continue;
    const clip = (explainers as Record<string, Clip>)[entry.id];
    if (!clip || (entry.id === "welcome-to-one-dsd" && (!guide.ready || guide.transcript !== clip.transcript))) continue;
    const text = availableTranscript(publicRoot, clip); if (!text) continue;
    // The decision-depth video also renders on these two publication-gated pages.
    const related = entry.id === "decision-depth" ? [...entry.related,
      ...(published.has("practice.page") ? ["/practice"] : []),
      ...(published.has("equity-toolkit.home") ? ["/learn/equity-toolkit"] : []),
    ] : entry.related;
    docs.push(...publicMediaPassages(scope, `explainer:${entry.id}`, `${clip.title}: video transcript`, clip.transcript, text, related));
  }
  if (published.has("equity-toolkit.home")) {
    const clip: Clip = { ...toolkit, title: "Equity Analysis Toolkit worked example", summary: "A worked example of reviewing a CFSS notice." };
    const text = availableTranscript(publicRoot, clip);
    if (text) docs.push(...publicMediaPassages(scope, "explainer:toolkit-worked-example", `${clip.title}: video transcript`, clip.transcript, text, ["/learn/equity-toolkit/practice"]));
  }
  if (published.has("dsd-scenario.dsd-interpreter-first-contact")) {
    const href = "/one-dsd/scenarios/dsd-interpreter-first-contact#first-contact-listening-title";
    for (const clip of FIRST_CONTACT_CLIPS) docs.push(...publicMediaPassages(scope, `first-contact:${clip.file}`, `${clip.title}: practice audio transcript`, href, clip.transcript, ["/one-dsd/scenarios/dsd-interpreter-first-contact"]));
  }
  return docs;
}

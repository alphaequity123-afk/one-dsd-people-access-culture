import "server-only";

import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { requestOverviewVoice } from "@/lib/intelligence/clone/overview-voice";
import type { ResourceArtifact } from "@/lib/learning/resource-artifact-types";

export type RenderedResourceFile = {
  kind: "audio" | "video" | "captions" | "transcript";
  fileName: string;
  mime: string;
};

type Voice = "geffen" | "host1" | "host2";
type Section = {
  heading: string;
  text: string;
  voice: Voice;
  points: string[];
  sources: string[];
};
type Cue = { start: number; end: number; text: string };
type Clip = { pcm: Buffer; cues: Cue[] };

const SAMPLE_RATE = 24_000;
const BYTES_PER_FRAME = 2;
const PAUSE_FRAMES = 8_400;
const MAX_CLIP_FRAMES = SAMPLE_RATE * 150;
const MAX_TOTAL_FRAMES = SAMPLE_RATE * 300;
const MAX_PACKET = 3_000_000;
const execute = promisify(execFile);
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const clean = (text: string) => text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();

export class ResourceMediaRenderError extends Error {
  constructor(readonly code: "invalid_outline" | "invalid_speech" | "speech_unavailable" | "encoder_unavailable" | "encoding_failed") {
    super(code);
  }
}

function sectionsOf(artifact: ResourceArtifact): Section[] {
  if (artifact.kind !== "audio-overview" && artifact.kind !== "video-overview") return [];
  const maximum = artifact.kind === "audio-overview" ? 6 : 5;
  const minimum = artifact.kind === "audio-overview" ? 4 : 3;
  if (artifact.sections.length < minimum || artifact.sections.length > maximum) throw new ResourceMediaRenderError("invalid_outline");
  if (artifact.kind === "audio-overview") {
    return artifact.sections.map((section, index) => {
      const voice = index % 2 === 0 ? "host1" : "host2";
      if (section.speaker !== voice || !clean(section.text) || section.text.length > 350) throw new ResourceMediaRenderError("invalid_outline");
      return { heading: voice === "host1" ? "Host 1" : "Host 2", text: clean(section.text), voice, points: [], sources: section.sourceIds };
    });
  }
  return artifact.sections.map(section => {
    if (!clean(section.heading) || !clean(section.narration) || section.narration.length > 460) throw new ResourceMediaRenderError("invalid_outline");
    return { heading: clean(section.heading), text: clean(section.narration), voice: "geffen", points: section.onScreen.map(clean).filter(Boolean), sources: section.sourceIds };
  });
}

/** The approved provider sends 24 kHz, mono, signed 16-bit PCM WAV. Check
 * container and frame lengths before handing any returned bytes to FFmpeg. */
function readWav(wav: Buffer): Buffer {
  if (wav.length < 44 || wav.toString("ascii", 0, 4) !== "RIFF" || wav.toString("ascii", 8, 12) !== "WAVE" ||
      wav.readUInt32LE(4) + 8 !== wav.length) throw new ResourceMediaRenderError("invalid_speech");
  let format = false;
  let pcm: Buffer | undefined;
  for (let pos = 12; pos + 8 <= wav.length;) {
    const size = wav.readUInt32LE(pos + 4);
    const start = pos + 8;
    const end = start + size;
    if (end > wav.length) throw new ResourceMediaRenderError("invalid_speech");
    const kind = wav.toString("ascii", pos, pos + 4);
    if (kind === "fmt ") {
      format = size >= 16 && wav.readUInt16LE(start) === 1 && wav.readUInt16LE(start + 2) === 1 &&
        wav.readUInt32LE(start + 4) === SAMPLE_RATE && wav.readUInt32LE(start + 8) === SAMPLE_RATE * BYTES_PER_FRAME &&
        wav.readUInt16LE(start + 12) === BYTES_PER_FRAME && wav.readUInt16LE(start + 14) === 16;
    } else if (kind === "data") {
      if (pcm) throw new ResourceMediaRenderError("invalid_speech");
      pcm = wav.subarray(start, end);
    }
    pos = end + (size % 2);
  }
  if (!format || !pcm || pcm.length < 2_400 || pcm.length % BYTES_PER_FRAME || pcm.length / BYTES_PER_FRAME > MAX_CLIP_FRAMES) {
    throw new ResourceMediaRenderError("invalid_speech");
  }
  return pcm;
}

function wavFile(pcm: Buffer): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(pcm.length + 36, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * BYTES_PER_FRAME, 28);
  header.writeUInt16LE(BYTES_PER_FRAME, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function exactWords(text: string): string {
  return clean(text).replace(/\[\d+\]/g, "").replace(/[*`]/g, "").replace(/\s+/g, " ").trim();
}

async function synthesize(section: Section, signal: AbortSignal): Promise<Clip> {
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await requestOverviewVoice(section.text, section.voice, signal);
  } catch {
    signal.throwIfAborted();
    throw new ResourceMediaRenderError("speech_unavailable");
  }
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const chunks: Buffer[] = [];
  const cues: Cue[] = [];
  let totalFrames = 0;
  let pending = "";
  let done = false;

  function packet(line: string) {
    if (!line.trim()) return;
    if (done || line.length > MAX_PACKET) throw new ResourceMediaRenderError("invalid_speech");
    const value = JSON.parse(line) as { error?: unknown; audio?: unknown; sequence?: unknown; done?: unknown; voice?: unknown; text?: unknown; verified?: unknown };
    if (value.error) throw new ResourceMediaRenderError("speech_unavailable");
    if (value.voice !== section.voice) throw new ResourceMediaRenderError("invalid_speech");
    if (value.done === true) {
      if (value.audio !== undefined) throw new ResourceMediaRenderError("invalid_speech");
      done = true;
      return;
    }
    if (value.verified !== true || typeof value.audio !== "string" || value.sequence !== chunks.length || chunks.length >= 70 ||
        !/^[a-zA-Z0-9+/]+={0,2}$/.test(value.audio) || value.audio.length % 4 !== 0) {
      throw new ResourceMediaRenderError("invalid_speech");
    }
    const pcm = readWav(Buffer.from(value.audio, "base64"));
    const start = totalFrames;
    totalFrames += pcm.length / BYTES_PER_FRAME;
    if (totalFrames > MAX_CLIP_FRAMES) throw new ResourceMediaRenderError("invalid_speech");
    chunks.push(pcm);
    cues.push({ start, end: totalFrames, text: typeof value.text === "string" && value.text.length <= 460 ? clean(value.text) : "" });
  }

  try {
    for (;;) {
      signal.throwIfAborted();
      const data = await reader.read();
      if (data.done) break;
      pending += decoder.decode(data.value, { stream: true });
      let newline: number;
      while ((newline = pending.indexOf("\n")) >= 0) {
        packet(pending.slice(0, newline));
        pending = pending.slice(newline + 1);
      }
      if (pending.length > MAX_PACKET) throw new ResourceMediaRenderError("invalid_speech");
    }
    packet(pending + decoder.decode());
    if (!done || !chunks.length) throw new ResourceMediaRenderError("invalid_speech");
    const exact = cues.every(cue => cue.text) && exactWords(cues.map(cue => cue.text).join(" ")) === exactWords(section.text);
    return {
      pcm: Buffer.concat(chunks),
      cues: exact ? cues : [{ start: 0, end: totalFrames, text: section.text }],
    };
  } catch (error) {
    signal.throwIfAborted();
    throw error instanceof ResourceMediaRenderError ? error : new ResourceMediaRenderError("invalid_speech");
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

async function atomicWrite(file: string, value: Buffer | string) {
  const temporary = file + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temporary, value, { mode: 0o600, flag: "wx" });
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

function cacheKey(section: Section) {
  return digest(JSON.stringify({ version: 2, voice: section.voice, text: section.text }));
}

async function cachedClip(section: Section, directory: string, signal: AbortSignal): Promise<Clip> {
  const key = cacheKey(section);
  const wav = path.join(directory, key + ".wav");
  const receiptFile = path.join(directory, key + ".json");
  try {
    const [wavInfo, receiptInfo] = await Promise.all([lstat(wav), lstat(receiptFile)]);
    if (!wavInfo.isFile() || !receiptInfo.isFile() || wavInfo.size > MAX_CLIP_FRAMES * BYTES_PER_FRAME + 44 || receiptInfo.size > 64_000) {
      throw new ResourceMediaRenderError("invalid_speech");
    }
    const [audio, receipt] = await Promise.all([readFile(wav), readFile(receiptFile, "utf8")]);
    const pcm = readWav(audio);
    const record = JSON.parse(receipt) as { key?: unknown; sha256?: unknown; cues?: Cue[] };
    const frames = pcm.length / BYTES_PER_FRAME;
    if (record.key === key && record.sha256 === digest(audio) && Array.isArray(record.cues) &&
        record.cues.length > 0 && record.cues.length <= 70 && record.cues.every((cue, index, cues) =>
          Number.isInteger(cue.start) && Number.isInteger(cue.end) && cue.start === (index ? cues[index - 1].end : 0) &&
          cue.end > cue.start && cue.end <= frames && typeof cue.text === "string" && cue.text.length <= 460) &&
        record.cues[record.cues.length - 1].end === frames &&
        exactWords(record.cues.map(cue => cue.text).join(" ")) === exactWords(section.text)) {
      return { pcm, cues: record.cues };
    }
  } catch {
    // A missing or incomplete receipt is safe to regenerate.
  }
  signal.throwIfAborted();
  const clip = await synthesize(section, signal);
  const audio = wavFile(clip.pcm);
  await atomicWrite(wav, audio);
  await atomicWrite(receiptFile, JSON.stringify({ key, sha256: digest(audio), cues: clip.cues }));
  return clip;
}

function linesAt(text: string, width: number): string[] {
  const output: string[] = [];
  let line = "";
  for (const word of clean(text).split(" ")) {
    for (const piece of word.match(new RegExp(`.{1,${width}}`, "gu")) ?? []) {
      if (line && line.length + piece.length + 1 > width) {
        output.push(line);
        line = "";
      }
      line += (line ? " " : "") + piece;
    }
  }
  if (line) output.push(line);
  return output;
}

function timecode(frames: number): string {
  const ms = Math.round(frames / SAMPLE_RATE * 1000);
  const fields = [Math.floor(ms / 3_600_000), Math.floor(ms / 60_000) % 60, Math.floor(ms / 1000) % 60];
  return fields.map(field => String(field).padStart(2, "0")).join(":") + "." + String(ms % 1000).padStart(3, "0");
}

function cueText(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function renderCaptions(sections: Section[], clips: Clip[]) {
  const blocks = ["WEBVTT"];
  let offset = 0;
  for (let index = 0; index < clips.length; index++) {
    const clip = clips[index];
    const section = sections[index];
    clip.cues.forEach((cue, cueIndex) => {
      const speaker = section.voice !== "geffen" && cueIndex === 0 ? section.heading + ": " : "";
      const lines = linesAt(speaker + cue.text, 42);
      const groups: string[][] = [];
      for (let line = 0; line < lines.length; line += 2) groups.push(lines.slice(line, line + 2));
      const weights = groups.map(group => group.join(" ").length);
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      let previous = offset + cue.start;
      let completed = 0;
      groups.forEach((group, position) => {
        completed += weights[position];
        const end = offset + cue.start + Math.round((cue.end - cue.start) * completed / total);
        if (end > previous) blocks.push(`${timecode(previous)} --> ${timecode(end)}\n${group.map(cueText).join("\n")}`);
        previous = end;
      });
    });
    offset += clip.pcm.length / BYTES_PER_FRAME + PAUSE_FRAMES;
  }
  return blocks.join("\n\n") + "\n";
}

function renderTranscript(artifact: ResourceArtifact, sections: Section[]) {
  const ids = new Map(artifact.sources.map((source, index) => [source.id, index + 1]));
  const text = [clean(artifact.title), clean(artifact.summary), ""];
  for (const section of sections) {
    const numbers = [...new Set(section.sources.map(id => ids.get(id)).filter((id): id is number => id !== undefined))];
    text.push(`${section.heading}\n${section.text}${numbers.length ? "\nReadings: " + numbers.join(", ") : ""}`, "");
  }
  text.push("Readings");
  artifact.sources.forEach((source, index) => text.push(`${index + 1}. ${clean(source.title)} — ${source.href}`));
  return text.join("\n") + "\n";
}

async function ffmpeg(binary: string, cwd: string, args: string[], signal: AbortSignal) {
  try {
    await execute(binary, ["-hide_banner", "-nostdin", "-loglevel", "error", "-y", ...args], {
      cwd, signal, timeout: 120_000, maxBuffer: 32_768, windowsHide: true,
    });
  } catch {
    signal.throwIfAborted();
    throw new ResourceMediaRenderError("encoding_failed");
  }
}

async function chapterCard(file: string, fontfile: string, chapter: string, heading: string, points: string[], readings: string) {
  const { default: sharp } = await import("sharp");
  // Text is a separate transparent bitmap from the shapes. Use the bundled
  // font directly so Linux does not need a system font or FFmpeg drawtext.
  async function layer(text: string, top: number, size: number, color: string, height: number) {
    const image = await sharp({ text: {
      text: `<span foreground="${color}">${cueText(text)}</span>`,
      font: `DejaVu Sans ${size}`, fontfile, width: 1112, wrap: "word-char", rgba: true,
    } }).png().toBuffer();
    const input = await sharp(image).resize({ width: 1112, height, fit: "inside", withoutEnlargement: true }).png().toBuffer();
    return { input, top, left: 84 };
  }
  const text = await Promise.all([
    layer(chapter, 94, 26, "#B8E1D8", 35),
    layer(heading, 146, 54, "#FFFFFF", 124),
    layer(points.slice(0, 4).map(point => "• " + point).join("\n"), 321, 33, "#EDF5FA", 300),
    layer(readings, 649, 24, "#B8E1D8", 39),
  ]);
  await sharp({ create: { width: 1280, height: 720, channels: 4, background: "#162D43" } })
    .composite([
      { input: { create: { width: 112, height: 8, channels: 4, background: "#89D5C5" } }, top: 63, left: 84 },
      { input: { create: { width: 1112, height: 1, channels: 4, background: "#4C6C81" } }, top: 291, left: 84 },
      ...text,
    ])
    .png()
    .toFile(file);
}

async function encodeVideo(binary: string, cwd: string, artifact: ResourceArtifact, sections: Section[], clips: Clip[], signal: AbortSignal) {
  const fontfile = path.join(process.cwd(), "lib", "consultant-toolkit", "fonts", "DejaVuSans.ttf");
  const ids = new Map(artifact.sources.map((source, index) => [source.id, index + 1]));
  const sceneNames: string[] = [];
  for (let index = 0; index < sections.length; index++) {
    const section = sections[index];
    const scene = `scene-${index + 1}.mp4`;
    const seconds = (clips[index].pcm.length / BYTES_PER_FRAME + PAUSE_FRAMES) / SAMPLE_RATE;
    const sources = [...new Set(section.sources.map(id => ids.get(id)).filter((id): id is number => id !== undefined))];
    const points = section.points.length ? section.points : [artifact.title];
    try {
      await chapterCard(path.join(cwd, "card.png"), fontfile, `Chapter ${index + 1} of ${sections.length}`, section.heading, points,
        sources.length ? `Readings ${sources.join(", ")} · See the transcript for links` : "See the transcript for the readings");
    } catch {
      throw new ResourceMediaRenderError("encoding_failed");
    }
    await ffmpeg(binary, cwd, [
      "-protocol_whitelist", "file,pipe", "-f", "image2", "-loop", "1", "-framerate", "24", "-i", "card.png",
      "-t", seconds.toFixed(6), "-an", "-c:v", "libx264", "-preset", "veryfast",
      "-tune", "stillimage", "-crf", "22", "-pix_fmt", "yuv420p", "-threads", "2", scene,
    ], signal);
    sceneNames.push(scene);
  }
  await writeFile(path.join(cwd, "scenes.txt"), sceneNames.map(name => `file '${name}'`).join("\n") + "\n");
  await ffmpeg(binary, cwd, [
    "-protocol_whitelist", "file,pipe", "-f", "concat", "-safe", "1", "-i", "scenes.txt",
    "-i", "master.wav", "-i", "captions.vtt", "-map", "0:v:0", "-map", "1:a:0", "-map", "2:s:0",
    "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000", "-c:a", "aac", "-b:a", "128k",
    "-c:s", "mov_text", "-metadata:s:s:0", "language=eng", "-disposition:s:0", "0",
    "-movflags", "+faststart", "-shortest", "overview.mp4",
  ], signal);
}

/** Build reviewable files in a private durable job directory. Verified speech
 * turns survive an interrupted job. Partial encodes never become preview files. */
export async function renderResourceMedia(artifact: ResourceArtifact, outputDir: string, signal: AbortSignal): Promise<RenderedResourceFile[]> {
  const sections = sectionsOf(artifact);
  if (!sections.length) return [];
  const { default: binary } = await import("ffmpeg-static");
  if (!binary) throw new ResourceMediaRenderError("encoder_unavailable");
  signal.throwIfAborted();
  const root = await realpath(outputDir);
  const speech = path.join(root, ".speech-cache");
  await mkdir(speech, { recursive: true, mode: 0o700 });
  if (await realpath(speech) !== speech) throw new ResourceMediaRenderError("invalid_speech");
  const clips: Clip[] = [];
  let frames = 0;
  for (const section of sections) {
    signal.throwIfAborted();
    const clip = await cachedClip(section, speech, signal);
    frames += clip.pcm.length / BYTES_PER_FRAME + PAUSE_FRAMES;
    if (frames > MAX_TOTAL_FRAMES) throw new ResourceMediaRenderError("invalid_speech");
    clips.push(clip);
  }
  const working = await mkdtemp(path.join(root, ".render-"));
  try {
    const pause = Buffer.alloc(PAUSE_FRAMES * BYTES_PER_FRAME);
    await Promise.all([
      writeFile(path.join(working, "master.wav"), wavFile(Buffer.concat(clips.flatMap(clip => [clip.pcm, pause])))),
      writeFile(path.join(working, "captions.vtt"), renderCaptions(sections, clips)),
      writeFile(path.join(working, "transcript.txt"), renderTranscript(artifact, sections)),
    ]);
    const video = artifact.kind === "video-overview";
    if (video) await encodeVideo(binary, working, artifact, sections, clips, signal);
    else await ffmpeg(binary, working, [
      "-protocol_whitelist", "file,pipe", "-i", "master.wav", "-vn",
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000", "-c:a", "libmp3lame", "-b:a", "128k", "overview.mp3",
    ], signal);
    const files: RenderedResourceFile[] = [
      video ? { kind: "video", fileName: "overview.mp4", mime: "video/mp4" }
        : { kind: "audio", fileName: "overview.mp3", mime: "audio/mpeg" },
      { kind: "captions", fileName: "captions.vtt", mime: "text/vtt; charset=utf-8" },
      { kind: "transcript", fileName: "transcript.txt", mime: "text/plain; charset=utf-8" },
    ];
    for (const file of files) {
      const info = await stat(path.join(working, file.fileName));
      if (!info.isFile() || info.size < 16) throw new ResourceMediaRenderError("encoding_failed");
    }
    signal.throwIfAborted();
    for (const file of files) await rename(path.join(working, file.fileName), path.join(root, file.fileName));
    return files;
  } finally {
    if (path.dirname(working) === root && path.basename(working).startsWith(".render-") && await realpath(working) === working) {
      await rm(working, { recursive: true, force: true });
    }
  }
}

import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { beforeEach, expect, it, vi } from "vitest";
import { statSync } from "node:fs";
import { requestOverviewVoice } from "@/lib/intelligence/clone/overview-voice";
import type { ResourceArtifact } from "./resource-artifact-types";
import { renderResourceMedia } from "./resource-media-renderer";
import { parseVtt } from "./vtt";

vi.mock("@/lib/intelligence/clone/overview-voice", () => ({ requestOverviewVoice: vi.fn() }));

function toneWav(): Buffer {
  const frames = 24_000;
  const result = Buffer.alloc(44 + frames * 2);
  result.write("RIFF", 0);
  result.writeUInt32LE(result.length - 8, 4);
  result.write("WAVEfmt ", 8);
  result.writeUInt32LE(16, 16);
  result.writeUInt16LE(1, 20);
  result.writeUInt16LE(1, 22);
  result.writeUInt32LE(24_000, 24);
  result.writeUInt32LE(48_000, 28);
  result.writeUInt16LE(2, 32);
  result.writeUInt16LE(16, 34);
  result.write("data", 36);
  result.writeUInt32LE(frames * 2, 40);
  for (let frame = 0; frame < frames; frame++) result.writeInt16LE(Math.round(2_000 * Math.sin(2 * Math.PI * 440 * frame / 24_000)), 44 + frame * 2);
  return result;
}

function packets(text: string, voice: string, verified = true) {
  const lines = [
    { sequence: 0, voice, verified, text, audio: toneWav().toString("base64") },
    { voice, done: true },
  ].map(value => JSON.stringify(value)).join("\n") + "\n";
  const bytes = new TextEncoder().encode(lines);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.subarray(0, 117));
      controller.enqueue(bytes.subarray(117));
      controller.close();
    },
  });
}

const shared = {
  version: 1 as const,
  title: "Test learning overview",
  summary: "An overview of a source.",
  resourcePath: "/library/test",
  sourceRevision: "test-version",
  createdAt: "2026-11-12T00:00:00Z",
  sources: [{ id: "reading1", title: "Test reading", href: "/library/test" }],
};
const podcast: ResourceArtifact = {
  ...shared, kind: "audio-overview",
  sections: [
    { speaker: "host1", text: "Welcome. Begin with an observation.", sourceIds: ["reading1"] },
    { speaker: "host2", text: "Separate the observation from the interpretation.", sourceIds: ["reading1"] },
    { speaker: "host1", text: "What evidence would test your reading?", sourceIds: ["reading1"] },
    { speaker: "host2", text: "Ask the people who use the service.", sourceIds: ["reading1"] },
  ],
};

async function withJob(check: (directory: string) => Promise<void>) {
  const parent = await realpath(tmpdir());
  const directory = await mkdtemp(path.join(parent, "pac-overview-render-test-"));
  try {
    await check(directory);
  } finally {
    if (path.dirname(directory) === parent && path.basename(directory).startsWith("pac-overview-render-test-") && await realpath(directory) === directory) {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

beforeEach(() => {
  vi.mocked(requestOverviewVoice).mockReset();
  vi.mocked(requestOverviewVoice).mockImplementation(async (text, voice) => packets(text, voice));
});

it("encodes both approved podcast hosts, times the captions, and reuses verified clips on retry", async () => withJob(async directory => {
  const signal = new AbortController().signal;
  const result = await renderResourceMedia(podcast, directory, signal);
  expect(result.map(file => file.fileName)).toEqual(["overview.mp3", "captions.vtt", "transcript.txt"]);
  expect(vi.mocked(requestOverviewVoice).mock.calls.map(call => call[1])).toEqual(["host1", "host2", "host1", "host2"]);
  const captions = parseVtt(await readFile(path.join(directory, "captions.vtt"), "utf8"));
  expect(captions[0]).toMatchObject({ start: 0, end: 1 });
  expect(captions.some(cue => cue.start === 1.35 && cue.text.includes("Host 2:"))).toBe(true);
  expect(await readFile(path.join(directory, "transcript.txt"), "utf8")).toContain("1. Test reading — /library/test");
  await renderResourceMedia(podcast, directory, signal);
  expect(requestOverviewVoice).toHaveBeenCalledTimes(4);
}), 15_000);

// The chapter photos are fetched when the site is built. A checkout that holds only their small placeholders cannot encode.
const photosPresent = (() => { try { return statSync(path.join(process.cwd(), "public/learning/water-we-swim-in/06/image-3.webp")).size > 2000; } catch { return false; } })();
it.skipIf(!photosPresent)("encodes a GEFen narrated video with accessible caption and audio tracks", async () => withJob(async directory => {
  const video: ResourceArtifact = {
    ...shared, kind: "video-overview",
    sections: [1, 2, 3].map(index => ({
      heading: `Chapter ${index}: Review the source`, narration: `Chapter ${index} asks you to review the source.`,
      onScreen: ["Check the source.", "Identify the next action."], visualCue: "A text card", sourceIds: ["reading1"],
    })),
  };
  const result = await renderResourceMedia(video, directory, new AbortController().signal);
  expect(result[0]).toMatchObject({ kind: "video", fileName: "overview.mp4" });
  expect(vi.mocked(requestOverviewVoice).mock.calls.map(call => call[1])).toEqual(["geffen", "geffen", "geffen"]);
  const binary = (await import("ffmpeg-static")).default;
  if (!binary) throw new Error("FFmpeg must be present for the encode test");
  const output = await promisify(execFile)(binary, ["-hide_banner", "-i", path.join(directory, "overview.mp4"),
    "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"], { windowsHide: true, maxBuffer: 32_768 });
  expect(output.stderr).toContain("Video: h264");
  expect(output.stderr).toContain("Audio: aac");
  expect(output.stderr).toContain("Subtitle: mov_text");
}), 25_000);

it("rejects a mismatched provider voice before publishing a preview", async () => withJob(async directory => {
  vi.mocked(requestOverviewVoice).mockImplementation(async text => packets(text, "geffen"));
  await expect(renderResourceMedia(podcast, directory, new AbortController().signal)).rejects.toMatchObject({ code: "invalid_speech" });
  await expect(access(path.join(directory, "overview.mp3"))).rejects.toMatchObject({ code: "ENOENT" });
}));

it("rejects audio that the provider did not verify", async () => withJob(async directory => {
  vi.mocked(requestOverviewVoice).mockImplementation(async (text, voice) => packets(text, voice, false));
  await expect(renderResourceMedia(podcast, directory, new AbortController().signal)).rejects.toMatchObject({ code: "invalid_speech" });
  await expect(access(path.join(directory, "overview.mp3"))).rejects.toMatchObject({ code: "ENOENT" });
}));

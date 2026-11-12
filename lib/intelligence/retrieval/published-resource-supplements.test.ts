import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { publishedResourceSupplements } from "./published-resource-supplements";
import type { Doc } from "./search";

const parent: Doc = {
  id: "test-parent", kind: "content", title: "Published lesson", href: "/courses/example",
  status: "approved", scope: "agencywide", reviewDate: "", authority: "learning", type: "course_lesson",
  summary: "A test lesson", text: "A test lesson", tags: [], intents: [],
};

afterEach(() => vi.unstubAllEnvs());

it("uses only the current public media manifest and an approved indexed parent for a timestamped citation", async () => {
  const testRoot = await mkdtemp(path.join(tmpdir(), "pac-learning-test-"));
  const root = path.join(testRoot, "geffen-public");
  const assets = path.join(root, "course-media", "assets");
  const manifests = path.join(root, "course-media", "manifests");
  vi.stubEnv("RAILWAY_VOLUME_MOUNT_PATH", testRoot);
  vi.stubEnv("PAC_GEFFEN_PUBLIC_MEDIA_ROOT", root);
  const createAsset = async (ext: string, body: string) => {
    const name = createHash("sha256").update(body).digest("hex") + ext;
    await writeFile(path.join(assets, name), body);
    return name;
  };

  try {
    await mkdir(assets, { recursive: true });
    await mkdir(manifests, { recursive: true });
    const captions = await createAsset(".vtt", "WEBVTT\n\n00:00:12.000 --> 00:00:16.000\nCheck that the invitation explains how to request language assistance.\n");
    const transcript = await createAsset(".txt", "Check that the invitation explains how to request language assistance.");
    const media = await createAsset(".mp3", "ID3 fixture");
    const manifest = path.join(manifests, "test-audio.json");
    await writeFile(manifest, JSON.stringify({
      format: "course-media-v1", id: "test-audio", title: "Accessible invitations", kind: "audio",
      pages: [parent.href], media, captions, transcript, durationSeconds: 20,
    }));

    const readMedia = async (doc: Doc) => (await publishedResourceSupplements("dsd", [doc], testRoot))
      .filter(item => item.type === "public_media_transcript");
    expect(await readMedia({ ...parent, status: "retired" })).toEqual([]);
    const docs = await readMedia(parent);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      href: `/learning/course-media/${media}#t=12`,
      text: "Check that the invitation explains how to request language assistance.",
      type: "public_media_transcript",
      graphRelated: expect.arrayContaining([parent.href]),
    });

    await unlink(manifest);
    expect(await readMedia(parent)).toEqual([]);
  } finally {
    if (path.dirname(path.resolve(testRoot)) === path.resolve(tmpdir()) && path.basename(testRoot).startsWith("pac-learning-test-")) {
      await rm(testRoot, { recursive: true, force: true });
    }
  }
});

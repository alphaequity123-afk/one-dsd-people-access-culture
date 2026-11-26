import { mkdtemp, mkdir, readFile, rm, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { offload, selected, MIN_BYTES, PREFIX } from "@/scripts/public-offload.mjs";
import { offloadedFileAt, offloadedPublicFile, publicFileAvailable, publicOffloadFiles, resetPublicOffloadCache } from "./public-offload-manifest";
import { parseRange, servePublicOffload } from "./public-offload-serve";
import type { MediaBucketConfiguration } from "./media-bucket";

const config = { endpoint: new URL("https://bucket.example"), bucket: "media", accessKeyId: "a", secretAccessKey: "s", region: "auto", urlStyle: "virtual" } as MediaBucketConfiguration;
const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const exists = (file: string) => access(file).then(() => true, () => false);

let root: string;
beforeEach(async () => { root = await mkdtemp(path.join(os.tmpdir(), "offload-")); resetPublicOffloadCache(); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); resetPublicOffloadCache(); });

async function put(relative: string, bytes: Uint8Array) {
  const file = path.join(root, "public", relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  return file;
}

function fakeBucket(initial: string[] = []) {
  const objects = new Map<string, Uint8Array>(initial.map(name => [PREFIX + name, new Uint8Array()]));
  return {
    objects,
    put: async (_c: unknown, key: string, bytes: Uint8Array) => { objects.set(key, bytes); },
    head: async (_c: unknown, key: string) => (objects.has(key) ? { size: objects.get(key)!.length, etag: "", sha256: "" } : null),
    list: async () => new Set([...objects.keys()].map(key => key.slice(PREFIX.length))),
    log: () => {},
  };
}

describe("selection", () => {
  it("moves large media and documents only", () => {
    expect(selected("/learning/a/slide-1.webp", MIN_BYTES)).toBe(true);
    expect(selected("/learning/a/deck.pptx", 10 * 1024 * 1024)).toBe(true);
    expect(selected("/learning/a/slide-1.webp", MIN_BYTES - 1)).toBe(false);
    expect(selected("/learning/a/index.html", 10 * 1024 * 1024)).toBe(false);
    expect(selected("/learning/a/captions.vtt", 10 * 1024 * 1024)).toBe(false);
    expect(selected("/learning/a/data.json", 10 * 1024 * 1024)).toBe(false);
    expect(selected("/learning/a/PHOTO.PNG", 10 * 1024 * 1024)).toBe(false);
    expect(selected("/learning/water-we-swim-in/06/image-3.webp", 10 * 1024 * 1024)).toBe(false);
  });
});

describe("offload", () => {
  it("uploads missing objects, records identities, then removes the moved files", async () => {
    const video = new Uint8Array(MIN_BYTES + 10).fill(7); video.set(Buffer.from("\0\0\0\x18ftypmp42"), 0);
    const copy = new Uint8Array(video);
    const known = new Uint8Array(MIN_BYTES * 2).fill(3);
    const small = new Uint8Array(100).fill(1);
    const movedVideo = await put("videos/explainers/a.mp4", video);
    const duplicate = await put("videos/explainers/b.mp4", copy);
    const already = await put("learning/x/deck.pptx", known);
    const kept = await put("learning/x/thumb.webp", small);
    const html = await put("learning/x/index.html", new Uint8Array(MIN_BYTES * 2).fill(60));
    const bucket = fakeBucket([sha(known)]);
    const manifest = await offload(root, config, bucket);

    expect([...bucket.objects.keys()].sort()).toEqual([PREFIX + sha(known), PREFIX + sha(video)].sort());
    expect(Object.keys(manifest.files).sort()).toEqual(["/learning/x/deck.pptx", "/videos/explainers/a.mp4", "/videos/explainers/b.mp4"]);
    expect(manifest.files["/videos/explainers/a.mp4"]).toMatchObject({ sha256: sha(video), bytes: video.length, type: "video/mp4" });
    expect(Buffer.from(manifest.files["/videos/explainers/a.mp4"].head, "base64").subarray(4, 8).toString()).toBe("ftyp");
    expect(await exists(movedVideo)).toBe(false);
    expect(await exists(duplicate)).toBe(false);
    expect(await exists(already)).toBe(false);
    expect(await exists(kept)).toBe(true);
    expect(await exists(html)).toBe(true);
    expect(JSON.parse(await readFile(path.join(root, "public-offload.json"), "utf8"))).toEqual(manifest);
  });

  it("removes nothing when an upload fails", async () => {
    const deck = await put("learning/x/deck.pptx", new Uint8Array(MIN_BYTES * 2).fill(9));
    const bucket = fakeBucket();
    await expect(offload(root, config, { ...bucket, put: async () => { throw new Error("The media bucket answered 500."); } })).rejects.toThrow("500");
    expect(await exists(deck)).toBe(true);
    expect(await exists(path.join(root, "public-offload.json"))).toBe(false);
  });

  it("removes nothing when the bucket does not keep an object", async () => {
    const deck = await put("learning/x/deck.pptx", new Uint8Array(MIN_BYTES * 2).fill(9));
    const bucket = fakeBucket();
    await expect(offload(root, config, { ...bucket, head: async () => null })).rejects.toThrow("did not keep");
    expect(await exists(deck)).toBe(true);
  });
});

describe("manifest lookups", () => {
  it("answers for moved files under the app's own public folder only", async () => {
    const deck = new Uint8Array(MIN_BYTES * 2).fill(4);
    await put("learning/x/deck.pptx", deck);
    await put("learning/x/index.html", new Uint8Array(10));
    await offload(root, config, fakeBucket());
    resetPublicOffloadCache();
    expect(offloadedPublicFile("/learning/x/deck.pptx", root)?.sha256).toBe(sha(deck));
    expect(offloadedFileAt(path.join(root, "public/learning/x/deck.pptx"), root)?.bytes).toBe(deck.length);
    expect(offloadedFileAt(path.join(root, "elsewhere/learning/x/deck.pptx"), root)).toBeUndefined();
    expect(offloadedFileAt(path.join(root, "public/../learning/x/deck.pptx"), root)).toBeUndefined();
    expect(publicFileAvailable(path.join(root, "public/learning/x/deck.pptx"), root)).toBe(true);
    expect(publicFileAvailable(path.join(root, "public/learning/x/index.html"), root)).toBe(true);
    expect(publicFileAvailable(path.join(root, "public/learning/x/missing.pptx"), root)).toBe(false);
  });

  it("moves nothing without a list or with an unreadable one", async () => {
    expect(publicOffloadFiles(root).size).toBe(0);
    resetPublicOffloadCache();
    await writeFile(path.join(root, "public-offload.json"), "{not json");
    expect(publicOffloadFiles(root).size).toBe(0);
    resetPublicOffloadCache();
    await writeFile(path.join(root, "public-offload.json"), JSON.stringify({ format: "one-dsd-public-offload-v1", files: {
      "/ok.png": { sha256: "a".repeat(64), bytes: 5, type: "image/png", head: "" },
      "/../bad.png": { sha256: "a".repeat(64), bytes: 5, type: "image/png", head: "" },
      "/bad-hash.png": { sha256: "xyz", bytes: 5, type: "image/png", head: "" },
    } }));
    expect([...publicOffloadFiles(root).keys()]).toEqual(["/ok.png"]);
  });
});

describe("parseRange", () => {
  it("reads single ranges and refuses ones that cannot be met", () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange("bytes=0-9", 100)).toEqual([0, 9]);
    expect(parseRange("bytes=90-", 100)).toEqual([90, 99]);
    expect(parseRange("bytes=-10", 100)).toEqual([90, 99]);
    expect(parseRange("bytes=50-500", 100)).toEqual([50, 99]);
    expect(parseRange("bytes=100-", 100)).toBe("invalid");
    expect(parseRange("bytes=9-3", 100)).toBe("invalid");
    expect(parseRange("bytes=0-1,5-6", 100)).toBeNull();
  });
});

describe("servePublicOffload", () => {
  const entry = { sha256: "b".repeat(64), bytes: 100, type: "video/mp4", head: "" };
  const lookup = (p: string) => (p === "/videos/a.mp4" ? entry : undefined);
  const calls: Array<[string, [number, number] | undefined]> = [];
  const get = async (_c: MediaBucketConfiguration, key: string, range?: [number, number]) => {
    calls.push([key, range]);
    return new Response(new Uint8Array(range ? range[1] - range[0] + 1 : 100), { status: range ? 206 : 200 });
  };
  const request = (headers: Record<string, string> = {}, method = "GET") => new Request("https://app.example/api/public-offload", { method, headers });

  it("serves the whole file and byte ranges from the bucket", async () => {
    calls.length = 0;
    const whole = await servePublicOffload(request(), "/videos/a.mp4", { config, lookup, get });
    expect(whole.status).toBe(200);
    expect(whole.headers.get("content-type")).toBe("video/mp4");
    expect(whole.headers.get("content-length")).toBe("100");
    expect(whole.headers.get("accept-ranges")).toBe("bytes");
    expect(whole.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect((await whole.arrayBuffer()).byteLength).toBe(100);
    const part = await servePublicOffload(request({ range: "bytes=10-19" }), "/videos/a.mp4", { config, lookup, get });
    expect(part.status).toBe(206);
    expect(part.headers.get("content-range")).toBe("bytes 10-19/100");
    expect(part.headers.get("content-length")).toBe("10");
    expect(calls).toEqual([[PREFIX + entry.sha256, undefined], [PREFIX + entry.sha256, [10, 19]]]);
  });

  it("answers validators, HEAD, bad ranges, unknown files and a missing bucket", async () => {
    calls.length = 0;
    expect((await servePublicOffload(request({ "if-none-match": `"${entry.sha256}"` }), "/videos/a.mp4", { config, lookup, get })).status).toBe(304);
    const head = await servePublicOffload(request({}, "HEAD"), "/videos/a.mp4", { config, lookup, get });
    expect(head.status).toBe(200);
    expect(head.headers.get("content-length")).toBe("100");
    const bad = await servePublicOffload(request({ range: "bytes=200-" }), "/videos/a.mp4", { config, lookup, get });
    expect(bad.status).toBe(416);
    expect(bad.headers.get("content-range")).toBe("bytes */100");
    const stale = await servePublicOffload(request({ range: "bytes=0-9", "if-range": '"other"' }), "/videos/a.mp4", { config, lookup, get });
    expect(stale.status).toBe(200);
    expect(calls.length).toBe(1);
    expect((await servePublicOffload(request(), "/videos/other.mp4", { config, lookup, get })).status).toBe(404);
    expect((await servePublicOffload(request(), null, { config, lookup, get })).status).toBe(404);
    const missingObject = await servePublicOffload(request(), "/videos/a.mp4", { config, lookup, get: async () => null });
    expect(missingObject.status).toBe(404);
    const failing = await servePublicOffload(request(), "/videos/a.mp4", { config, lookup, get: async () => { throw new Error("down"); } });
    expect(failing.status).toBe(503);
    const noBucket = await servePublicOffload(request(), "/videos/a.mp4", { config: undefined, lookup, get });
    expect(noBucket.status).toBe(503);
  });
});

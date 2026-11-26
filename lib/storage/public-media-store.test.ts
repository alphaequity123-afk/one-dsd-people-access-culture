import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mediaBucketConfiguration, signedBucketRequest } from "./media-bucket";
import { BUCKET_MEDIA_ROOT, configuredPublicMediaRoot, publicMediaStore, readAloudMediaRoot } from "./public-media-store";
import { ingestCourseMedia, initializeCourseMedia, publishedCourseMedia, serveCourseMediaAsset } from "@/lib/content/course-media";
import { ingestLeadershipMedia, initializeLeadershipMedia, serveLeadershipMedia } from "@/lib/content/leadership-media";
import { ingestGeffen, initializeGeffen } from "@/lib/content/geffen-ingest";
import { serveGeffenAudio, serveGeffenIndex } from "@/lib/content/geffen-volume";

const environment = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

describe("the media bucket client", () => {
  it("signs requests exactly as AWS's published Signature Version 4 example", () => {
    // docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html, "GET Object".
    const config = mediaBucketConfiguration(environment({
      PAC_MEDIA_BUCKET_ENDPOINT: "https://s3.amazonaws.com", PAC_MEDIA_BUCKET_NAME: "examplebucket",
      PAC_MEDIA_BUCKET_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE", PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      PAC_MEDIA_BUCKET_REGION: "us-east-1",
    }))!;
    const { url, init } = signedBucketRequest(config, { method: "GET", key: "test.txt", headers: { range: "bytes=0-9" } }, new Date("2013-05-24T00:00:00Z"));
    expect(url).toBe("https://examplebucket.s3.amazonaws.com/test.txt");
    expect(init.headers.authorization).toBe("AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41");
  });

  it("needs every credential, a secure endpoint and a valid bucket name, and refuses unsafe keys", () => {
    const full = { PAC_MEDIA_BUCKET_ENDPOINT: "https://t3.storageapi.dev", PAC_MEDIA_BUCKET_NAME: "media-abc123", PAC_MEDIA_BUCKET_ACCESS_KEY_ID: "id", PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY: "secret" };
    expect(mediaBucketConfiguration(environment(full))).toMatchObject({ region: "auto", urlStyle: "virtual" });
    expect(mediaBucketConfiguration(environment({ ...full, PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY: "" }))).toBeUndefined();
    expect(mediaBucketConfiguration(environment({ ...full, PAC_MEDIA_BUCKET_ENDPOINT: "http://t3.storageapi.dev" }))).toBeUndefined();
    expect(mediaBucketConfiguration(environment({ ...full, PAC_MEDIA_BUCKET_NAME: "Bad_Name" }))).toBeUndefined();
    const config = mediaBucketConfiguration(environment(full))!;
    for (const key of ["../secret", "a//b", "/abs", "a/.hidden/../b"]) expect(() => signedBucketRequest(config, { method: "GET", key })).toThrow();
  });
});

describe("where public media is kept", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to the volume and accepts only the two known stores", () => {
    expect(publicMediaStore(environment({}))).toBe("volume");
    expect(publicMediaStore(environment({ PAC_PUBLIC_MEDIA_STORE: "Bucket" }))).toBe("bucket");
    expect(() => publicMediaStore(environment({ PAC_PUBLIC_MEDIA_STORE: "disk" }))).toThrow();
  });

  it("keeps publishing and serving off in the bucket store until the bucket is configured", () => {
    vi.stubEnv("PAC_PUBLIC_MEDIA_STORE", "bucket");
    vi.stubEnv("PAC_MEDIA_BUCKET_ENDPOINT", "");
    expect(configuredPublicMediaRoot("/app/.data/geffen-public", "/app/.data")).toBeUndefined();
    expect(readAloudMediaRoot()).toBeUndefined();
  });
});

// The bucket half runs only against a disposable S3-compatible test bucket, for example
// PAC_TEST_MEDIA_BUCKET_ENDPOINT=http://localhost:5055 PAC_TEST_MEDIA_BUCKET_NAME=media-test
// PAC_TEST_MEDIA_BUCKET_ACCESS_KEY_ID=... PAC_TEST_MEDIA_BUCKET_SECRET_ACCESS_KEY=... (path-style URLs).
const testBucket = process.env.PAC_TEST_MEDIA_BUCKET_ENDPOINT?.trim();

describe.skipIf(!testBucket)("public media in the bucket", () => {
  beforeEach(() => {
    vi.stubEnv("PAC_PUBLIC_MEDIA_STORE", "bucket");
    vi.stubEnv("PAC_MEDIA_BUCKET_ENDPOINT", testBucket ?? "");
    vi.stubEnv("PAC_MEDIA_BUCKET_NAME", process.env.PAC_TEST_MEDIA_BUCKET_NAME ?? "");
    vi.stubEnv("PAC_MEDIA_BUCKET_ACCESS_KEY_ID", process.env.PAC_TEST_MEDIA_BUCKET_ACCESS_KEY_ID ?? "");
    vi.stubEnv("PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY", process.env.PAC_TEST_MEDIA_BUCKET_SECRET_ACCESS_KEY ?? "");
    vi.stubEnv("PAC_MEDIA_BUCKET_REGION", "us-east-1");
    vi.stubEnv("PAC_MEDIA_BUCKET_URL_STYLE", "path");
  });
  afterEach(() => vi.unstubAllEnvs());

  const post = (body: Buffer | string) => new Request("http://local.test/", { method: "POST", body: typeof body === "string" ? body : new Uint8Array(body) });
  const get = (headers?: HeadersInit) => new Request("http://local.test/", { headers });
  const named = (bytes: Buffer, extension: string) => `${createHash("sha256").update(bytes).digest("hex")}${extension}`;
  const unique = `${Date.now()}`;

  it("publishes and serves course media, with byte ranges", async () => {
    const root = configuredPublicMediaRoot(undefined, undefined);
    expect(root).toBe(BUCKET_MEDIA_ROOT);
    expect((await initializeCourseMedia(root, undefined)).status).toBe(204);
    const video = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from(`ftypisom-course-${unique}`)]);
    const captions = Buffer.from(`WEBVTT\n\n00:00.000 --> 00:01.000\nHello ${unique}\n`);
    const transcript = Buffer.from(`Hello ${unique}`);
    const files = { media: named(video, ".mp4"), captions: named(captions, ".vtt"), transcript: named(transcript, ".txt") };
    const id = `bucket-test-${unique}`;
    const manifest = { format: "course-media-v1", id, title: "Bucket test", kind: "video", summary: "", pages: ["/courses/bucket-test"], ...files, durationSeconds: 1, chapters: [] };
    expect((await ingestCourseMedia(post(JSON.stringify(manifest)), `${id}.json`, root)).status).toBe(409); // files first
    for (const [bytes, name] of [[video, files.media], [captions, files.captions], [transcript, files.transcript]] as const) {
      expect((await ingestCourseMedia(post(bytes), name, root)).status).toBe(204);
      expect((await ingestCourseMedia(post(bytes), name, root)).status).toBe(204); // repeat is harmless
    }
    expect((await ingestCourseMedia(post(Buffer.from("not this")), files.media, root)).status).toBe(400);
    expect((await ingestCourseMedia(post(JSON.stringify(manifest)), `${id}.json`, root)).status).toBe(204);
    expect((await publishedCourseMedia(root, true)).map(item => item.id)).toContain(id);

    const ranged = await serveCourseMediaAsset(get({ range: "bytes=4-7" }), files.media, root);
    expect(ranged.status).toBe(206);
    expect(ranged.headers.get("content-range")).toBe(`bytes 4-7/${video.length}`);
    expect(Buffer.from(await ranged.arrayBuffer()).toString("ascii")).toBe("ftyp");
    expect(await (await serveCourseMediaAsset(get(), files.transcript, root)).text()).toBe(transcript.toString());
    expect((await serveCourseMediaAsset(get(), `${"f".repeat(64)}.mp4`, root)).status).toBe(404);
  });

  it("publishes and serves a leadership video manifest", async () => {
    const root = configuredPublicMediaRoot(undefined, undefined);
    expect((await initializeLeadershipMedia(root, undefined)).status).toBe(204);
    const video = Buffer.concat([Buffer.from([0, 0, 0, 16]), Buffer.from(`ftypisom${unique}`.slice(0, 12))]);
    const captions = Buffer.from(`WEBVTT\n\n00:00.000 --> 00:01.000\nLead ${unique}\n`);
    const transcript = Buffer.from(`Lead ${unique}`);
    const names = { video: named(video, ".mp4"), captions: named(captions, ".vtt"), transcript: named(transcript, ".txt") };
    for (const [bytes, name] of [[video, names.video], [captions, names.captions], [transcript, names.transcript]] as const) {
      expect((await ingestLeadershipMedia(post(bytes), name, root)).status).toBe(204);
    }
    expect((await ingestLeadershipMedia(post(JSON.stringify({ format: "leadership-video-v1", style: "servant", ...names })), "servant.json", root)).status).toBe(204);
    expect(await (await serveLeadershipMedia(get(), "servant.json", root)).json()).toMatchObject({ video: `/learning/leadership-videos/${names.video}` });
    expect(await (await serveLeadershipMedia(get(), names.transcript, root)).text()).toBe(transcript.toString());
  });

  it("publishes and serves read-aloud audio and its index", async () => {
    const root = readAloudMediaRoot();
    expect(root).toBe(BUCKET_MEDIA_ROOT);
    expect((await initializeGeffen(root, undefined)).status).toBe(204);
    const audio = Buffer.from(`ID3\x04\x00\x00read aloud ${unique}`);
    const name = named(audio, ".mp3");
    const course = `bucket-test-${unique}`;
    const index = { format: "geffen-course-read-aloud-v1", recordings: [{ id: `course/${course}/page/1/text`, voice: "geffen", verified: true, sourceTextHash: "b".repeat(64), audioSha256: name.slice(0, 64), src: `/audio/geffen-read-aloud/${name}` }] };
    expect((await ingestGeffen(post(JSON.stringify(index)), "courses", `${course}.json`, root)).status).toBe(409);
    expect((await ingestGeffen(post(audio), "audio", name, root)).status).toBe(204);
    expect((await ingestGeffen(post(JSON.stringify(index)), "courses", `${course}.json`, root)).status).toBe(204);
    expect(await (await serveGeffenIndex(get(), `${course}.json`)).json()).toEqual(index);
    const ranged = await serveGeffenAudio(get({ range: "bytes=0-2" }), [name]);
    expect(ranged.status).toBe(206);
    expect(Buffer.from(await ranged.arrayBuffer()).toString("ascii")).toBe("ID3");
    expect((await serveGeffenIndex(get(), "missing-course.json")).status).toBe(204);
  });
});

import { afterEach, expect, it, vi } from "vitest";
import { listMediaSizes, mediaBucketConfiguration } from "./media-bucket";

const config = mediaBucketConfiguration({
  PAC_MEDIA_BUCKET_ENDPOINT: "https://t3.storageapi.dev", PAC_MEDIA_BUCKET_NAME: "media-abc123",
  PAC_MEDIA_BUCKET_ACCESS_KEY_ID: "id", PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY: "secret",
} as unknown as NodeJS.ProcessEnv)!;
const page = (items: [string, number][], next?: string) => `<ListBucketResult>${items.map(([key, size]) => `<Contents><Key>${key}</Key><LastModified>2026-11-27T00:00:00Z</LastModified><Size>${size}</Size></Contents>`).join("")}<IsTruncated>${next ? "true" : "false"}</IsTruncated>${next ? `<NextContinuationToken>${next}</NextContinuationToken>` : ""}</ListBucketResult>`;

afterEach(() => vi.unstubAllGlobals());

it("reads names and sizes across pages, ignoring nested keys", async () => {
  const bodies = [page([["p/a.mp4", 10], ["p/sub/x.txt", 3]], "t&amp;2"), page([["p/b.vtt", 0]])];
  const urls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => { urls.push(String(url)); return new Response(bodies.shift()); }));
  const sizes = await listMediaSizes(config, "p/");
  expect([...sizes!]).toEqual([["a.mp4", 10], ["b.vtt", 0]]);
  expect(urls[1]).toContain("continuation-token=t%262");
});

it("returns null rather than a partial listing, and throws on a refused request", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(page([["p/a.mp4", 1]], "more"))));
  expect(await listMediaSizes(config, "p/", 2)).toBeNull();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 403 })));
  await expect(listMediaSizes(config, "p/")).rejects.toThrow();
});

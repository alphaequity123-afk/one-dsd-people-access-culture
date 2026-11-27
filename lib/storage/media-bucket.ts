import "server-only";
import { createHash, createHmac } from "node:crypto";

/**
 * A small S3 client for the service's private media bucket (a Railway Storage Bucket, which speaks
 * the S3 API). It signs requests with AWS Signature Version 4 and uses fetch, so the app needs no
 * SDK. Nothing is public: the app reads objects and serves them itself, as it served volume files.
 *
 * Settings, normally set as Railway variable references to the bucket's own credentials:
 * PAC_MEDIA_BUCKET_ENDPOINT, PAC_MEDIA_BUCKET_NAME, PAC_MEDIA_BUCKET_ACCESS_KEY_ID,
 * PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY, and optionally PAC_MEDIA_BUCKET_REGION (default "auto") and
 * PAC_MEDIA_BUCKET_URL_STYLE ("virtual", Railway's style and the default, or "path").
 */
export type MediaBucketConfiguration = {
  endpoint: URL; bucket: string; accessKeyId: string; secretAccessKey: string; region: string; urlStyle: "virtual" | "path";
};

export function mediaBucketConfiguration(environment: NodeJS.ProcessEnv = process.env): MediaBucketConfiguration | undefined {
  const endpoint = environment.PAC_MEDIA_BUCKET_ENDPOINT?.trim();
  const bucket = environment.PAC_MEDIA_BUCKET_NAME?.trim();
  const accessKeyId = environment.PAC_MEDIA_BUCKET_ACCESS_KEY_ID?.trim();
  const secretAccessKey = environment.PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY?.trim();
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return undefined;
  let url: URL;
  try { url = new URL(endpoint); } catch { return undefined; }
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.search || url.hash) return undefined;
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) return undefined;
  const style = environment.PAC_MEDIA_BUCKET_URL_STYLE?.trim().toLowerCase();
  return {
    endpoint: url, bucket, accessKeyId, secretAccessKey,
    region: environment.PAC_MEDIA_BUCKET_REGION?.trim() || "auto",
    urlStyle: style === "path" ? "path" : "virtual",
  };
}

/** Keys are built from checked path segments only; anything else is refused before a request. */
export const MEDIA_KEY = /^(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const hmac = (key: Buffer | string, value: string) => createHmac("sha256", key).update(value).digest();
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

function target(config: MediaBucketConfiguration, key: string | null) {
  const base = config.endpoint.pathname.replace(/\/+$/, "");
  const objectPath = key === null ? "" : key.split("/").map(encode).join("/");
  if (config.urlStyle === "virtual") {
    const host = `${config.bucket}.${config.endpoint.host}`;
    return { origin: `${config.endpoint.protocol}//${host}`, host, path: `${base}/${objectPath}` };
  }
  return { origin: `${config.endpoint.protocol}//${config.endpoint.host}`, host: config.endpoint.host, path: `${base}/${encode(config.bucket)}/${objectPath}` };
}

type SignedRequest = { method: "GET" | "HEAD" | "PUT"; key: string | null; query?: Record<string, string>; headers?: Record<string, string>; body?: Uint8Array };

export function signedBucketRequest(config: MediaBucketConfiguration, request: SignedRequest, now = new Date()) {
  if (request.key !== null && !MEDIA_KEY.test(request.key)) throw new Error("Invalid media key");
  const { origin, host, path } = target(config, request.key);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = stamp.slice(0, 8);
  const payload = sha256(request.body ?? new Uint8Array());
  const query = Object.entries(request.query ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => `${encode(name)}=${encode(value)}`).join("&");
  const headers: Record<string, string> = {
    ...Object.fromEntries(Object.entries(request.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value.trim()])),
    host, "x-amz-content-sha256": payload, "x-amz-date": stamp,
  };
  const names = Object.keys(headers).sort();
  const canonical = [request.method, path, query, names.map(name => `${name}:${headers[name]}\n`).join(""), names.join(";"), payload].join("\n");
  const scope = `${day}/${config.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", stamp, scope, sha256(canonical)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, day), config.region), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(toSign).digest("hex");
  delete headers.host;
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`;
  return { url: `${origin}${path}${query ? `?${query}` : ""}`, init: { method: request.method, headers, body: request.body, redirect: "error" as const, cache: "no-store" as const } };
}

async function send(config: MediaBucketConfiguration, request: SignedRequest, timeoutMs = 30_000) {
  const { url, init } = signedBucketRequest(config, request);
  return fetch(url, { ...init, body: init.body ? Buffer.from(init.body) : undefined, signal: AbortSignal.timeout(timeoutMs) });
}

export class MediaBucketError extends Error {
  constructor(readonly status: number) {
    super(`The media bucket answered ${status}.`);
    this.name = "MediaBucketError";
  }
}

/** Size of an object, or null when it does not exist. */
export async function headMediaObject(config: MediaBucketConfiguration, key: string): Promise<number | null> {
  const response = await send(config, { method: "HEAD", key });
  if (response.status === 404) return null;
  if (!response.ok) throw new MediaBucketError(response.status);
  const size = Number(response.headers.get("content-length"));
  return Number.isSafeInteger(size) && size >= 0 ? size : null;
}

/** An object's bytes, or one inclusive byte range of them. Null when it does not exist. */
export async function getMediaObject(config: MediaBucketConfiguration, key: string, range?: [number, number]): Promise<Response | null> {
  const response = await send(config, { method: "GET", key, headers: range ? { range: `bytes=${range[0]}-${range[1]}` } : undefined }, 120_000);
  if (response.status === 404) { await response.body?.cancel(); return null; }
  if (!response.ok) { await response.body?.cancel(); throw new MediaBucketError(response.status); }
  return response;
}

/** Write an object. With `onlyIfAbsent`, an existing object is left as it is and false is returned. */
export async function putMediaObject(config: MediaBucketConfiguration, key: string, bytes: Uint8Array, contentType: string, onlyIfAbsent: boolean): Promise<boolean> {
  const response = await send(config, {
    method: "PUT", key, body: bytes,
    headers: { "content-type": contentType, ...(onlyIfAbsent ? { "if-none-match": "*" } : {}) },
  }, 120_000);
  await response.body?.cancel();
  if (response.status === 412 || response.status === 409) return false;
  if (!response.ok) throw new MediaBucketError(response.status);
  return true;
}

/** Object names directly under a prefix ("a/b/" lists "a/b/x" as "x"), at most `limit` of them. */
export async function listMediaNames(config: MediaBucketConfiguration, prefix: string, limit = 1000): Promise<string[]> {
  if (prefix && !MEDIA_KEY.test(prefix.replace(/\/$/, ""))) throw new Error("Invalid media prefix");
  const names: string[] = [];
  let token: string | undefined;
  do {
    const response = await send(config, {
      method: "GET", key: null,
      query: { "list-type": "2", prefix, delimiter: "/", "max-keys": "1000", ...(token ? { "continuation-token": token } : {}) },
    });
    if (!response.ok) { await response.body?.cancel(); throw new MediaBucketError(response.status); }
    const xml = await response.text();
    for (const match of xml.matchAll(/<Contents>[\s\S]*?<Key>([^<]+)<\/Key>[\s\S]*?<\/Contents>/g)) {
      const key = unescapeXml(match[1]);
      if (key.startsWith(prefix) && !key.slice(prefix.length).includes("/")) names.push(key.slice(prefix.length));
      if (names.length >= limit) return names;
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? unescapeXml(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)?.[1] ?? "") || undefined : undefined;
  } while (token);
  return names;
}

/**
 * Object names and sizes directly under a prefix, read with one list request per thousand objects.
 * Returns null instead of a partial answer when the listing is longer than `maxPages` pages, so a
 * caller never mistakes an unlisted object for a missing one.
 */
export async function listMediaSizes(config: MediaBucketConfiguration, prefix: string, maxPages = 20): Promise<Map<string, number> | null> {
  if (prefix && !MEDIA_KEY.test(prefix.replace(/\/$/, ""))) throw new Error("Invalid media prefix");
  const sizes = new Map<string, number>();
  let token: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const response = await send(config, {
      method: "GET", key: null,
      query: { "list-type": "2", prefix, delimiter: "/", "max-keys": "1000", ...(token ? { "continuation-token": token } : {}) },
    });
    if (!response.ok) { await response.body?.cancel(); throw new MediaBucketError(response.status); }
    const xml = await response.text();
    for (const match of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = unescapeXml(/<Key>([^<]+)<\/Key>/.exec(match[1])?.[1] ?? "");
      const size = Number(/<Size>(\d+)<\/Size>/.exec(match[1])?.[1]);
      if (key.startsWith(prefix) && !key.slice(prefix.length).includes("/") && Number.isSafeInteger(size)) sizes.set(key.slice(prefix.length), size);
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? unescapeXml(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)?.[1] ?? "") || undefined : undefined;
    if (!token) return sizes;
  }
  return null;
}

function unescapeXml(value: string) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

// Plain-Node twin of lib/storage/media-bucket.ts for scripts that run outside the app build.
// Same settings, same Signature Version 4 signing, same key rules.
import { createHash, createHmac } from "node:crypto";

export const MEDIA_KEY = /^(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

export function mediaBucketConfiguration(environment = process.env) {
  const endpoint = environment.PAC_MEDIA_BUCKET_ENDPOINT?.trim();
  const bucket = environment.PAC_MEDIA_BUCKET_NAME?.trim();
  const accessKeyId = environment.PAC_MEDIA_BUCKET_ACCESS_KEY_ID?.trim();
  const secretAccessKey = environment.PAC_MEDIA_BUCKET_SECRET_ACCESS_KEY?.trim();
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return undefined;
  let url;
  try { url = new URL(endpoint); } catch { return undefined; }
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.search || url.hash) return undefined;
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) return undefined;
  const style = environment.PAC_MEDIA_BUCKET_URL_STYLE?.trim().toLowerCase();
  return { endpoint: url, bucket, accessKeyId, secretAccessKey, region: environment.PAC_MEDIA_BUCKET_REGION?.trim() || "auto", urlStyle: style === "path" ? "path" : "virtual" };
}

const sha256 = value => createHash("sha256").update(value).digest("hex");
const hmac = (key, value) => createHmac("sha256", key).update(value).digest();
const encode = value => encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export function signedBucketRequest(config, request, now = new Date()) {
  if (request.key !== null && !MEDIA_KEY.test(request.key)) throw new Error("Invalid media key");
  const base = config.endpoint.pathname.replace(/\/+$/, "");
  const objectPath = request.key === null ? "" : request.key.split("/").map(encode).join("/");
  const virtual = config.urlStyle === "virtual";
  const host = virtual ? `${config.bucket}.${config.endpoint.host}` : config.endpoint.host;
  const path = virtual ? `${base}/${objectPath}` : `${base}/${encode(config.bucket)}/${objectPath}`;
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = stamp.slice(0, 8);
  const payload = sha256(request.body ?? new Uint8Array());
  const query = Object.entries(request.query ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([n, v]) => `${encode(n)}=${encode(v)}`).join("&");
  const headers = { ...Object.fromEntries(Object.entries(request.headers ?? {}).map(([n, v]) => [n.toLowerCase(), String(v).trim()])), host, "x-amz-content-sha256": payload, "x-amz-date": stamp };
  const names = Object.keys(headers).sort();
  const canonical = [request.method, path, query, names.map(n => `${n}:${headers[n]}\n`).join(""), names.join(";"), payload].join("\n");
  const scope = `${day}/${config.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", stamp, scope, sha256(canonical)].join("\n");
  const key = hmac(hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, day), config.region), "s3"), "aws4_request");
  delete headers.host;
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${createHmac("sha256", key).update(toSign).digest("hex")}`;
  return { url: `${config.endpoint.protocol}//${host}${path}${query ? `?${query}` : ""}`, init: { method: request.method, headers, body: request.body, redirect: "error", cache: "no-store" } };
}

async function send(config, request, timeoutMs = 120_000) {
  const { url, init } = signedBucketRequest(config, request);
  return fetch(url, { ...init, body: init.body ? Buffer.from(init.body) : undefined, signal: AbortSignal.timeout(timeoutMs) });
}

/** { size, etag } or null when absent. */
export async function headObject(config, key) {
  const response = await send(config, { method: "HEAD", key });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`The media bucket answered ${response.status}.`);
  return {
    size: Number(response.headers.get("content-length")),
    etag: (response.headers.get("etag") ?? "").replace(/"/g, ""),
    sha256: response.headers.get("x-amz-meta-sha256") ?? "",
  };
}

/** Write an object, recording its SHA-256 as metadata so a later check does not depend on how the store forms ETags. */
export async function putObject(config, key, bytes, contentType) {
  const response = await send(config, { method: "PUT", key, body: bytes, headers: { "content-type": contentType, "x-amz-meta-sha256": createHash("sha256").update(bytes).digest("hex") } });
  await response.body?.cancel();
  if (!response.ok) throw new Error(`The media bucket answered ${response.status}.`);
}

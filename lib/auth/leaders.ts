/**
 * Leaders access for the equity baseline dashboard (DSD managers, supervisors and the
 * consultant; not general staff). Same posture as the owner key: a server-side shared key
 * (PAC_LEADERS_KEY) exchanged for a signed httpOnly cookie. A live consultant (owner) session
 * also grants access. In production without a key, the dashboard is locked.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ownerKey, ownerKeyIsDevDefault } from "./owner";

export const LEADERS_COOKIE = "pac_leaders";
export const LEADERS_SESSION_SECONDS = 60 * 60 * 12;
const DEV_DEFAULT_KEY = "local-dev-leaders";
const VERSION = "v1";
const CONTEXT = "pac-leaders-session-v1";

type Payload = { iat: number; exp: number; sid: string; aud: "equity-baseline" };

/** The shared key. PAC_LEADERS_KEY when set; otherwise derived from the consultant (owner)
 * key, so the consultant can read it in the workspace and hand it to managers without a
 * second secret being configured. */
export function leadersKey(): string | null {
  const k = process.env.PAC_LEADERS_KEY?.trim();
  if (k) return process.env.NODE_ENV === "production" && Buffer.byteLength(k, "utf8") < 32 ? null : k;
  const owner = ownerKey();
  if (owner && !ownerKeyIsDevDefault()) return createHmac("sha256", owner).update("pac-leaders-shared-key-v1").digest("base64url").slice(0, 40);
  return process.env.NODE_ENV === "development" ? DEV_DEFAULT_KEY : null;
}
export function leadersConfigured(): boolean { return leadersKey() !== null; }
export function leadersKeyIsDevDefault(): boolean { return !process.env.PAC_LEADERS_KEY?.trim() && ownerKeyIsDevDefault(); }

function sign(key: string, encoded: string): Buffer { return createHmac("sha256", key).update(`${CONTEXT}.${encoded}`).digest(); }

export function verifyLeadersKey(candidate: string): boolean {
  const key = leadersKey();
  if (!key || !candidate) return false;
  const a = Buffer.from(candidate), b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function issueLeadersCookieValue(now = Date.now()): string | null {
  const key = leadersKey();
  if (!key) return null;
  const iat = Math.floor(now / 1000);
  const payload: Payload = { iat, exp: iat + LEADERS_SESSION_SECONDS, sid: randomBytes(24).toString("base64url"), aud: "equity-baseline" };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${VERSION}.${encoded}.${sign(key, encoded).toString("base64url")}`;
}

export function isLeadersSession(cookieValue: string | undefined, now = Date.now()): boolean {
  const key = leadersKey();
  if (!key || !cookieValue) return false;
  const [version, encoded = "", signature = ""] = cookieValue.split(".");
  if (version !== VERSION || !/^[A-Za-z0-9_-]+$/.test(encoded) || encoded.length > 512) return false;
  const expected = sign(key, encoded);
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "base64url"); } catch { return false; }
  if (supplied.length !== expected.length || supplied.toString("base64url") !== signature || !timingSafeEqual(supplied, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<Payload>;
    const { iat, exp } = payload;
    if (payload.aud !== "equity-baseline" || typeof iat !== "number" || typeof exp !== "number" || !Number.isSafeInteger(iat) || !Number.isSafeInteger(exp)) return false;
    if (exp - iat !== LEADERS_SESSION_SECONDS) return false;
    const t = Math.floor(now / 1000);
    return iat <= t && t < exp;
  } catch { return false; }
}

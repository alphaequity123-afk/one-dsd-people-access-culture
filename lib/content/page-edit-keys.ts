/**
 * Shared rules for the owner's page edits. Pure code with no server or browser dependency,
 * so the page overlay and the saving route agree on what an edit is keyed by and what is allowed.
 */
export const PAGE_EDIT_LIMITS = {
  text: 20_000,
  href: 2_048,
  path: 512,
  entriesPerPage: 2_000,
  occurrence: 100_000,
  requestBytes: 96 * 1024,
  storeBytes: 8 * 1024 * 1024,
  backups: 40,
  log: 500,
} as const;

/** The store's pseudo-path for edits to header and footer wording that apply on every page. */
export const SITE_WIDE_PATH = "*";

export type PageEditKind = "text" | "link";

const UNSAFE_PATH_CHARACTER = /[\s\u0000-\u001f\u007f?#\\<>"`]/;

/**
 * The page a reader is on, without query or fragment. Returns null for anything that is not a
 * page: other sites, API routes, build assets, and path traversal.
 */
export function normalizePagePath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > PAGE_EDIT_LIMITS.path) return null;
  if (UNSAFE_PATH_CHARACTER.test(value) || value.includes("//")) return null;
  const trimmed = value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
  const segments = trimmed.split("/");
  if (segments.includes(".") || segments.includes("..")) return null;
  if (segments[1] === "api" || segments[1] === "_next") return null;
  return trimmed;
}

/**
 * Page edits can include text selected from a rendered page, including private workspace data.
 * Only explicitly reviewed public content surfaces may publish page edits to anonymous readers.
 * New and unrecognized routes are private until they are deliberately added here.
 */
const PUBLIC_EDIT_PAGES = new Set([
  "/", "/home", "/about", "/administrations", "/administrations/adsa/divisions/dsd",
  "/areas", "/audio-library", "/courses", "/domains",
  "/employee-resource-groups", "/equity-framework", "/equity-policy", "/equity-review",
  "/guided-start", "/learn", "/learn/clas", "/learn/clas/curriculum", "/learn/collaboration",
  "/learn/community-connections", "/learn/cultural-intelligence", "/learn/diversity",
  "/learn/emotions-and-values", "/learn/engagement-resources", "/learn/equity-in-practice",
  "/learn/equity-toolkit", "/learn/equity-toolkit/curriculum", "/learn/intercultural",
  "/learn/intercultural/curriculum", "/learn/readings", "/learn/readings/pathways",
  "/learn/self-directed", "/learn/sources", "/learn/tribal-referral", "/learn/water-we-swim-in",
  "/learn/water-we-swim-in/essay", "/learn/collections", "/leading", "/leading/how-this-works", "/leading/journey",
  "/leading/paths", "/library", "/minnesota-communities", "/minnesota-communities/calendar",
  "/one-dsd", "/one-dsd/amplify", "/one-dsd/amplify/co-leads", "/one-dsd/amplify/gatherings",
  "/one-dsd/amplify/ideas", "/one-dsd/amplify/materials", "/one-dsd/amplify/mentoring",
  "/one-dsd/amplify/well-being", "/one-dsd/evidence", "/one-dsd/evidence/dhs-landscape",
  "/one-dsd/evidence/minnesota-government", "/one-dsd/leadership", "/one-dsd/planning", "/one-dsd/programs",
  "/one-dsd/team", "/operationalizing-equity", "/paths", "/practice", "/practice/clas",
  "/practice/measurement", "/practice/requirements", "/program-foundation",
  "/program/implementation", "/program/model",
  "/resources", "/site-map", "/start", "/support", "/support/directory", "/support/right-person",
  "/understanding-dhs", "/user-guide",
]);

const PUBLIC_EDIT_PATTERNS = [
  /^\/(?:courses|library|resources)\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/,
  /^\/(?:administrations|areas|podcasts|practice-guides)\/[a-z0-9-]+$/,
  /^\/leading\/(?:paths\/)?[a-z0-9-]+$/,
  /^\/learn\/collections\/[a-z0-9-]+$/,
  /^\/learn\/readings\/[a-z0-9-]+$/,
  /^\/learn\/(?:clas|intercultural|equity-toolkit)\/curriculum\/[a-z0-9-]+$/,
  /^\/minnesota-communities\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/,
  /^\/learn\/water-we-swim-in\/essay\/[a-z0-9-]+$/,
  /^\/one-dsd\/(?:programs|scenarios)\/[a-z0-9-]+$/,
  /^\/program\/(?:what-informs|practice|resources|progress|impact)$/,
];

/** Returns true for private, personal, unrecognized, or ambiguously encoded pages. */
export function pagePathIsOwnerOnly(path: string): boolean {
  if (normalizePagePath(path) !== path || path.includes("%")) return true;
  return !PUBLIC_EDIT_PAGES.has(path) && !PUBLIC_EDIT_PATTERNS.some(pattern => pattern.test(path));
}

/** The form of a text used for matching: spacing differences from markup never break an edit. */
export function comparableText(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** cyrb53: fast, stable and synchronous. It identifies wording; it protects nothing. */
function hashString(text: string): string {
  let first = 0xdeadbeef;
  let second = 0x41c6ce57;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    first = Math.imul(first ^ code, 2654435761);
    second = Math.imul(second ^ code, 1597334677);
  }
  first = Math.imul(first ^ (first >>> 16), 2246822507) ^ Math.imul(second ^ (second >>> 13), 3266489909);
  second = Math.imul(second ^ (second >>> 16), 2246822507) ^ Math.imul(first ^ (first >>> 13), 3266489909);
  return (4294967296 * (2097151 & second) + (first >>> 0)).toString(36);
}

/** Key for one edit: kind, hash and length of the original, and which repeat of it on the page. */
export function pageEditKey(kind: PageEditKind, original: string, occurrence: number): string {
  const subject = kind === "text" ? comparableText(original) : original.trim();
  return `${kind === "text" ? "t" : "l"}:${hashString(subject)}-${subject.length.toString(36)}:${occurrence}`;
}

const EDIT_KEY_PATTERN = /^[tl]:[a-z0-9]{1,16}-[a-z0-9]{1,8}:\d{1,6}$/;

export function isPageEditKey(value: unknown): value is string {
  return typeof value === "string" && EDIT_KEY_PATTERN.test(value);
}

// The courses contract's sourceLink rule (local path, anchor, or https), without the empty
// value: a link address cannot be blanked, only changed or undone.
const SOURCE_LINK = /^(?:\/(?!\/)|#[a-zA-Z0-9_-]|https:\/\/)/;

/**
 * Stricter than the rule it mirrors in one way: a backslash, space or control character is
 * refused, because browsers read "/\example.org" as another site.
 */
export function linkAddressIsAllowed(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > PAGE_EDIT_LIMITS.href) return false;
  if (/[\s\u0000-\u001f\u007f\\]/.test(value)) return false;
  if (value === "#") return true;
  if (!SOURCE_LINK.test(value)) return false;
  if (!value.startsWith("https://")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

/**
 * Replacement wording is plain text and stays exactly that: markup is kept as the literal
 * characters the owner typed and is only ever written to a text node, never parsed as HTML.
 */
export function cleanReplacementText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.normalize("NFC").replace(/\r\n?/g, "\n").trim();
  if (!cleaned || cleaned.length > PAGE_EDIT_LIMITS.text) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(cleaned)) return null;
  return cleaned;
}

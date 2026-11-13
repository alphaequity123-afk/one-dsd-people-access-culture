/** Source-address validation is separate from whether a source supports a claim. */
export type GeneratedSourceLinkViolation = {
  path: string;
  url: string;
  reason: "not_supplied" | "unsafe_or_invalid";
};
type LinkOptions = { origin?: string; maxViolations?: number };
const UNIT_PATH = /^(?:s|sec|second|seconds|min|minute|minutes|h|hr|hour|hours|day|days|week|weeks|month|months|year|years|m|cm|mm|km|g|kg|mg|l|ml|mol)$/i;

function canonical(value: string, origin: string): string | undefined {
  try {
    // Backslashes, credentials and non-web schemes cannot acquire trust through URL normalization.
    if (/\\|[\u0000-\u0020\u007f]/.test(value)) return undefined;
    const url = new URL(/^www\./i.test(value) ? `https://${value}` : value, origin);
    if (!/^(?:https?:\/\/|\/|#|www\.)/i.test(value) || !["https:", "http:"].includes(url.protocol) || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}

function withoutSentencePunctuation(value: string): string {
  let clean = value.replace(/[.,;:!?]+$/g, "");
  for (const [open, close] of [["(", ")"], ["[", "]"], ["{", "}"]]) {
    while (clean.endsWith(close) && clean.split(close).length > clean.split(open).length) clean = clean.slice(0, -1);
  }
  return clean.replace(/[.,;:!?]+$/g, "");
}

function addressCandidates(value: string): string[] {
  const variants = [value];
  let current = value;
  while (current) {
    const last = current.at(-1)!;
    const pair = [["(", ")"], ["[", "]"], ["{", "}"]].find(([, close]) => close === last);
    if (!/[.,;:!?]/.test(last) && !(pair && current.split(pair[1]).length > current.split(pair[0]).length)) break;
    current = current.slice(0, -1);
    variants.push(current);
  }
  return variants;
}

function linksInText(text: string): string[] {
  const links = new Set<string>();
  const absoluteRanges: Array<[number, number]> = [];
  // Include URLs anywhere: narrative, copied citation paragraphs, table cells and formulas treated as text.
  for (const match of text.matchAll(/(?:(?:https?|ftp|file):\/\/|www\.)[^\s<>"'`]+/gi)) {
    links.add(match[0]);
    absoluteRanges.push([match.index!, match.index! + match[0].length]);
  }
  // A model may write a citation as plain /learn/example text, including in a Word paragraph.
  // A root path starts with a letter; ratios, ordinary word/word notation and HTML end tags do not.
  for (const match of text.matchAll(/(?<![\w:/@.<\]-])\/[a-z][a-z0-9_-]*(?:[/?#][^\s<>"'`]*)?/gi)) {
    // A path inside a URL query is not a second, independently supplied address.
    if (absoluteRanges.some(([start, end]) => match.index! >= start && match.index! < end)) continue;
    const value = withoutSentencePunctuation(match[0]);
    const parts = value.slice(1).split("/");
    if (!parts.every(part => UNIT_PATH.test(part))) links.add(match[0]);
  }
  // A missing protocol must not hide an invented citation address. Avoid email addresses.
  for (const match of text.matchAll(/(?<![\w@/.-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:gov|org|com|net|edu|us|uk|ca|int|io|ai)\b(?:[/?#][^\s<>"'`]*)?/gi)) {
    if (absoluteRanges.some(([start, end]) => match.index! >= start && match.index! < end)) continue;
    const value = match[0];
    if (![...links].some(existing => existing.includes(value))) links.add(`https://${value}`);
  }
  // Relative links and unsafe schemes can appear inside Markdown even without a raw absolute URL.
  for (const match of text.matchAll(/\]\(\s*/g)) {
    const start = match.index! + match[0].length;
    if (text[start] === "<") {
      const end = text.indexOf(">", start + 1);
      if (end !== -1) links.add(text.slice(start + 1, end));
      continue;
    }
    let end = start, depth = 0;
    for (; end < text.length && !/\s/.test(text[end]); end++) {
      if (text[end] === ")" && depth === 0) break;
      if (text[end] === "(") depth++;
      else if (text[end] === ")") depth--;
    }
    links.add(text.slice(start, end));
  }
  for (const match of text.matchAll(/^\s{0,3}\[[^\]\n]+\]:\s*(?:<([^>\n]+)>|(\S+))/gm)) links.add(match[1] ?? match[2]);
  for (const match of text.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) links.add(match[1]);
  return [...links].filter(Boolean);
}

function publicInputUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || /\\/.test(value)) return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    if (host === "localhost" || /\.(?:localhost|local|internal|lan|home|corp|onion|invalid|test|example)$/.test(host)) return false;
    const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipv4) {
      const [a, b, c] = ipv4.slice(1).map(Number);
      if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
        (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113)) return false;
    } else if (host.includes(":")) {
      const first = Number.parseInt(host.split(":", 1)[0] || "0", 16);
      if (host.startsWith("::") || (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 ||
        (first & 0xffc0) === 0xfec0 || (first & 0xff00) === 0xff00 || /^2001:0?db8(?::|$)/i.test(host)) return false;
    } else if (!host.includes(".")) return false;
    const secret = /(?:token|apikey|password|passwd|secret|signature|credential|authorization|session)|^(?:key|pwd|sig|auth|code)$/i;
    const queryKeys = [...url.searchParams.keys(), ...new URLSearchParams(url.hash.slice(1)).keys()];
    return !queryKeys.some(key => secret.test(key.replace(/[-_]/g, "")));
  } catch { return false; }
}

/**
 * An address literally supplied for a task may be reproduced as output data. This does
 * not add evidence, fetch it, verify its contents, or permit invented sibling paths.
 */
export function explicitInputLinks(question: string): string[] {
  return [...new Set(linksInText(question).flatMap(addressCandidates).flatMap(value => {
    if (/^https?:\/\//i.test(value) && publicInputUrl(value)) return [value];
    if (/^\/[a-z]/i.test(value) && !/\\|[\u0000-\u0020\u007f]/.test(value)) {
      // Use the same query screening for a relative task destination.
      if (publicInputUrl(`https://example.com${value}`)) return [value];
    }
    return [];
  }))].slice(0, 32);
}

/**
 * Walk the exact generated draft, including all nested working-draft fields. Trust is
 * address-specific: a supplied domain does not authorize invented paths or fragments.
 * The caller must pass only independently supplied addresses, never generated ones.
 */
export function inspectGeneratedSourceLinks(value: unknown, allowedHrefs: readonly string[], options: LinkOptions = {}) {
  const origin = options.origin ?? "https://ask.internal.invalid";
  const allowed = new Set(allowedHrefs.flatMap(href => {
    const resolved = canonical(href, origin);
    return resolved ? [resolved] : [];
  }));
  const violations: GeneratedSourceLinkViolation[] = [];
  const seen = new Set<object>();
  const maxViolations = Math.max(1, Math.min(options.maxViolations ?? 16, 64));
  const inspect = (raw: string, path: string) => {
    // Try the literal address first, so valid punctuation within a supplied URL survives.
    const candidates = addressCandidates(raw).map(candidate => canonical(candidate, origin)).filter((candidate): candidate is string => Boolean(candidate));
    if (candidates.some(candidate => allowed.has(candidate))) return;
    const reported = withoutSentencePunctuation(raw).slice(0, 2000);
    if (violations.length < maxViolations && !violations.some(v => v.path === path && v.url === reported)) {
      violations.push({ path, url: reported, reason: candidates.length ? "not_supplied" : "unsafe_or_invalid" });
    }
  };
  const walk = (node: unknown, path: string, linkField = false): void => {
    if (typeof node === "string") {
      if (linkField) inspect(node, path);
      else for (const url of linksInText(node)) inspect(url, path);
    } else if (node && typeof node === "object" && !seen.has(node)) {
      seen.add(node);
      if (Array.isArray(node)) node.forEach((child, i) => walk(child, `${path}[${i}]`, linkField));
      else Object.entries(node).forEach(([key, child]) => walk(child, `${path}.${key}`, /^(?:href|url|resourceHrefs)$/i.test(key)));
    }
  };
  walk(value, "draft");
  return { ok: violations.length === 0, violations };
}

/**
 * Internal links written in content and components, and whether each resolves to a route, a redirect, a public
 * file or (for dynamic routes) a content slug that exists.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, lineOf, rel, source } from "./imports.ts";
import { PLACEHOLDER, contentSlugs, isOwnerRoute, matchRoutes, publicFileExists, redirects, routeInventory, type Redirect, type Route } from "./routes.ts";

export type Link = { file: string; line: number; href: string; path: string; templated: boolean };

const KEY = String.raw`(?:href|to|link|url|path|destination|route|next|returnTo|backHref|moreHref|ctaHref|primaryHref|secondaryHref|[a-z]\w*Href|[a-z]\w*Url|[a-z]\w*Path|[a-z]\w*Link)`;
const PATTERNS: RegExp[] = [
  // JSX: href="/x", href={"/x"}, href={`/x/${id}`}
  /\bhref=\{?\s*(["'`])(\/(?!\/)[^"'`\s]*)\1/g,
  // Object keys in TS/TSX/JSON: href: "/x", "href": "/x"
  new RegExp(String.raw`["']?\b${KEY}["']?\s*:\s*(["'\`])(\/(?!\/)[^"'\`\s]*)\1`, "g"),
  // Navigation calls.
  /\b(?:redirect|permanentRedirect|router\.(?:push|replace)|notFound)\(\s*(["'`])(\/(?!\/)[^"'`\s]*)\1/g,
  // Helpers that build an address: return `/x/${id}`, (id) => `/x/${id}`, const COURSE_HREF = "/x".
  /(?:\breturn|=>)\s*\(?\s*(["'`])(\/[a-z][^"'`\s]*)\1/g,
  /\bconst\s+\w*(?:HREF|Href|href|URL|Url|PATH|Path|ROUTE|Route)\w*\s*(?::\s*\w+\s*)?=\s*(["'`])(\/[a-z][^"'`\s]*)\1/g,
  // Markdown and HTML links inside content strings.
  /\]\((\s*)(\/(?!\/)[^)\s"']*)\)/g,
  /href=\\?(["'])(\/(?!\/)[^"'\\\s]*)\\?\1/g,
];

function walk(dir: string, test: (file: string) => boolean, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, test, out);
    else { const r = rel(full); if (test(r) && statSync(full).size < 25_000_000) out.push(r); }
  }
  return out;
}

const isTest = (file: string) => /\.test\.|\.vitest\.config\.|__fixtures__|\/testing\//.test(file);

/** Files that carry staff-visible links: pages and components outside owner screens, program data, published HTML. */
export function linkSourceFiles(): string[] {
  return [
    ...walk(join(ROOT, "app"), f => /\.(?:tsx?|json)$/.test(f) && !isTest(f) && !/^app\/(?:consultant|api)\//.test(f)),
    ...walk(join(ROOT, "components"), f => /\.(?:tsx?|json)$/.test(f) && !isTest(f) && !/consultant|owner|-editor\.tsx$/.test(f)),
    ...walk(join(ROOT, "lib"), f => /\.(?:tsx?|json)$/.test(f) && !isTest(f) && !/^lib\/(?:intelligence|db|auth|security|trust)\//.test(f) && !/-revisions\.json$|historical-course-editorial\.json$/.test(f)),
    ...walk(join(ROOT, "public"), f => /\.html$/.test(f)),
  ].sort();
}

/** Normalize an href to a path: no query, no fragment, placeholders for template parts. */
export function linkPath(href: string): { path: string; templated: boolean } {
  // "${...}" parts and route patterns written as text ("/practice/[id]") stand for any value.
  const templated = /\$\{|\/\[[^\]/]+\]/.test(href);
  let path = href.replace(/\$\{[^}]*\}/g, PLACEHOLDER).replace(/\/\[{1,2}(?:\.\.\.)?[^\]/]+\]{1,2}/g, `/${PLACEHOLDER}`).split(/[?#]/)[0];
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return { path: path || "/", templated };
}

let hrefConstants: Map<string, string> | undefined;

/** Exported path constants (const LEADERSHIP_PATHWAY_HREF = "/learn/leadership-styles"), so `${CONST}/${slug}` links resolve. */
function pathConstants(): Map<string, string> {
  if (hrefConstants) return hrefConstants;
  hrefConstants = new Map();
  for (const file of linkSourceFiles().filter(f => /\.tsx?$/.test(f))) {
    for (const m of source(file).matchAll(/\bconst\s+([A-Z][A-Z0-9_]*)\s*(?::\s*\w+\s*)?=\s*["'`](\/[a-z][^"'`\s$]*)["'`]/g)) hrefConstants.set(m[1], m[2]);
  }
  return hrefConstants;
}

export function linksIn(file: string): Link[] {
  return linksInText(file, source(file));
}

export function linksInText(file: string, text: string): Link[] {
  const out: Link[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(/`\$\{([A-Z][A-Z0-9_]*)\}(\/[^`\s]*)?`/g)) {
    const base = pathConstants().get(m[1]);
    if (!base) continue;
    const { path, templated } = linkPath(base + (m[2] ?? ""));
    out.push({ file, line: lineOf(text, m.index ?? 0), href: base + (m[2] ?? ""), path, templated });
  }
  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    for (const m of text.matchAll(pattern)) {
      const href = m[2];
      if (!href || /^\/(?:_next|favicon|\$\{)/.test(href) || href === "/" && m[0].includes("](")) continue;
      // File-system paths in code (path: "/tmp/x") are not links.
      if (/^\/(?:tmp|var|usr|etc|home\/[a-z]+\/|Users)\b/.test(href)) continue;
      const index = m.index ?? 0;
      const key = `${index}:${href}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // "/share/library/" + id: the rest of the address is built from data.
      const concatenated = href.endsWith("/") && href !== "/" && /^\s*\+/.test(text.slice(index + m[0].length, index + m[0].length + 4));
      const { path, templated } = linkPath(concatenated ? `${href.replace(/\/$/, "")}/\${x}` : href);
      out.push({ file, line: lineOf(text, index), href, path, templated: templated || concatenated });
    }
  }
  return out;
}

export type Resolution = { ok: boolean; how: string; routes: Route[] };

export class Resolver {
  routes = routeInventory();
  redirects: Redirect[] = redirects();
  slugs = contentSlugs();
  /** The request proxy's retired-feature redirects (lib/program/retired-features.ts), when loaded. */
  retired?: (path: string) => string | null | undefined;
  private cache = new Map<string, Resolution>();

  static async create(): Promise<Resolver> {
    const resolver = new Resolver();
    try {
      const mod = await import("../../lib/program/retired-features.ts") as { retiredFeatureDestination?: (path: string) => string | null };
      resolver.retired = mod.retiredFeatureDestination;
    } catch { /* the proxy's list is optional for resolution */ }
    return resolver;
  }

  resolve(path: string): Resolution {
    const cached = this.cache.get(path);
    if (cached) return cached;
    const result = this.compute(path);
    this.cache.set(path, result);
    return result;
  }

  private compute(path: string): Resolution {
    const matches = matchRoutes(this.routes, path);
    const exact = matches.find(m => !m.route.dynamic);
    if (exact) return { ok: true, how: "route", routes: [exact.route] };
    const retired = this.retired?.(path);
    if (retired) return { ok: true, how: `retired, redirected to ${retired}`, routes: this.resolveTarget(retired) };
    const redirect = this.redirects.find(r => r.source.test(path));
    if (redirect) return { ok: true, how: `redirect to ${redirect.destination}`, routes: this.resolveTarget(redirect.destination) };
    if (!path.includes(PLACEHOLDER) && publicFileExists(path)) return { ok: true, how: "public file", routes: [] };
    // A template under a public folder (/toolkit-work/${file}): the folder must exist.
    const folder = path.split(`/${PLACEHOLDER}`)[0];
    if (path.includes(PLACEHOLDER) && folder !== path && folder.length > 1 && existsSync(join(ROOT, "public", folder)) && statSync(join(ROOT, "public", folder)).isDirectory()) return { ok: true, how: "public folder", routes: [] };
    const dynamic = matches.filter(m => m.route.dynamic);
    if (dynamic.length) {
      // Literal parameter values must be content that exists; placeholders are checked where the data is.
      const known = dynamic.find(m => m.params.every(p => p.includes(PLACEHOLDER) || this.slugs.has(p) || this.slugs.has(p.replace(/\.(?:html|json)$/, ""))));
      if (known) return { ok: true, how: "dynamic route", routes: [known.route] };
      return { ok: false, how: `no content "${dynamic[0].params.filter(p => !p.includes(PLACEHOLDER) && !this.slugs.has(p)).join("/")}" for ${dynamic[0].route.path}`, routes: [dynamic[0].route] };
    }
    return { ok: false, how: "no route, redirect or file", routes: [] };
  }

  private resolveTarget(destination: string): Route[] {
    const path = destination.split(/[?#]/)[0].replace(/:\w+\*?/g, PLACEHOLDER);
    const matches = matchRoutes(this.routes, path);
    return matches.length ? [matches[0].route] : [];
  }
}

export function allLinks(files = linkSourceFiles()): Link[] {
  return files.flatMap(linksIn).filter(link => !isOwnerRoute(link.path));
}

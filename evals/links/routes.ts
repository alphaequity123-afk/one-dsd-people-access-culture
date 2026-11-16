/**
 * Static route inventory from app/, redirects from next.config.ts, public files, and the content slugs that
 * dynamic routes accept. Used to decide whether an internal link resolves (A10) and how deep a page sits (A10, A12).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, rel, source } from "./imports.ts";

export type Segment = { kind: "static"; value: string } | { kind: "param"; name: string } | { kind: "catchall"; name: string; optional: boolean };
export type Route = { path: string; file: string; kind: "page" | "api"; segments: Segment[]; dynamic: boolean };

const OWNER_PREFIXES = ["/consultant", "/api/consultant", "/api/owner", "/api/contribute", "/api/cron", "/api/offline"];
export const isOwnerRoute = (path: string) => OWNER_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + "/"));

function walkApp(dir: string, out: string[]) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { if (!entry.name.startsWith("_") && entry.name !== "node_modules") walkApp(full, out); }
    else if (/^(?:page|route)\.(?:tsx?|jsx?|mdx)$/.test(entry.name)) out.push(rel(full));
  }
}

export function routeInventory(): Route[] {
  const files: string[] = [];
  walkApp(join(ROOT, "app"), files);
  return files.map(file => {
    const parts = file.split("/").slice(1, -1).filter(part => !/^\(.*\)$/.test(part) && !part.startsWith("@"));
    const segments: Segment[] = parts.map(part => {
      const optional = /^\[\[\.\.\.(.+)\]\]$/.exec(part);
      if (optional) return { kind: "catchall", name: optional[1], optional: true };
      const catchall = /^\[\.\.\.(.+)\]$/.exec(part);
      if (catchall) return { kind: "catchall", name: catchall[1], optional: false };
      const param = /^\[(.+)\]$/.exec(part);
      if (param) return { kind: "param", name: param[1] };
      return { kind: "static", value: part };
    });
    const path = "/" + parts.join("/");
    return { path: path === "/" ? "/" : path, file, kind: /\/route\.\w+$/.test(file) ? "api" : "page", segments, dynamic: segments.some(s => s.kind !== "static") } as Route;
  }).sort((a, b) => a.path.localeCompare(b.path));
}

/** Split a link into path segments; "${...}" placeholders become ":param". */
export function linkSegments(path: string): string[] {
  return path.split("/").filter(Boolean).map(part => { try { return decodeURIComponent(part); } catch { return part; } });
}
export const PLACEHOLDER = ":param";

export type Match = { route: Route; params: string[] };

/** Routes this path could be, static routes first. */
export function matchRoutes(routes: Route[], path: string): Match[] {
  const parts = linkSegments(path);
  const out: Match[] = [];
  for (const route of routes) {
    const params: string[] = [];
    let i = 0, ok = true;
    for (let s = 0; s < route.segments.length && ok; s++) {
      const seg = route.segments[s];
      // A "${...}" placeholder only fills a dynamic segment; it is never assumed to be a particular static page.
      if (seg.kind === "static") { ok = parts[i] === seg.value; i++; }
      else if (seg.kind === "param") { ok = parts[i] !== undefined; if (ok) params.push(parts[i]); i++; }
      else { const rest = parts.slice(i); ok = seg.optional || rest.length > 0; params.push(...rest); i = parts.length; }
    }
    if (ok && i === parts.length) out.push({ route, params });
  }
  return out.sort((a, b) => Number(a.route.dynamic) - Number(b.route.dynamic));
}

export type Redirect = { source: RegExp; text: string; destination: string };

/** Redirect sources from next.config.ts and config/legacy-course-data-redirects.json. */
export function redirects(): Redirect[] {
  const list: Redirect[] = [];
  const add = (text: string, destination: string) => {
    const pattern = text.split(/(:\w+\*?|\(.*?\))/).map(part => /^:\w+\*$/.test(part) ? ".*" : /^:\w+$/.test(part) ? "[^/]+" : /^\(.*\)$/.test(part) ? part : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
    list.push({ source: new RegExp(`^${pattern}/?$`), text, destination });
  };
  for (const m of source("next.config.ts").matchAll(/source:\s*"([^"]+)",\s*destination:\s*"([^"]+)"/g)) add(m[1], m[2]);
  const legacy = join(ROOT, "config/legacy-course-data-redirects.json");
  if (existsSync(legacy)) for (const entry of JSON.parse(readFileSync(legacy, "utf8")) as { source: string; destination: string }[]) add(entry.source, entry.destination);
  return list;
}

export function publicFileExists(path: string): boolean {
  let decoded = path;
  try { decoded = decodeURIComponent(path); } catch { /* keep */ }
  const full = join(ROOT, "public", decoded);
  return existsSync(full) && statSync(full).isFile() || existsSync(join(full, "index.html"));
}

let slugCache: Set<string> | undefined;

/**
 * Every identifier the program's content declares (ids, slugs, numbers) in lib/ and data/, so a link such as
 * /courses/abc can be checked against content that exists. Generous on purpose: a value must at least exist.
 */
export function contentSlugs(): Set<string> {
  if (slugCache) return slugCache;
  const slugs = new Set<string>();
  const visit = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "node_modules" && !entry.name.startsWith(".")) visit(full); continue; }
      if (!/\.(?:ts|tsx|json|mjs)$/.test(entry.name) || /\.test\./.test(entry.name) || statSync(full).size > 25_000_000) continue;
      const text = readFileSync(full, "utf8");
      for (const m of text.matchAll(/["'`]([A-Za-z0-9][A-Za-z0-9_.~:-]{0,150})["'`]/g)) slugs.add(m[1]);
      // Template ids like `podcast~${id}` and "a~b" composites contribute their parts.
      for (const m of text.matchAll(/["'`]([a-z0-9][a-z0-9-]*)~/g)) slugs.add(m[1]);
    }
  };
  for (const dir of ["lib", "data", "config", "app", "components"]) visit(join(ROOT, dir));
  // Public file names (self-directed course numbers, documents) are slugs too.
  slugCache = slugs;
  return slugs;
}

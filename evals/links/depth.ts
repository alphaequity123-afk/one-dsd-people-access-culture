/**
 * Click depth from /home, estimated from source code: a page links to what its own file, the components it
 * renders and the data those components import directly can link to, plus the navigation in its layouts.
 * "Three selections" is measured per route (a dynamic route such as /courses/[courseId] counts once).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, closure, source } from "./imports.ts";
import { Resolver, linksIn } from "./links.ts";
import { isOwnerRoute, type Route } from "./routes.ts";

export type DepthMap = { depth: Map<string, number>; pages: Route[]; redirectOnly: Route[]; start: string; edges: Map<string, Set<string>> };

/** Files whose links can appear on a page: app/ and components/ followed fully, lib/ one step in. */
function renderedFiles(entry: string): string[] {
  return [...closure([entry], file => file.startsWith("app/") || file.startsWith("components/")).keys()];
}

function layoutsFor(pageFile: string): string[] {
  const parts = pageFile.split("/").slice(0, -1);
  const out: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    const candidate = [...parts.slice(0, i), "layout.tsx"].join("/");
    if (existsSync(join(ROOT, candidate))) out.push(candidate);
  }
  return out;
}

/** A page that only sends the visitor elsewhere. */
function redirectOnly(route: Route, resolver: Resolver): boolean {
  if (resolver.redirects.some(r => r.source.test(route.path))) return true;
  const text = source(route.file);
  return /\b(?:redirect|permanentRedirect)\(/.test(text) && !/<[A-Za-z]/.test(text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""));
}

export async function computeDepth(start = "/home", resolver?: Resolver): Promise<DepthMap> {
  const r = resolver ?? await Resolver.create();
  const staffPages = r.routes.filter(route => route.kind === "page" && !isOwnerRoute(route.path));
  const redirecting = staffPages.filter(route => redirectOnly(route, r));
  const pages = staffPages.filter(route => !redirecting.includes(route));
  const linkCache = new Map<string, Set<string>>();
  const targetsOf = (file: string): Set<string> => {
    let set = linkCache.get(file);
    if (set) return set;
    set = new Set<string>();
    for (const link of linksIn(file)) for (const route of r.resolve(link.path).routes) set.add(route.path);
    linkCache.set(file, set);
    return set;
  };
  const edgesFrom = (files: string[]) => {
    const out = new Set<string>();
    for (const file of files) for (const target of targetsOf(file)) out.add(target);
    return out;
  };
  const rootLayout = existsSync(join(ROOT, "app/layout.tsx")) ? edgesFrom(renderedFiles("app/layout.tsx")) : new Set<string>();
  const edges = new Map<string, Set<string>>();
  const byPath = new Map(r.routes.map(route => [route.path, route]));
  for (const route of staffPages) {
    const files = new Set<string>(renderedFiles(route.file));
    for (const layout of layoutsFor(route.file)) if (layout !== "app/layout.tsx") for (const f of renderedFiles(layout)) files.add(f);
    const out = edgesFrom([...files]);
    for (const target of rootLayout) out.add(target);
    edges.set(route.path, out);
  }
  // A redirect-only page passes the visitor straight on, at the same depth.
  const depth = new Map<string, number>();
  const queue: string[] = [];
  const visit = (path: string, d: number) => {
    if (depth.has(path)) return;
    depth.set(path, d);
    queue.push(path);
  };
  visit(start, 0);
  while (queue.length) {
    const at = queue.shift()!;
    const d = depth.get(at)!;
    for (const next of edges.get(at) ?? []) {
      const route = byPath.get(next);
      if (!route || route.kind !== "page" || isOwnerRoute(next)) continue;
      visit(next, d + 1);
    }
  }
  return { depth, pages, redirectOnly: redirecting, start, edges };
}

/** Depth of the route a link path resolves to, or undefined when it is not reachable. */
export function depthOfPath(map: DepthMap, resolver: Resolver, path: string): { route?: string; depth?: number } {
  const routes = resolver.resolve(path).routes;
  const route = routes.find(candidate => map.depth.has(candidate.path)) ?? routes[0];
  return { route: route?.path, depth: route ? map.depth.get(route.path) : undefined };
}

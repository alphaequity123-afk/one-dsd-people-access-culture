/**
 * A10. Links, sharing and downloads (docs/EVALS-STUDY.md section 6), offline.
 * - Route inventory from app/ (pages and route handlers).
 * - Every internal link written in pages, components, program data and published HTML resolves to a route,
 *   a redirect, a public file or, for dynamic routes, content that exists.
 * - Click depth from /home, estimated from the navigation and page links in source.
 * - Downloads: the application's own adapters, for samples of every download kind, contain the title,
 *   first heading and a source line (plain text and Word).
 */
import { readFileSync } from "node:fs";
import { measure, result, type EvalOptions, type EvalResult } from "../contract.ts";
import { computeDepth } from "./depth.ts";
import { checkDownloads } from "./downloads.ts";
import { Resolver, allLinks } from "./links.ts";
import { isOwnerRoute } from "./routes.ts";

export const id = "A10";
export const cadence = "unit";

export function depthExceptions(): Record<string, string> {
  return JSON.parse(readFileSync(new URL("./depth-exceptions.json", import.meta.url), "utf8")).routes;
}

export async function run(_options: EvalOptions = {}): Promise<EvalResult> {
  const resolver = await Resolver.create();
  const links = allLinks();
  const broken = links.filter(link => !resolver.resolve(link.path).ok);
  const retired = links.filter(link => /^retired/.test(resolver.resolve(link.path).how));
  const brokenByPath = new Map<string, typeof broken>();
  for (const link of broken) brokenByPath.set(link.path, [...(brokenByPath.get(link.path) ?? []), link]);

  const map = await computeDepth("/home", resolver);
  const exceptions = depthExceptions();
  const counted = map.pages.filter(page => !(page.path in exceptions));
  const within = counted.filter(page => (map.depth.get(page.path) ?? Infinity) <= 3);
  const share = counted.length ? within.length / counted.length : 0;
  const deep = counted.filter(page => (map.depth.get(page.path) ?? Infinity) > 3)
    .map(page => `${page.path} — ${map.depth.has(page.path) ? `${map.depth.get(page.path)} selections` : "no link found from /home"} (${page.file})`);

  const downloads = await checkDownloads(2);
  const failedDownloads = downloads.checks.filter(check => !check.ok);
  const problemCounts = new Map<string, number>();
  for (const check of failedDownloads) for (const problem of check.problems) { const key = problem.replace(/".*"/, "\"…\""); problemCounts.set(key, (problemCounts.get(key) ?? 0) + 1); }

  const routes = resolver.routes;
  const measures = [
    measure("broken internal links (content, components, program data, published HTML)", broken.length, "0", broken.length === 0,
      [...brokenByPath].slice(0, 12).map(([path, list]) => `${path} — ${resolver.resolve(path).how}; ${list.length} link(s), first at ${list[0].file}:${list[0].line}`)),
    measure("staff pages within 3 selections of /home", `${within.length}/${counted.length} (${(share * 100).toFixed(1)}%)`, ">= 95%", share >= 0.95, deep.slice(0, 12)),
    measure("download documents with title, first heading and source line (text and Word)", `${downloads.checks.length - failedDownloads.length}/${downloads.checks.length}`, "100%", failedDownloads.length === 0,
      [`problems: ${[...problemCounts].map(([k, n]) => `${k} (${n})`).join("; ")}`, ...failedDownloads.slice(0, 11).map(check => `${check.kind}/${check.id}: ${check.problems.join("; ")}`)]),
  ];
  if (downloads.uncovered.length) measures.push(measure("download kinds with no sample to check", downloads.uncovered.length, "0", false, downloads.uncovered));
  return result({
    id, title: "Links, sharing and downloads", layer: "A", cadence: "unit", measures,
    skipped: [
      "External links (weekly, with retries) and share-link opening (needs a running app): live cadence",
      "Excel, PowerPoint and PDF text (Word and plain text are read here; the same document feeds every format)",
      ...downloads.gated.map(entry => `download ${entry}`),
    ],
    notes: [
      `${routes.filter(r => r.kind === "page").length} pages and ${routes.filter(r => r.kind === "api").length} route handlers in app/ (${routes.filter(r => isOwnerRoute(r.path)).length} owner or system routes left out of depth).`,
      `${links.length} internal links checked; ${retired.length} point at retired features the request proxy redirects (lib/program/retired-features.ts).`,
      `Depth counts ${counted.length} staff pages; ${map.redirectOnly.length} redirect-only pages and ${Object.keys(exceptions).length} share or embed pages (evals/links/depth-exceptions.json) are left out. Depth is per route: a dynamic route counts once.`,
      `Downloads: ${downloads.checks.length} documents across ${downloads.kinds.length} kinds, sampled from the same catalogs the pages use (scope one-dhs).`,
    ].join(" "),
  });
}

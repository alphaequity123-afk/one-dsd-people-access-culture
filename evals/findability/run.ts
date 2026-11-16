/**
 * A12. Findability tasks, automated part (docs/EVALS-STUDY.md section 6).
 * For each task in evals/findability/tasks.jsonl:
 * - the site's own search (lib/search/site-search.ts, the index search and Ask share), run offline on the
 *   repository's published content, returns an expected item in its top 5;
 * - the expected item's page is reachable within 3 selections of /home (the A10 click-depth estimate).
 * Whether Ask cites the item needs the model: live cadence (A1).
 */
import { readFileSync } from "node:fs";
import { measure, result, type EvalOptions, type EvalResult } from "../contract.ts";
import { computeDepth, depthOfPath } from "../links/depth.ts";
import { Resolver } from "../links/links.ts";
import { loadAppModule } from "../links/load-app.ts";

export const id = "A12";
export const cadence = "unit";

export type Task = { id: string; task: string; query: string; expected: string[] };
type SearchHit = { title: string; href: string };
type Search = { siteSearch: (query: string, scope: "one-dhs" | "dsd", limit?: number) => Promise<SearchHit[]> };

export function loadTasks(): Task[] {
  return readFileSync(new URL("./tasks.jsonl", import.meta.url), "utf8").split("\n").map(line => line.trim()).filter(Boolean).map(line => JSON.parse(line) as Task);
}

const pathOf = (href: string) => {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "");
  return path || "/";
};

export async function run(_options: EvalOptions = {}): Promise<EvalResult> {
  const tasks = loadTasks();
  const resolver = await Resolver.create();
  const map = await computeDepth("/home", resolver);
  const { siteSearch } = await loadAppModule<Search>("evals/findability/search-entry.ts");

  const searchMisses: string[] = [];
  const depthMisses: string[] = [];
  const unknownExpected: string[] = [];
  let found = 0, reachable = 0;
  for (const task of tasks) {
    for (const href of task.expected) if (!resolver.resolve(pathOf(href)).ok) unknownExpected.push(`${task.id} ${href}: ${resolver.resolve(pathOf(href)).how}`);
    const hits = await siteSearch(task.query, "one-dhs", 5);
    const top = hits.slice(0, 5).map(hit => pathOf(hit.href));
    const hit = task.expected.find(href => top.includes(pathOf(href)));
    if (hit) found++;
    else searchMisses.push(`${task.id} "${task.query}" — expected ${task.expected.join(" or ")}; top 5: ${top.join(", ") || "nothing"}`);
    // Reachable when any expected item's page sits within 3 selections.
    const depths = task.expected.map(href => ({ href, ...depthOfPath(map, resolver, pathOf(href)) }));
    const best = depths.filter(d => d.depth !== undefined).sort((a, b) => a.depth! - b.depth!)[0];
    if (best && best.depth! <= 3) reachable++;
    else depthMisses.push(`${task.id} ${task.task}: ${best ? `${best.href} is ${best.depth} selections from /home (route ${best.route})` : `no navigation path found to ${task.expected.join(" or ")}`}`);
  }
  const n = tasks.length;
  const measures = [
    measure("tasks whose expected item is in the top 5 of site search", `${found}/${n} (${((found / n) * 100).toFixed(0)}%)`, ">= 90%", found / n >= 0.9, searchMisses),
    measure("tasks whose expected item is reachable within 3 selections of /home", `${reachable}/${n} (${((reachable / n) * 100).toFixed(0)}%)`, ">= 90%", reachable / n >= 0.9, depthMisses),
    measure("expected items that exist (task file is valid)", unknownExpected.length, "0", unknownExpected.length === 0, unknownExpected),
  ];
  return result({
    id, title: "Findability tasks (automated part)", layer: "A", cadence: "unit", measures,
    skipped: ["Does Ask cite the expected item: needs the model, live cadence (A1)", "The part done with people (section B, outcome staff_capability)"],
    notes: `${n} tasks from evals/findability/tasks.jsonl. Search is lib/search/site-search.ts run offline on the repository's static content (scope one-dhs); depth is the A10 estimate per route, so a library item counts as reachable when /library/[id] is.`,
  });
}

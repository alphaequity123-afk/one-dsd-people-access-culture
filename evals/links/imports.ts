/**
 * A static import graph of the repository (no build). Used by A9 (what code a staff request can reach) and
 * A10/A12 (which links a page can show). Type-only imports are left out because they never run.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs", ".cjs", ".json"];

export const rel = (full: string) => relative(ROOT, full).split(sep).join("/");
const isFile = (full: string) => existsSync(full) && statSync(full).isFile();

/** Resolve an import specifier to a repository file, or null for packages and missing files. */
export function resolveImport(fromFile: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = join(ROOT, dirname(fromFile), spec);
  else return null;
  if (isFile(base)) return rel(base);
  for (const ext of EXTENSIONS) if (isFile(base + ext)) return rel(base + ext);
  const stripped = base.replace(/\.(?:js|mjs|cjs)$/, "");
  if (stripped !== base) for (const ext of EXTENSIONS) if (isFile(stripped + ext)) return rel(stripped + ext);
  for (const ext of EXTENSIONS) if (isFile(join(base, "index" + ext))) return rel(join(base, "index" + ext));
  return null;
}

const IMPORT_PATTERNS = [
  /^\s*import\s+(?!type\b)(?:[\w*{}\s,$]+?\s+from\s+)?["']([^"']+)["']/gm,
  /^\s*export\s+(?!type\b)(?:\*|\{[^}]*\})\s+from\s+["']([^"']+)["']/gm,
  /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\(\s*["']([^"']+)["']\s*\)/g,
];

const importCache = new Map<string, string[]>();
const sourceCache = new Map<string, string>();

export function source(file: string): string {
  let text = sourceCache.get(file);
  if (text === undefined) { text = existsSync(join(ROOT, file)) ? readFileSync(join(ROOT, file), "utf8") : ""; sourceCache.set(file, text); }
  return text;
}

/** Repository files this file imports at run time. */
export function importsOf(file: string): string[] {
  const cached = importCache.get(file);
  if (cached) return cached;
  const text = source(file);
  const found = new Set<string>();
  // Multi-line "import { a, b } from" statements are flattened first.
  const flat = text.replace(/import\s+(?!type\b)\{[^}]*\}\s+from/g, m => m.replace(/\s+/g, " "));
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    for (const m of flat.matchAll(pattern)) {
      const target = resolveImport(file, m[1]);
      if (target && target !== file) found.add(target);
    }
  }
  const list = [...found];
  importCache.set(file, list);
  return list;
}

/** Breadth-first closure from entry files. Returns each reached file with the file that first imported it. */
export function closure(entries: string[], follow: (file: string) => boolean = () => true): Map<string, string | null> {
  const parent = new Map<string, string | null>();
  const queue: string[] = [];
  for (const entry of entries) if (!parent.has(entry)) { parent.set(entry, null); queue.push(entry); }
  while (queue.length) {
    const file = queue.shift()!;
    if (!follow(file) && parent.get(file) !== null) continue;
    for (const next of importsOf(file)) if (!parent.has(next)) { parent.set(next, file); queue.push(next); }
  }
  return parent;
}

/** The import chain from an entry to a file, for reports ("app/x/page.tsx > components/y.tsx > lib/z.ts"). */
export function chain(parent: Map<string, string | null>, file: string, max = 6): string {
  const steps: string[] = [];
  let at: string | null | undefined = file;
  while (at && steps.length < 40) { steps.unshift(at); at = parent.get(at); }
  return steps.length > max ? [...steps.slice(0, 2), "…", ...steps.slice(-(max - 3))].join(" > ") : steps.join(" > ");
}

export function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

import fs from "node:fs";
import path from "node:path";
import { responsibleWording, withResponsibleWording } from "../lib/content/responsible-wording.ts";

const GUARDED = [/^lib\/content\/course-language-revisions\.json$/, /^lib\/content\/course-partial-language-revisions\.json$/, /^lib\/content\/professional-language-revisions\.json$/,
  /^lib\/content\/staff-surface-registry\.ts$/, /^lib\/content\/courses\//, /^lib\/content\/responsible-wording/, /\.test\.[a-z]+$/];
const roots = ["lib/content", "lib/program", "lib/learning", "lib/hub", "lib/graph", "lib/practice", "lib/implementation", "app", "components"];
const files: string[] = [];
const walk = (dir: string) => { if (!fs.existsSync(dir)) return; for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.posix.join(dir, entry.name); if (entry.isDirectory()) walk(p); else if (/\.(json|ts|tsx|md)$/.test(entry.name)) files.push(p); } };
roots.forEach(walk);
let changedFiles = 0, total = 0; const report: Record<string, number> = {};
const count = (a: string, b: string) => { let n = 0; const A = a.split("\n"), B = b.split("\n"); for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) n++; return n; };
for (const file of files) {
  if (GUARDED.some(rule => rule.test(file))) continue;
  const raw = fs.readFileSync(file, "utf8");
  if (!/offices?\b/.test(raw)) continue;
  let next = raw;
  if (file.endsWith(".json")) {
    const crlf = raw.includes("\r\n"); const body = raw.replace(/\r\n/g, "\n");
    let parsed: unknown; try { parsed = JSON.parse(body); } catch { continue; }
    const indentMatch = body.match(/\n( +|\t)"/); const indent = indentMatch ? (indentMatch[1] === "\t" ? "\t" : indentMatch[1].length) : 0;
    const tail = body.endsWith("\n") ? "\n" : "";
    const serialize = (value: unknown) => JSON.stringify(value, null, indent) + tail;
    if (serialize(parsed) === body) {
      const out = serialize(withResponsibleWording(parsed));
      next = crlf ? out.replace(/\n/g, "\r\n") : out;
    } else {
      // The file is not in a plain layout; reword line by line, leaving spoken transcripts and addresses alone.
      next = raw.split("\n").map(line => /"(?:href|url|src|id|slug|introTranscript|transcript|captions|quote|citation)"\s*:/.test(line) ? line : responsibleWording(line)).join("\n");
    }
  } else {
    next = raw.split("\n").map(line => /\b(?:transcript|captions)\b\s*[:=]/i.test(line) ? line : responsibleWording(line)).join("\n");
  }
  if (next !== raw) { fs.writeFileSync(file, next); changedFiles++; const n = count(raw, next); total += n; report[file] = n; }
}
console.log(JSON.stringify({ changedFiles, changedLines: total, top: Object.entries(report).sort((a, b) => b[1] - a[1]).slice(0, 25) }, null, 1));

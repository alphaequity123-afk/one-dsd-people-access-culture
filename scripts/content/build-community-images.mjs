#!/usr/bin/env node
// Resizes community research photos and writes content-addressed copies to
// public/images/community-collection/. Each run also writes an index, one file
// per community, that conversion uses to fill photo fields:
//   community-profile-research/photos/built-images/<research-slug>.json
//
// Usage:
//   node scripts/content/build-community-images.mjs --community 01-african-american
//   node scripts/content/build-community-images.mjs --all --report-only
//
// Native pages stay deferred (14-, 15-, 35-) and are never built. Images whose
// manifest points at a wiki, and any file marked as generated, are refused.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const photos = path.join(root, "community-profile-research", "photos");
const output = path.join(root, "public", "images", "community-collection");
const indexDir = path.join(photos, "built-images");
const MAX_WIDTH = 480;
const QUALITY = 78;
const DEFERRED = /^(14|15|35)-/;
const REFUSED_SOURCE = /wiki|fandom\.com|kiddle\.co/i;
const REFUSED_FILE = /(^|[-_.])ai\.[a-z]+$/i;

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}
const community = arg("--community");
const all = process.argv.includes("--all");
const reportOnly = process.argv.includes("--report-only");
if (!community && !all) {
  console.error("Name a community with --community <research-slug>, or use --all --report-only.");
  process.exit(2);
}
if (community && DEFERRED.test(community)) {
  console.error(`${community} stays deferred and is never built.`);
  process.exit(2);
}

let sharp;
try { sharp = (await import("sharp")).default; } catch {
  console.error("sharp is not present in node_modules. No images were built.");
  process.exit(3);
}

function parseCsv(source) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.filter(cells => cells.length > 1).map(cells => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""])));
}

// Manifests recorded the folder the photos were first saved in. Only the part
// after "photos" is meaningful in this copy.
function localPath(imagePath) {
  const parts = imagePath.replace(/\\/g, "/").split("/");
  const at = parts.lastIndexOf("photos");
  return path.join(photos, ...parts.slice(at + 1));
}

// Later passes override earlier ones: base, then -b, then -r2, -r3 and so on.
function manifestRank(name) {
  const round = name.match(/-r(\d+)\.csv$/);
  return round ? Number(round[1]) : /-b\.csv$/.test(name) ? 1 : 0;
}

const entries = new Map();
const refused = [];
for (const name of readdirSync(photos).filter(file => /^manifest-.*\.csv$/.test(file)).sort((a, b) => manifestRank(a) - manifestRank(b) || a.localeCompare(b))) {
  for (const row of parseCsv(readFileSync(path.join(photos, name), "utf8"))) {
    if (row.status !== "photo" || !row.image_path) continue;
    const slug = row.file_md.replace(/\.md$/, "").replace(/-(expansion|disability|orgs-media)$/, "");
    if (DEFERRED.test(slug)) continue;
    if (REFUSED_SOURCE.test(`${row.source_page} ${row.image_url}`) || REFUSED_FILE.test(row.image_path)) { refused.push(`${slug}: ${row.person}`); continue; }
    entries.set(`${slug}|${row.person}`, { slug, kind: "person", name: row.person, heading: row.heading, file: localPath(row.image_path), sourcePage: row.source_page, license: row.license, credit: row.credit });
  }
}
const imageDir = path.join(photos, "_community-images");
for (const name of ["manifest-01-21.csv", "manifest-22-42.csv", "manifest-zz-upgrades.csv"]) {
  const file = path.join(imageDir, name);
  if (!existsSync(file)) continue;
  for (const row of parseCsv(readFileSync(file, "utf8"))) {
    if (!row.community || DEFERRED.test(row.community)) continue;
    if (REFUSED_SOURCE.test(`${row.source_page} ${row.image_url}`) || REFUSED_FILE.test(row.image_path)) { refused.push(`${row.community}: community image`); continue; }
    entries.set(`${row.community}|community image`, { slug: row.community, kind: "community", name: row.subject, heading: row.subject, file: localPath(row.image_path), sourcePage: row.source_page, license: row.license, credit: row.credit });
  }
}

if (!reportOnly) mkdirSync(output, { recursive: true });
mkdirSync(indexDir, { recursive: true });
const selected = [...entries.values()].filter(entry => all || entry.slug === community);
const missing = [];
const indexes = new Map();
const written = new Map();
for (const entry of selected) {
  if (!existsSync(entry.file)) { missing.push(`${entry.slug}: ${entry.name}`); continue; }
  const { data, info } = await sharp(entry.file)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  const hash = createHash("sha256").update(data).digest("hex");
  const name = `${hash}.jpg`;
  written.set(name, data.length);
  if (!reportOnly) writeFileSync(path.join(output, name), data);
  if (!indexes.has(entry.slug)) indexes.set(entry.slug, []);
  indexes.get(entry.slug).push({
    kind: entry.kind, name: entry.name, heading: entry.heading,
    src: `/images/community-collection/${name}`, width: info.width, height: info.height, bytes: data.length,
    sourceHref: entry.sourcePage, rights: entry.license, credit: entry.credit,
  });
}
if (!reportOnly) for (const [slug, items] of indexes) writeFileSync(path.join(indexDir, `${slug}.json`), `${JSON.stringify(items, null, 2)}\n`);

const total = [...written.values()].reduce((sum, value) => sum + value, 0);
console.log(`${reportOnly ? "Would write" : "Wrote"} ${written.size} files, ${(total / 1048576).toFixed(2)} MB, from ${selected.length} manifest rows.`);
if (missing.length) console.log(`Missing source files (${missing.length}):\n  ${missing.join("\n  ")}`);
if (refused.length) console.log(`Refused (${refused.length}):\n  ${refused.join("\n  ")}`);

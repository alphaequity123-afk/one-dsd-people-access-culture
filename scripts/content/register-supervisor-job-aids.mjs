// Registers the 19 supervisor and manager courses and their standalone job aids
// (ja-sm-*) in the organization files the library filters read:
//   lib/content/resource-organization-data.json  (themes and level for course-sm-* and ja-sm-*)
//   lib/content/courses/theme-memberships.json   (legacy theme URLs for course-sm-*)
//   lib/content/progression-level-tags.json       (progression level shown on ja-sm-* pages)
//   lib/program/development-membership.json       (development journeys for ja-sm-*)
//
// The placement is lib/content/supervisor-job-aids-placement.json, and the job
// aid content is the course packs' jobAid (lib/content/supervisor-job-aids.ts
// builds the resources from the same two files at run time), so run this after
// the course importer.
//
// Usage: node scripts/content/register-supervisor-job-aids.mjs [--check]
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const check = process.argv.includes("--check");
const packDir = path.join(root, "lib/content/courses/authored/supervisor-manager");
const LEVEL_BASIS = { foundation: "published foundation content type", intermediate: "applied practice/method course; not inferred from staff rank", advanced: "series describes complex systems, strategic practice, or capstone" };
const THEMES = new Set(["identity", "access", "disability", "policy", "workforce", "partnership", "leadership", "evidence"]);
const JOURNEYS = new Set(["perspectives-and-culture", "decisions-and-systems", "access-and-communication", "workplace-culture", "learning-and-leadership"]);

const files = {
  organization: "lib/content/resource-organization-data.json",
  memberships: "lib/content/courses/theme-memberships.json",
  progression: "lib/content/progression-level-tags.json",
  development: "lib/program/development-membership.json",
};
const read = name => readFileSync(path.join(root, files[name]), "utf8");
const parse = name => JSON.parse(read(name));
/** Each file keeps the formatting it already has. */
const formatters = {
  organization: data => `${JSON.stringify(data, null, 2)}\n`.replace(/\n/g, "\r\n"),
  memberships: data => `${JSON.stringify(data, null, 2)}\n`,
  progression: data => `{\n${Object.entries(data).map(([key, value]) => `  ${JSON.stringify(key)}: ${Array.isArray(value) ? `[${value.map(id => JSON.stringify(id)).join(", ")}]` : JSON.stringify(value)}`).join(",\n")}\n}\n`,
  development: data => `${JSON.stringify(data, null, 2)}\n`.replace(/\n/g, "\r\n"),
};
for (const name of Object.keys(files)) {
  if (formatters[name](parse(name)) !== read(name)) throw new Error(`${files[name]} is not in the formatting this script writes; check the file before running it.`);
}

const placement = JSON.parse(readFileSync(path.join(root, "lib/content/supervisor-job-aids-placement.json"), "utf8"));
const manifest = JSON.parse(readFileSync(path.join(packDir, "import-manifest.json"), "utf8"));
const courseIds = manifest.courses.map(row => row.id);
const placed = Object.keys(placement).filter(key => key !== "_note");
if (placed.length !== courseIds.length || placed.some(id => !courseIds.includes(id))) throw new Error(`The placement names ${placed.join(", ")} but the imported courses are ${courseIds.join(", ")}.`);

const organization = parse("organization");
const memberships = parse("memberships");
const progression = parse("progression");
const development = parse("development");

for (const id of courseIds) {
  const { course, jobAid } = JSON.parse(readFileSync(path.join(packDir, `${id}.json`), "utf8"));
  const entry = placement[id];
  const aidId = `ja-${id}`;
  if (!entry.themes.length || entry.themes.some(theme => !THEMES.has(theme))) throw new Error(`${id}: themes must be reviewed theme ids`);
  if (entry.legacyThemes.some(theme => !(theme in memberships))) throw new Error(`${id}: legacy themes must be keys of theme-memberships.json`);
  if (!(entry.level in LEVEL_BASIS)) throw new Error(`${id}: unknown level ${entry.level}`);
  if (!(entry.progression in progression)) throw new Error(`${id}: unknown progression level ${entry.progression}`);
  if (!entry.journeys.length || entry.journeys.some(journey => !JOURNEYS.has(journey))) throw new Error(`${id}: journeys must be development journey ids`);
  if (entry.basis.length <= 20) throw new Error(`${id}: the basis must explain the classification`);
  organization[`course-${id}`] = {
    title: course.title, themes: [...entry.themes], level: entry.level, basis: entry.basis,
    levelBasis: LEVEL_BASIS[entry.level], legacyThemes: [...entry.legacyThemes],
  };
  organization[aidId] = {
    title: jobAid.title, themes: [...entry.themes], level: null, basis: entry.basis,
    levelBasis: "practical/reference resource; learning level not required", legacyThemes: [...entry.legacyThemes],
  };
  for (const [theme, ids] of Object.entries(memberships)) {
    const member = entry.legacyThemes.includes(theme);
    const present = ids.includes(`course-${id}`);
    if (member && !present) ids.push(`course-${id}`);
    if (!member && present) ids.splice(ids.indexOf(`course-${id}`), 1);
  }
  for (const [level, ids] of Object.entries(progression)) {
    if (!Array.isArray(ids)) continue;
    const present = ids.includes(aidId);
    if (level === entry.progression && !present) ids.push(aidId);
    if (level !== entry.progression && present) ids.splice(ids.indexOf(aidId), 1);
  }
  // The same short answer lib/content/supervisor-job-aids.ts gives the resource.
  const item = { id: aidId, journeyIds: [...entry.journeys], purpose: jobAid.use?.purpose || jobAid.subtitle };
  const index = development.items.findIndex(existing => existing.id === aidId);
  if (index >= 0) development.items[index] = item; else development.items.push(item);
}

let changed = 0;
for (const [name, data] of [["organization", organization], ["memberships", memberships], ["progression", progression], ["development", development]]) {
  const next = formatters[name](data);
  if (next === read(name)) continue;
  changed += 1;
  if (check) console.log(`Out of date: ${files[name]}`);
  else { writeFileSync(path.join(root, files[name]), next); console.log(`Wrote ${files[name]}`); }
}
if (check && changed) process.exit(1);
console.log(changed ? `${changed} file(s) ${check ? "out of date" : "updated"}.` : "All organization files are up to date.");

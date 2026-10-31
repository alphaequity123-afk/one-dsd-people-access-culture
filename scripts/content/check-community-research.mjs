#!/usr/bin/env node
// Applies the page's own validator to community research files, and checks what
// only a script can: image files exist, are at most 480 px wide, and no two
// people or institutions share a photo by mistake.
//
// Usage: node scripts/content/check-community-research.mjs [app-id ...]
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { communityResearchProblems, minnesotaAccessProblems } from "../../lib/content/community-research-policy.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = path.join(root, "lib", "content", "community-research");
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter(name => name.endsWith(".json") && !name.startsWith("_")).map(name => name.replace(/\.json$/, ""));

let failed = 0;
const report = (name, problems) => {
  if (problems.length) { failed += problems.length; console.log(`${name}: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`); }
  else console.log(`${name}: ok`);
};
report("_minnesota-access", minnesotaAccessProblems(JSON.parse(readFileSync(path.join(dir, "_minnesota-access.json"), "utf8"))));

for (const id of ids) {
  const file = path.join(dir, `${id}.json`);
  if (!existsSync(file)) { report(id, ["file not found"]); continue; }
  const data = JSON.parse(readFileSync(file, "utf8"));
  const problems = communityResearchProblems(data, id);
  const photos = [...(data.people ?? []), ...(data.institutions ?? [])].filter(item => item.photo).map(item => [item.name, item.photo]);
  if (data.communityImage) photos.push(["community image", data.communityImage]);
  const used = new Map();
  let bytes = 0;
  for (const [name, photo] of photos) {
    const local = path.join(root, "public", ...String(photo.src).split("/").filter(Boolean));
    if (!existsSync(local)) { problems.push(`${name}: image file missing, ${photo.src}`); continue; }
    const meta = await sharp(local).metadata();
    bytes += meta.size ?? readFileSync(local).length;
    if (meta.width !== photo.width || meta.height !== photo.height) problems.push(`${name}: recorded size ${photo.width}x${photo.height}, file is ${meta.width}x${meta.height}`);
    if (meta.width > 480) problems.push(`${name}: image is wider than 480 px`);
    if (used.has(photo.src)) problems.push(`${name}: same image as ${used.get(photo.src)}`);
    used.set(photo.src, name);
  }
  report(id, problems);
  console.log(`  ${(data.people ?? []).length} people (${(data.people ?? []).filter(item => item.photo).length} with photos), ${(data.institutions ?? []).length} institutions, ${(data.organizations?.entries ?? []).length} directory entries, ${(bytes / 1024).toFixed(0)} KB of images`);
}
process.exit(failed ? 1 : 0);

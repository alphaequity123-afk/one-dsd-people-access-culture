#!/usr/bin/env node
// Starts a community's research JSON from its four markdown files. The output is
// a draft, not page content: it goes to community-profile-research/drafts/ and
// carries draftNotes (everything the research marked uncertain) and TODO fields.
// COMMUNITY-CONVERSION.md says how to finish it. The checker refuses a draft.
//
// Usage: node scripts/content/draft-community-research.mjs 08-cambodian
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const research = path.join(root, "community-profile-research", "research");

// Research slug to app id. Native research (14-, 15-, 35-) stays out of the app.
export const COMMUNITY_IDS = {
  "01-african-american": "african-american", "02-latino": "latino", "03-hmong": "hmong", "04-somali": "somali",
  "05-karen": "karen", "06-oromo": "oromo", "07-vietnamese": "vietnamese", "08-cambodian": "khmer", "09-lao": "lao",
  "10-arabic-speaking": "arabic-speaking", "11-american-culture": "american", "12-minnesota-culture": "minnesota",
  "13-european-american": "european-american", "16-amharic-speaking": "amharic", "17-bosnian": "bosnian",
  "18-burmese": "burmese", "19-chinese": "chinese", "20-colombian": "colombian", "21-cuban": "cuban",
  "22-deaf-deafblind-hoh": "deaf-deafblind-hard-of-hearing", "23-ecuadorian": "ecuadorian", "24-ethiopian": "ethiopian",
  "25-filipino": "filipino", "26-french-speaking": "french", "27-guatemalan": "guatemalan", "28-asian-indian": "indian",
  "29-japanese": "japanese", "30-kenyan": "kenyan", "31-korean": "korean", "32-lebanese": "lebanese", "33-liberian": "liberian",
  "34-mexican": "mexican", "36-nigerian": "nigerian", "37-puerto-rican": "puerto-rican", "38-rural-greater-minnesota": "rural",
  "39-russian-speaking": "russian-speaking", "40-salvadoran": "salvadoran", "41-thai": "thai", "42-ukrainian": "ukrainian",
};

const slug = process.argv[2];
if (!slug) { console.error("Name a research slug, such as 08-cambodian."); process.exit(2); }
if (/^(14|15|35)-/.test(slug)) { console.error(`${slug} stays deferred and is never converted.`); process.exit(2); }
const id = COMMUNITY_IDS[slug];
if (!id) { console.error(`${slug} is not in the community map.`); process.exit(2); }

const read = suffix => {
  const file = path.join(research, `${slug}${suffix}.md`);
  return existsSync(file) ? readFileSync(file, "utf8") : "";
};
const today = new Date().toISOString().slice(0, 10);
const draftNotes = [];

function split(source, pattern) {
  const parts = [];
  let current = null;
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(pattern);
    if (match) { current = { title: match[1].trim(), lines: [] }; parts.push(current); }
    else if (current) current.lines.push(line);
  }
  return parts;
}
const paragraphs = lines => lines.join("\n").split(/\n\s*\n/).map(part => part.replace(/\n/g, " ").trim()).filter(Boolean);
const bullets = lines => lines.filter(line => /^\s*(?:[-*]|\d+[.)])\s+/.test(line)).map(line => line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "").replace(/\*\*/g, "").trim());
function sourcesFrom(lines) {
  return bullets(lines).flatMap(line => {
    const match = line.match(/^(.*?)\s+[—-]\s+(https:\/\/\S+)/) ?? line.match(/^(.*?)\s*(https:\/\/\S+)/);
    if (!match) { draftNotes.push(`Source without a usable link: ${line}`); return []; }
    if (/wiki/i.test(match[2])) { draftNotes.push(`Wiki source dropped: ${line}`); return []; }
    return [{ label: match[1].replace(/[,;:]$/, "").trim() || match[2], href: match[2].replace(/[.,;)]+$/, "") }];
  });
}
function sectionOf(lines) {
  const out = {};
  for (const part of split(lines.join("\n"), /^###\s+(.+)$/)) out[part.title.toLowerCase()] = part.lines;
  return out;
}
const images = (() => {
  const file = path.join(root, "community-profile-research", "photos", "built-images", `${slug}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
})();
if (!images.length) draftNotes.push(`No built images. Run: node scripts/content/build-community-images.mjs --community ${slug}`);
function photoFor(name) {
  const clean = name.replace(/["“”]/g, "").toLowerCase();
  const found = images.find(item => item.kind === "person" && item.name.replace(/["“”]/g, "").toLowerCase() === clean);
  if (!found) { draftNotes.push(`No photo in the manifests for ${name}. Find a real photo at a reputable source, never a wiki, or say why there is none.`); return undefined; }
  return { src: found.src, alt: `TODO: look at the photo and describe it. ${name}.`, credit: found.credit.replace(/\.$/, ""), sourceHref: found.sourceHref, rights: found.rights.replace(/\.$/, ""), width: found.width, height: found.height };
}
function profile(part, kind) {
  const sections = sectionOf(part.lines);
  const heading = part.title.replace(/^(Person|Institution):\s*/, "");
  const match = heading.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  const name = match ? match[1] : heading;
  const meta = part.lines.find(line => /^\*\*(Field|Type):/.test(line)) ?? "";
  const notes = sections["verification status"] ?? [];
  for (const line of bullets(notes)) if (/uncertain|conflict|not confirmed|below the|weakly|not found|search|differ/i.test(line)) draftNotes.push(`${name}: ${line}`);
  const story = sections["their story"] ?? sections["its story"] ?? [];
  const why = sections["why this matters for cross-cultural understanding"] ?? sections["why this matters"] ?? [];
  draftNotes.push(`${name}, original "why this matters" (rewrite as a question for connectToWork): ${paragraphs(why).join(" ")}`);
  const base = {
    name,
    body: paragraphs(story),
    keyFacts: bullets(sections["key facts"] ?? []),
    connectToWork: "TODO: one question that links this story to a decision at work.",
    sources: sourcesFrom(sections.sources ?? []),
  };
  if (kind === "institution") {
    return { ...base, dates: match?.[2], type: meta.match(/\*\*Type:\*\*\s*([^|]+)/)?.[1]?.trim() ?? "TODO", location: meta.match(/\*\*Location:\*\*\s*(.+)$/)?.[1]?.trim() ?? "TODO" };
  }
  const connection = meta.match(/\*\*Connection:\*\*\s*(\w+)/)?.[1]?.toLowerCase();
  return {
    ...base, dates: match?.[2]?.replace(/–present/, "–").replace(/^(\d{4})–$/, "born $1") ?? "TODO",
    field: meta.match(/\*\*Field:\*\*\s*([^|]+)/)?.[1]?.trim() ?? "TODO",
    connection: connection === "minnesota" ? "minnesota" : connection === "both" ? "both" : connection === "national" ? "beyond" : "TODO",
    ...(photoFor(name) ? { photo: photoFor(name) } : {}),
  };
}

const topLevel = source => split(source, /^##\s+(.+)$/);
const isProfile = part => !/^(Editor|Overview|Verification)/.test(part.title);
const parts = [read(""), read("-expansion"), read("-disability")].flatMap(topLevel).filter(isProfile);
const people = parts.filter(part => !/^Institution:/.test(part.title)).map(part => profile(part, "person"));
const institutions = parts.filter(part => /^Institution:/.test(part.title)).map(part => profile(part, "institution"));

const disabilitySource = read("-disability");
const overview = topLevel(disabilitySource).find(part => /^Overview/.test(part.title))?.lines ?? [];
const overviewSections = sectionOf(overview);
const questions = bullets(overviewSections["practice considerations for staff"] ?? []);
const overviewSources = sourcesFrom(overviewSections.sources ?? []);
const contextHeadings = Object.keys(overviewSections).filter(key => !["practice considerations for staff", "sources", "verification status"].includes(key));
for (const line of bullets(overviewSections["verification status"] ?? [])) draftNotes.push(`Disability brief: ${line}`);

const orgSource = read("-orgs-media");
const entries = [];
const groupKinds = [[/^Community organizations/i, "organization", "minnesota"], [/^Media outlets/i, "media", "minnesota"], [/^National organizations/i, "organization", "national"], [/^National and international media/i, "media", "national"]];
for (const group of split(orgSource, /^##\s+(.+)$/)) {
  const kind = groupKinds.find(([pattern]) => pattern.test(group.title));
  if (!kind) continue;
  for (const item of split(group.lines.join("\n"), /^###\s+(.+)$/)) {
    const field = name => item.lines.find(line => line.startsWith(`- **${name}:**`))?.replace(`- **${name}:**`, "").trim() ?? "";
    const site = (field("Website") || field("Website or channel")).match(/https:\/\/\S+/)?.[0]?.replace(/[.,;)]+$/, "");
    const status = field("Status");
    if (/defunct|closed|unverified|believed|likely|confirm/i.test(status) || !site) draftNotes.push(`${item.title}: status "${status}", website "${field("Website") || field("Website or channel")}". Resolve this.`);
    entries.push({
      name: item.title.replace(/\s+—\s+national$/, ""), kind: kind[1], scope: kind[2],
      type: field("Type"), location: field("Location") || field("Based in") || "TODO",
      purpose: field("What it does") || field("Coverage") || "TODO",
      href: site ?? sourcesFrom([`- ${field("Sources").split(";")[0]}`])[0]?.href ?? "TODO",
      ...(site ? {} : { linkLabel: "TODO: name the reference page" }),
      checked: "TODO: date you opened the link",
    });
  }
}
const overviewOrg = topLevel(orgSource).find(part => /^Overview/.test(part.title))?.lines ?? [];
for (const source of [read(""), read("-expansion"), disabilitySource, orgSource]) {
  for (const part of topLevel(source)) {
    if (/^(Editor|Verification)/.test(part.title)) for (const line of bullets(part.lines)) draftNotes.push(`${part.title}: ${line}`);
  }
}

const draft = {
  communityId: id,
  draftNotes,
  people,
  institutions,
  disability: {
    intro: `TODO: say this is background for preparing questions and describes no person or family, and state the limits of the evidence. Original: ${overview.find(line => line.trim() && !line.startsWith("#")) ?? ""}`,
    questions,
    context: contextHeadings.map(key => ({ heading: `TODO: ${key}`, body: bullets(overviewSections[key]), sources: overviewSources })),
  },
  organizations: { intro: `TODO: ${paragraphs(overviewOrg).join(" ")}`, sources: [{ label: "TODO", href: "TODO" }], entries },
  about: { lastChecked: today, sources: [] },
};
const out = path.join(root, "community-profile-research", "drafts");
mkdirSync(out, { recursive: true });
const file = path.join(out, `${id}.draft.json`);
writeFileSync(file, `${JSON.stringify(draft, null, 2)}\n`);
console.log(`${file}\n${people.length} people, ${institutions.length} institutions, ${entries.length} directory entries, ${draftNotes.length} notes to resolve.`);

// Brings the Community 360 research into the application as plain data.
// Run again after the research changes:
//   node scripts/content/import-community-360.mjs ../one-dsd-pac-standalones/community-360-research
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const research = path.resolve(root, process.argv[2] ?? "../one-dsd-pac-standalones/community-360-research");
const SITE = "https://one-dsd-people-access-culture-production.up.railway.app";
const EXCLUDED = new Set(["native-american", "tribal-nations", "alaska-native"]);
const WIKI_LIKE = /https?:\/\/[^\s)]*(?:wiki|fandom\.com|kiddle\.co|dbpedia|infogalactic)[^\s)]*/gi;
const LANGUAGE_RULES = [
  [/\b(?:editor'?s notes?|verification status|this pass|second pass|third pass|search budget|fact-?check|research gap|unverified)\b/i, "research scaffolding"],
  [/\bnot (?:opened|fetched)\b|\bopened source/i, "research scaffolding"],
  [/\b(?:confirm with the owner|to be confirmed|needs? confirming)\b/i, "unresolved item"],
  [/\[\[|\bPENDING\b/, "unfinished marker"],
];

// Research wording stays in the research files; staff read it in plain language.
const plainWording = value => value
  .replace(/\bOpened sources?\b/g, match => match.endsWith("s") ? "Sources we could read" : "A source we could read")
  .replace(/\bNo opened source\b/g, "No source we could read")
  .replace(/\bno opened source\b/g, "no source we could read")
  .replace(/\b([Aa])n opened source\b/g, (_, a) => `${a} source we could read`)
  .replace(/\bopened sources?\b/g, match => match.endsWith("s") ? "sources we could read" : "source we could read");
const read = file => plainWording(readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n"));
const write = (file, value) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, `${JSON.stringify(value, null, 1)}\n`); };
const slug = value => value.toLowerCase().replace(/^\d+\.\s*/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const localize = value => value.split(`${SITE}/`).join("/").split(SITE).join("/");
const problems = [];

function audit(where, value) {
  for (const match of value.match(WIKI_LIKE) ?? []) problems.push(`${where}: wiki link ${match}`);
  for (const [rule, label] of LANGUAGE_RULES) {
    const found = value.match(rule);
    if (found) problems.push(`${where}: ${label}: "${found[0]}"`);
  }
}

/** Splits a document at its level-two headings. */
function sections(markdown) {
  const out = [];
  let current = null;
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^## (.+)$/);
    if (heading) { current = { id: slug(heading[1]), heading: heading[1].trim().replace(/^\d+\.\s*/, ""), body: [] }; out.push(current); }
    else if (current) current.body.push(line);
  }
  return out.map(item => ({ ...item, body: item.body.join("\n").trim() }));
}

const SOURCES = "sources";
const LIMITS = "what-could-not-be-established";

// Communities
const communityRoot = path.join(research, "communities");
const profileFolder = path.join(root, "lib", "content", "community-360");
rmSync(profileFolder, { recursive: true, force: true });
const titles = {};
const ids = readdirSync(communityRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).filter(id => !EXCLUDED.has(id)).sort();
for (const id of ids) {
  const folder = path.join(communityRoot, id);
  const markdown = read(path.join(folder, "profile.md"));
  const title = markdown.match(/^# (.+)$/m)?.[1]?.trim() ?? id;
  titles[id] = title;
  const parts = sections(markdown);
  const businesses = JSON.parse(read(path.join(folder, "businesses.json"))).map(item => ({
    name: item.name, type: item.type, place: item.neighborhoodOrCity, about: item.whatItIs,
    ...(typeof item.link === "string" && item.link.startsWith("http") ? { href: item.link } : {}), status: item.status,
  }));
  parts.forEach(part => { if (part.id !== SOURCES) audit(`${id}/${part.id}`, part.body); });
  write(path.join(profileFolder, `${id}.json`), {
    communityId: id, title,
    sections: parts.filter(part => part.id !== SOURCES && part.id !== LIMITS),
    limits: parts.find(part => part.id === LIMITS)?.body ?? "",
    sources: parts.find(part => part.id === SOURCES)?.body ?? "",
    businesses,
  });
}

// Calendar
const rawCalendar = JSON.parse(read(path.join(research, "calendar", "cultural-calendar.json")));
const rawEntries = Array.isArray(rawCalendar) ? rawCalendar : rawCalendar.entries;
const calendar = rawEntries.filter(entry => entry.communities.some(id => !EXCLUDED.has(id))).map(entry => ({
  id: entry.id, name: entry.name, alsoKnownAs: entry.alsoKnownAs ?? [], communities: entry.communities.filter(id => !EXCLUDED.has(id)),
  kind: entry.kind, capsule: entry.capsule ?? "", dateRule: entry.dateRule ?? "", dateCertainty: entry.dateCertainty,
  dates: (entry.dates ?? []).map(date => ({ year: date.year, date: date.date ?? null, endDate: date.endDate ?? null, confirmed: date.verified === true })),
  whatItMarks: entry.whatItMarks ?? "", howCelebrated: entry.howCelebratedInMinnesota ?? "",
  events: (entry.minnesotaEvents ?? []).map(event => ({ name: event.name, place: event.place ?? "", href: event.link ?? null, dates: event.organizerDates ?? "" })),
  workplaceNote: entry.workplaceNote ?? null,
  sources: (entry.sources ?? []).filter(source => source.url).map(source => ({ title: source.title, href: localize(source.url) })),
}));
for (const entry of calendar) audit(`calendar/${entry.id}`, [entry.capsule, entry.dateRule, entry.whatItMarks, entry.howCelebrated, entry.workplaceNote ?? ""].join("\n"));
write(path.join(root, "lib", "content", "cultural-calendar.json"), { titles, entries: calendar });

// Course and essay
const courseRoot = path.join(research, "cross-cutting", "minnesota-culture");
const modules = readdirSync(path.join(courseRoot, "course")).filter(name => /^module-\d+\.md$/.test(name)).sort().map((name, index) => {
  const markdown = read(path.join(courseRoot, "course", name));
  const [, front = "", body = markdown] = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  const field = key => front.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";
  audit(`course/${name}`, body);
  return { number: index + 1, slug: `module-${index + 1}`, title: field("title"), minutes: Number(field("minutes")) || 20, goal: field("goal"), body: body.trim() };
});
const essayParts = sections(read(path.join(courseRoot, "essay.md")));
essayParts.forEach(part => { if (part.id !== SOURCES) audit(`essay/${part.id}`, part.body); });
write(path.join(root, "lib", "content", "water-we-swim-in.json"), {
  title: "The Water We Swim In",
  modules,
  essay: {
    sections: essayParts.filter(part => part.id !== SOURCES && part.id !== LIMITS),
    limits: essayParts.find(part => part.id === LIMITS)?.body ?? "",
    sources: essayParts.find(part => part.id === SOURCES)?.body ?? "",
  },
});

const reportFile = process.argv[3];
if (reportFile) writeFileSync(reportFile, `${problems.join("\n")}\n`);
console.log(JSON.stringify({ communities: ids.length, calendarEntries: calendar.length, modules: modules.length, essaySections: essayParts.length, problems: problems.length, sourceFound: existsSync(research) }));

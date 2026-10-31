// Write the books that inform each self-directed course for the course player, from the reviewed reading links.
// Usage: node scripts/corpus/write-self-directed-readings.mjs
import fs from "node:fs";
const links = JSON.parse(fs.readFileSync("lib/content/reading-links.json", "utf8")).rows;
const titles = new Map(JSON.parse(fs.readFileSync("lib/content/reading-collection.json", "utf8")).map(b => [b.id, b.title]));
const out = {};
for (const [book, target, kind, , why] of links) {
  if (kind !== "r" || !target.startsWith("self-directed-")) continue;
  const number = target.slice("self-directed-".length);
  (out[number] ??= []).push({ id: book, title: titles.get(book) ?? book, why });
}
fs.writeFileSync("public/learning/self-directed/data/reading-links.json", JSON.stringify(out) + "\n");
console.log(`courses with books: ${Object.keys(out).length}; links: ${Object.values(out).flat().length}`);

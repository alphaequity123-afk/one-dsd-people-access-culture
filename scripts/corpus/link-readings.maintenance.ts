/**
 * Explicit maintenance build: connect every book in the reading collection to the courses, guided practices,
 * community briefs and library resources its ideas inform. Uses the same local sentence model as site search
 * (nothing leaves this computer), agreement on the shared theme vocabulary, and the curated course connections.
 * Writes lib/content/reading-links.json and a report. Run with the maintenance vitest config.
 */
import { it, expect } from "vitest";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import readings from "@/lib/content/reading-collection.json";
import organization from "@/lib/content/resource-organization-data.json";
import connections from "@/lib/content/reading-connections.json";
import communityData from "@/lib/content/community-design-data.json";
import { GRADUATION_PATHS } from "@/lib/content/paths";
import { loadStaffContentSnapshot } from "@/lib/content/staff-publications";
import { publishedCourses, courseSummary, courseText } from "@/lib/content/courses/published";
import { selfDirectedItems } from "@/lib/content/self-directed";

type Target = { id: string; kind: "resource" | "path" | "brief"; title: string; text: string; themes: string[] };
type Link = { book: string; target: string; kind: Target["kind"]; score: number; sharedThemes: string[]; basis: "curated" | "computed"; fallback?: boolean };

const clip = (s: string, n: number) => s.replace(/\s+/g, " ").trim().slice(0, n);

/**
 * Community groups. A community brief may link only to books about its own community group or to books that are
 * not about any one community, so a brief never borrows another people's story.
 */
const COMMUNITY_GROUPS: Array<{ group: string; briefs: string[]; words: RegExp }> = [
  { group: "native", briefs: ["tribal-nations", "native-american", "alaska-native"], words: /\b(Native American|American Indian|Indigenous|Ojibwe|Anishinaabe|Dakota|Lakota|Tribal|Tribes?|Alaska Native|Mni Sota|reservation)\b/i },
  { group: "black", briefs: ["african-american"], words: /\b(African American|Black Americans?|Black (?:women|men|people|families|communities|lives|history|freedom)|Jim Crow|slavery|Great Migration|civil rights movement)\b/i },
  { group: "latino", briefs: ["latino", "mexican", "colombian", "cuban", "ecuadorian", "guatemalan", "puerto-rican", "salvadoran"], words: /\b(Latin[oax]s?|Latine|Hispanic|Chican[oa]|Mexican|Puerto Ric|Cuban|Guatemalan|Salvadoran|Colombian|Ecuadorian)\b/i },
  { group: "hmong", briefs: ["hmong"], words: /\bHmong\b/i },
  { group: "somali", briefs: ["somali"], words: /\bSomali/i },
  { group: "karen", briefs: ["karen", "burmese"], words: /\b(Karen people|Karen refugees|Burm(a|ese)|Myanmar)\b/i },
  { group: "east-african", briefs: ["oromo", "ethiopian", "amharic", "kenyan"], words: /\b(Oromo|Ethiopia|Amharic|Kenya)/i },
  { group: "southeast-asian", briefs: ["khmer", "lao", "thai", "vietnamese", "filipino"], words: /\b(Cambodia|Khmer|Lao(s|tian)?|Thai(land)?|Vietnam|Filipin|Philippine)/i },
  { group: "east-asian", briefs: ["chinese", "japanese", "korean"], words: /\b(Chinese|Japanese|Korean|Asian American)\b/i },
  { group: "south-asian", briefs: ["indian"], words: /\b(South Asian|Indian American|Desi)\b/i },
  { group: "arab", briefs: ["arabic-speaking", "lebanese"], words: /\b(Arab|Lebanese|Muslim American)/i },
  { group: "west-african", briefs: ["liberian", "nigerian"], words: /\b(Liberia|Nigeria|West Africa)/i },
  { group: "european", briefs: ["european-american", "russian-speaking", "bosnian", "ukrainian", "french"], words: /\b(Bosnia|Ukrain|Russian|European American|Scandinavian)/i },
];
const groupsOf = (text: string) => new Set(COMMUNITY_GROUPS.filter(g => g.words.test(text)).map(g => g.group));
const briefGroup = (briefId: string) => COMMUNITY_GROUPS.find(g => g.briefs.includes(briefId))?.group;
const org = organization as Record<string, { title: string; themes?: string[] }>;

it("links every book to the work it informs", async () => {
  const snapshot = await loadStaffContentSnapshot({ scope: "dsd" });
  const targets: Target[] = [];
  const seenTargets = new Set<string>();
  for (const item of [...snapshot.items, ...selfDirectedItems()]) {
    if (item.status !== "approved" || seenTargets.has(item.id)) continue;
    seenTargets.add(item.id);
    targets.push({ id: item.id, kind: "resource", title: item.title, themes: org[item.id]?.themes ?? [],
      text: clip([item.title, item.summary, item.tags.join(" "), item.body.slice(0, 4).join(" ")].join("\n"), 1600) });
  }
  for (const { pack } of await publishedCourses("dsd")) {
    const id = `course-${pack.course.id}`;
    if (seenTargets.has(id)) continue;
    seenTargets.add(id);
    const lessons = pack.course.lessons.map(lesson => `${lesson.title}. ${courseText(lesson.summary ?? "")}`).join(" ");
    targets.push({ id, kind: "resource", title: pack.course.title, themes: org[id]?.themes ?? [],
      text: clip([pack.course.title, courseSummary(pack), lessons].join("\n"), 1600) });
  }
  for (const p of GRADUATION_PATHS) {
    targets.push({ id: p.id, kind: "path", title: p.title, themes: [],
      text: clip([p.title, p.staffLabel, p.signals.join(" "), p.steps.map(s => `${s.title}. ${s.guidance}`).join(" ")].join("\n"), 1600) });
  }
  for (const brief of communityData as Array<{ id: string; title: string; sections?: Array<{ heading?: string; body?: string }> }>) {
    targets.push({ id: brief.id, kind: "brief", title: brief.title, themes: ["identity", "partnership"],
      text: clip([brief.title, ...(brief.sections ?? []).slice(0, 3).map(s => `${s.heading ?? ""}. ${s.body ?? ""}`)].join("\n"), 1600) });
  }
  for (const t of targets) (t as Target & { groups?: Set<string> }).groups = t.kind === "brief" ? new Set([briefGroup(t.id)].filter(Boolean) as string[]) : groupsOf(t.title);
  const books = readings.map(book => ({ id: book.id, number: book.number, title: book.title, themes: book.themes as string[], groups: groupsOf([book.title, ...book.overview].join(" ")),
    text: clip([book.title, ...book.overview, ...book.mainPoints.slice(0, 5), ...book.relevance.slice(0, 1)].join("\n"), 1600) }));
  expect(targets.length).toBeGreaterThan(500);
  expect(books.length).toBeGreaterThan(150);

  const { env, pipeline } = await import("@huggingface/transformers");
  env.allowRemoteModels = false; env.allowLocalModels = true; env.useFSCache = false;
  const model = await pipeline("feature-extraction", path.join(process.cwd(), "models", "bge-small-en-v1.5"), { local_files_only: true, dtype: "q8", device: "cpu" });
  const embed = async (texts: string[]) => {
    const out: Float32Array[] = [];
    for (let i = 0; i < texts.length; i += 16) {
      const batch = texts.slice(i, i + 16);
      const result = await model(batch, { pooling: "cls", normalize: true });
      for (let j = 0; j < batch.length; j++) out.push(Float32Array.from(result.data.slice(j * 384, (j + 1) * 384) as Float32Array));
      if ((i / 16) % 10 === 0) console.log(`embedded ${Math.min(i + 16, texts.length)} of ${texts.length}`);
    }
    return out;
  };
  const targetVectors = await embed(targets.map(t => t.text));
  const bookVectors = await embed(books.map(b => b.text));
  const dot = (a: Float32Array, b: Float32Array) => { let s = 0; for (let i = 0; i < 384; i++) s += a[i] * b[i]; return s; };
  // A book about one community may link to work about that community or to general work, never to another community.
  const allowed = (book: { groups: Set<string> }, t: Target) => { const tg = (t as Target & { groups?: Set<string> }).groups ?? new Set<string>(); return !book.groups.size || !tg.size || [...book.groups].some(g => tg.has(g)); };
  const briefAllowed = (book: { groups: Set<string> }, t: Target) => t.kind !== "brief" || !book.groups.size || [...book.groups].some(g => (t as Target & { groups?: Set<string> }).groups?.has(g));

  const curated = new Map<number, Set<string>>();
  for (const c of connections as Array<{ book: number; course: string }>) curated.set(c.book, (curated.get(c.book) ?? new Set()).add(`course-${c.course}`));
  const links: Link[] = [];
  const perTarget = new Map<string, Link[]>();
  const unconnected: string[] = [];
  books.forEach((book, bi) => {
    const scored = targets.map((t, ti) => {
      const shared = book.themes.filter(theme => t.themes.includes(theme));
      return { t, shared, score: dot(bookVectors[bi], targetVectors[ti]) };
    }).filter(row => allowed(book, row.t) && briefAllowed(book, row.t)).sort((a, b) => b.score - a.score);
    const chosen = scored.filter(row => row.score >= 0.58 || (row.score >= 0.52 && row.shared.length)).slice(0, 6);
    // Every book should reach the work at least twice; take the two strongest if the thresholds left fewer.
    for (const row of scored.slice(0, 2)) if (!chosen.includes(row) && row.score >= 0.45 && chosen.length < 2) chosen.push(row);
    if (chosen.length < 2) unconnected.push(`${book.id} ${book.title} (best ${scored[0]?.score.toFixed(2)})`);
    for (const row of chosen) {
      const basis = curated.get(book.number)?.has(row.t.id) ? "curated" : "computed";
      links.push({ book: book.id, target: row.t.id, kind: row.t.kind, score: Math.round(row.score * 1000) / 1000, sharedThemes: row.shared, basis });
    }
    for (const id of curated.get(book.number) ?? []) if (!chosen.some(row => row.t.id === id) && targets.some(t => t.id === id)) {
      const row = scored.find(r => r.t.id === id)!;
      links.push({ book: book.id, target: id, kind: "resource", score: Math.round(row.score * 1000) / 1000, sharedThemes: row.shared, basis: "curated" });
    }
    // Reverse direction: the strongest books for each resource, so courses can point to books too.
    for (const row of scored.slice(0, 40)) if (row.score >= 0.52) {
      const list = perTarget.get(row.t.id) ?? []; list.push({ book: book.id, target: row.t.id, kind: row.t.kind, score: Math.round(row.score * 1000) / 1000, sharedThemes: row.shared, basis: "computed" }); perTarget.set(row.t.id, list);
    }
  });
  const seen = new Set(links.map(l => `${l.book}|${l.target}`));
  for (const list of perTarget.values()) for (const l of list.sort((a, b) => b.score - a.score).slice(0, 3)) if (!seen.has(`${l.book}|${l.target}`)) { seen.add(`${l.book}|${l.target}`); links.push(l); }
  // Every course, practice and brief gets its own closest books: at least two, preferring books that share a theme.
  const linksPerTarget = new Map<string, number>();
  for (const l of links) linksPerTarget.set(l.target, (linksPerTarget.get(l.target) ?? 0) + 1);
  targets.forEach((t, ti) => {
    const have = linksPerTarget.get(t.id) ?? 0;
    if (have >= 2) return;
    const ranked = books.map((book, bi) => ({ book, shared: book.themes.filter(theme => t.themes.includes(theme)), score: dot(bookVectors[bi], targetVectors[ti]) }))
      .filter(row => allowed(row.book, t) && briefAllowed(row.book, t))
      .sort((a, b) => (b.score + (b.shared.length ? 0.03 : 0)) - (a.score + (a.shared.length ? 0.03 : 0)));
    let added = have;
    for (const row of ranked) {
      if (added >= 2) break;
      if (seen.has(`${row.book.id}|${t.id}`)) continue;
      seen.add(`${row.book.id}|${t.id}`); added++;
      links.push({ book: row.book.id, target: t.id, kind: t.kind, score: Math.round(row.score * 1000) / 1000, sharedThemes: row.shared, basis: "computed", fallback: true });
    }
  });
  // Judging packets: each target with its twelve most plausible books (after the community rule), for review on meaning.
  const bookGist = new Map(readings.map(b => [b.id, clip([b.overview[0] ?? "", b.relevance[0] ?? ""].join(" "), 520)]));
  const packets = targets.map((t, ti) => ({ id: t.id, kind: t.kind, title: t.title, about: clip(t.text, 600),
    candidates: books.map((book, bi) => ({ book, score: dot(bookVectors[bi], targetVectors[ti]) }))
      .filter(row => allowed(row.book, t) && briefAllowed(row.book, t)).sort((a, b) => b.score - a.score).slice(0, 12)
      .map(row => ({ book: row.book.id, title: row.book.title, gist: bookGist.get(row.book.id), score: Math.round(row.score * 100) / 100 })) }));
  await mkdir("evidence/reading-links/packets", { recursive: true });
  const per = Math.ceil(packets.length / 8);
  for (let i = 0; i < 8; i++) await writeFile(`evidence/reading-links/packets/packet-${i + 1}.json`, JSON.stringify(packets.slice(i * per, (i + 1) * per), null, 1) + "\n");
  // Book-side packets: books the course-by-course review never reached get their fifteen most plausible courses.
  try {
    const orphans: string[] = JSON.parse(await (await import("node:fs/promises")).readFile("evidence/reading-links/orphan-books.json", "utf8"));
    const targetBrief = (t: Target) => ({ id: t.id, kind: t.kind, title: t.title, about: clip(t.text, 360) });
    const bookSide = orphans.map(id => {
      const bi = books.findIndex(b => b.id === id); if (bi < 0) return null;
      const book = books[bi];
      return { book: id, title: book.title, gist: bookGist.get(id),
        candidates: targets.map((t, ti) => ({ t, score: dot(bookVectors[bi], targetVectors[ti]) }))
          .filter(row => row.t.kind !== "brief" && allowed(book, row.t)).sort((a, b) => b.score - a.score).slice(0, 15).map(row => targetBrief(row.t)) };
    }).filter(Boolean);
    const half = Math.ceil(bookSide.length / 2);
    for (let i = 0; i < 2; i++) await writeFile(`evidence/reading-links/packets/books-${i + 1}.json`, JSON.stringify(bookSide.slice(i * half, (i + 1) * half), null, 1) + "\n");
  } catch { /* no orphan list yet */ }
  // Third-round packets: the books added for subjects the collection did not cover (disability practice, language, teams, communities).
  const gapBooks = new Set(readings.filter(r => (r as { curationStatus?: string }).curationStatus === "subject-gap-reading").map(r => r.id));
  if (gapBooks.size) {
    const round3 = targets.map((t, ti) => ({ id: t.id, kind: t.kind, title: t.title, about: clip(t.text, 600),
      candidates: books.map((book, bi) => ({ book, score: dot(bookVectors[bi], targetVectors[ti]) }))
        .filter(row => gapBooks.has(row.book.id) && allowed(row.book, t) && briefAllowed(row.book, t)).sort((a, b) => b.score - a.score).slice(0, 6)
        .map(row => row.book.id) }))
      .filter(p => p.kind !== "brief" && p.candidates.length);
    const shared = Object.fromEntries([...gapBooks].map(id => [id, { title: readings.find(r => r.id === id)!.title, gist: bookGist.get(id) }]));
    const per3 = Math.ceil(round3.length / 4);
    for (let i = 0; i < 4; i++) await writeFile(`evidence/reading-links/packets/round3-${i + 1}.json`, JSON.stringify({ books: shared, targets: round3.slice(i * per3, (i + 1) * per3) }, null, 1) + "\n");
  }
  // Second-round packets: only the community books added for the briefs, so they meet the courses they deepen.
  const added = new Set(readings.filter(r => (r as { curationStatus?: string }).curationStatus === "community-suggested-reading").map(r => r.id));
  if (added.size) {
    const round2 = targets.map((t, ti) => ({ id: t.id, kind: t.kind, title: t.title, about: clip(t.text, 600),
      candidates: books.map((book, bi) => ({ book, score: dot(bookVectors[bi], targetVectors[ti]) }))
        .filter(row => added.has(row.book.id) && allowed(row.book, t) && briefAllowed(row.book, t)).sort((a, b) => b.score - a.score).slice(0, 6)
        .map(row => ({ book: row.book.id, title: row.book.title, gist: bookGist.get(row.book.id), score: Math.round(row.score * 100) / 100 })) }))
      .filter(p => p.kind !== "brief" && p.candidates.length);
    const per2 = Math.ceil(round2.length / 4);
    for (let i = 0; i < 4; i++) await writeFile(`evidence/reading-links/packets/round2-${i + 1}.json`, JSON.stringify(round2.slice(i * per2, (i + 1) * per2), null, 1) + "\n");
  }
  // Review sheet: every brief and practice link, and every link added only for coverage.
  const bookTitle = new Map(books.map(b => [b.id, b.title])); const targetTitle = new Map(targets.map(t => [t.id, t.title]));
  await mkdir("evidence/reading-links", { recursive: true });
  const TAB = String.fromCharCode(9), NL = String.fromCharCode(10);
  await writeFile("evidence/reading-links/review.tsv", [["book", "book_title", "target", "kind", "target_title", "score", "basis"].join(TAB), ...links.filter(l => l.kind !== "resource" || l.fallback || l.score < 0.6).map(l => [l.book, bookTitle.get(l.book), l.target, l.kind, targetTitle.get(l.target), l.score, l.fallback ? "coverage" : l.basis].join(TAB))].join(NL) + NL);
  links.sort((a, b) => a.book.localeCompare(b.book) || b.score - a.score);
  const targetsLinked = new Set(links.map(l => l.target)).size;
  expect(targetsLinked).toBe(targets.length);
  const output = { generatedAt: new Date().toISOString(), model: "Xenova/bge-small-en-v1.5 (local)", books: books.length, targets: targets.length, links };
  // Compact rows keep the shipped file small: [book, target, kind r|p|b, similarity, curated 1|0].
  const kindCode = { resource: "r", path: "p", brief: "b" } as const;
  await writeFile("lib/content/reading-links.json", JSON.stringify({ books: books.length, targets: targets.length,
    rows: links.map(l => [l.book, l.target, kindCode[l.kind], Math.round(l.score * 100) / 100, l.basis === "curated" ? 1 : 0]) }) + "\n");
  await mkdir("evidence/reading-links", { recursive: true });
  await writeFile("evidence/reading-links/report.json", JSON.stringify({ at: output.generatedAt, books: books.length, targets: targets.length, links: links.length, targetsLinked, booksUnconnected: unconnected,
    byKind: links.reduce<Record<string, number>>((acc, l) => { acc[l.kind] = (acc[l.kind] ?? 0) + 1; return acc; }, {}) }, null, 2) + "\n");
  console.log(`links ${links.length}; targets reached ${targetsLinked} of ${targets.length}; books without two links: ${unconnected.length}`);
  expect(unconnected.length).toBe(0);
});

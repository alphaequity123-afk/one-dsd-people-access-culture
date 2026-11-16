/**
 * Character names used in earlier drafts. Owner's rule (2026-11-15): people in a course have no names; they are
 * described by role and played by the recurring cast.
 */
const CHARACTER_NAMES = /\b(?:Kim|Dale|Ines|Teresa|Odile|Paulo|Theo|Lidia|Rena|Kofi|Teo|Elena|Taylor|Hana|Nyra|Luca|Mireille|Sana|Morgan|Nuno|Corinne|Grace|Craig|Marisol|Mateo|Brent|Rita|Dana|Brett|Jill|Dara|Glen|Rowan|Joaquin|Simone|Paula|Jun|Avery|Remi|Amara|Alex|Jamie|Wren|Daniel|Wen|Tavi|Bea|Sage|Lee)\b/;

/** The owner's wording rules, checked on every piece of narration, on-screen text and feedback. */
export function wordingProblems(value: string, where: string): string[] {
  const problems: string[] = [];
  const name = value.match(CHARACTER_NAMES);
  if (name) problems.push(`${where}: character name "${name[0]}"; describe the person by role`);
  const outsideQuotes = value.replace(/["“][^"”]*["”]/g, " ");
  if (/\bAI\b|artificial intelligence|\btutor/i.test(value)) problems.push(`${where}: banned word (AI or tutor)`);
  if (/\b(?:DEI|DEIA|DEAI)\b/.test(value) || /Leading with DE/i.test(value)) problems.push(`${where}: DEI/DEIA/DEAI wording, or MMB Leading with DEIA, which is held aside`);
  if (/\b(?:responsible|appropriate|right|proper|designated|relevant) (?:[a-z-]+ ){0,2}offices?\b/i.test(value)) problems.push(`${where}: "office" for whoever is responsible (say "the person or area responsible")`);
  if (/\b(?:voluntary|optional|self-paced|self-directed|training credit|completion certificate|your progress is saved|is not saved|is recorded)\b/i.test(value)) problems.push(`${where}: system or participation language`);
  if (/\bcompliance\b/i.test(outsideQuotes)) problems.push(`${where}: "compliance" framing`);
  if (/\b(?:we|us|our|ours|ourselves)\b/i.test(outsideQuotes)) problems.push(`${where}: program voice ("we/us/our") outside quoted dialogue`);
  return problems;
}

/** Keys that hold ids, links and slugs rather than words a person reads. */
const NOT_WORDS = new Set(["id", "slug", "url", "next", "start", "version", "sources"]);

/** wordingProblems on every readable string in a training or simulation file, with the path of each. */
export function wordingProblemsIn(value: unknown, path = ""): string[] {
  if (typeof value === "string") return wordingProblems(value, path);
  if (Array.isArray(value)) return value.flatMap((v, i) => wordingProblemsIn(v, `${path}[${i}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => NOT_WORDS.has(k) ? [] : wordingProblemsIn(v, path ? `${path}.${k}` : k));
  return [];
}

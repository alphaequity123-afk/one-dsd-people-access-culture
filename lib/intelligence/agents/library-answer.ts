/**
 * The answer Ask gives from the library's own text when the written answer cannot be produced:
 * the passages that best match the question, composed without any model, with their sources.
 *
 * It needs no network, no database and no search service: when retrieval has already found passages they
 * are used; otherwise the library this application ships (the approved static resources) is searched here
 * by plain word matching. When nothing in the library matches, the answer points to the closest library
 * page and to the person or area responsible. Nothing here is recorded.
 */
import { staffCorpus } from "@/lib/content/staff-corpus";
import { AUTHORITY, type AuthorityLabel } from "@/lib/content/types";

export type LibraryPassage = { id: string; title: string; href: string; excerpt: string; authority: AuthorityLabel; authorityLabel: string; reviewDate: string };
export type LibraryAnswer = {
  shortAnswer: string;
  whyItMatters: string;
  sources: Array<LibraryPassage & { citeable: true }>;
  nextActions: Array<{ label: string; href: string }>;
  /** True when the library held matching text; false when the answer only points to the closest page. */
  matched: boolean;
};

const STOP = new Set(("a an and are as at be been but by can could do does did for from had has have how i if in into is it its may me might must my of on or our should so such than that the their them then there these they this those to us was we were what when where which while who whom why will with would you your yours about after again also any because before being between both each few more most other over same some still very just only own too can't don't isn't help please tell explain give need want know make get use using").split(" "));
const RESPONSIBLE = { label: "Find the right person", href: "/support/right-person" };
const LIBRARY = { label: "Open Resources", href: "/library" };

const stem = (word: string) => word.replace(/(?:ies)$/, "y").replace(/(?:ing|ed|es|s)$/, "") || word;
export function terms(text: string): string[] {
  return Array.from(new Set((text.toLowerCase().replace(/[’']/g, "").match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [])
    .filter(word => word.length > 2 && !STOP.has(word)).map(stem)));
}
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const sentences = (text: string) => (text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+(?:["”’)]+)?/g) ?? [])
  .map(sentence => sentence.trim()).filter(sentence => /^["“‘(]?[A-Z0-9]/.test(sentence) && words(sentence) >= 4);

type Indexed = LibraryPassage & { terms: Set<string>; titleTerms: Set<string> };
let indexed: Indexed[] | undefined;
function library(): Indexed[] {
  if (indexed) return indexed;
  indexed = staffCorpus().map(item => {
    const excerpt = [item.summary, item.whyItMatters ?? "", ...item.body].filter(Boolean).join(" ");
    return {
      id: item.id, title: item.title, href: `/library/${item.id}`, excerpt,
      authority: item.authority, authorityLabel: AUTHORITY[item.authority]?.label ?? "", reviewDate: item.reviewDate,
      terms: new Set(terms(`${item.title} ${excerpt} ${item.tags.join(" ")}`)), titleTerms: new Set(terms(item.title)),
    };
  });
  return indexed;
}

/** Plain word matching over the library this application ships. Returns the best matches and the closest page. */
export function searchLibrary(question: string, limit = 3): { matches: LibraryPassage[]; closest?: LibraryPassage } {
  const wanted = terms(question);
  if (!wanted.length) return { matches: [] };
  const scored = library().map(doc => {
    const hits = wanted.filter(term => doc.terms.has(term));
    const titleHits = wanted.filter(term => doc.titleTerms.has(term)).length;
    return { doc, hits: hits.length, score: hits.length + titleHits * 1.5 };
  }).filter(entry => entry.hits > 0).sort((a, b) => b.score - a.score);
  // A match needs most of the question's words, or at least two of them for a longer question: a single shared word is a coincidence.
  const enough = (hits: number) => hits >= Math.min(wanted.length, 2) && hits / wanted.length >= 0.4;
  const strip = ({ terms: _terms, titleTerms: _titles, ...passage }: Indexed): LibraryPassage => passage;
  return { matches: scored.filter(entry => enough(entry.hits)).slice(0, limit).map(entry => strip(entry.doc)), closest: scored[0] ? strip(scored[0].doc) : undefined };
}

/** The sentences of the passages that bear most on the question, in the order the passages give them. */
function chosenSentences(question: string, passages: LibraryPassage[], target = 70): string[] {
  const wanted = new Set(terms(question));
  const pool = passages.flatMap((passage, rank) => sentences(passage.excerpt).map((sentence, index) => {
    const overlap = terms(sentence).filter(term => wanted.has(term)).length;
    return { sentence, rank, index, score: overlap * 2 - rank - index * 0.1 };
  }));
  const picked: typeof pool = [];
  let count = 0;
  for (const entry of [...pool].sort((a, b) => b.score - a.score)) {
    if (count >= target || picked.length >= 5) break;
    if (picked.some(other => other.sentence === entry.sentence)) continue;
    picked.push(entry);
    count += words(entry.sentence);
  }
  return picked.sort((a, b) => a.rank - b.rank || a.index - b.index).map(entry => entry.sentence);
}

const quoteList = (titles: string[]) => titles.map(title => `"${title}"`).join(titles.length > 2 ? ", " : " and ");

/**
 * Compose the library answer. `found` are passages retrieval already found for this question (best first);
 * when there are none, the shipped library is searched here.
 */
export function composeLibraryAnswer(question: string, found: LibraryPassage[] = []): LibraryAnswer {
  const usable = found.filter(passage => passage.excerpt.trim().length >= 60 && /^\/(?!\/)/.test(passage.href));
  const local = usable.length ? { matches: usable.slice(0, 3), closest: usable[0] } : searchLibrary(question);
  const passages = local.matches;
  if (passages.length) {
    const lead = chosenSentences(question, passages);
    const used = passages.filter(passage => lead.some(sentence => passage.excerpt.replace(/\s+/g, " ").includes(sentence)));
    const cited = used.length ? used : passages.slice(0, 1);
    let shortAnswer = lead.join(" ");
    if (words(shortAnswer) < 25) shortAnswer = [shortAnswer, ...sentences(cited[0].excerpt).filter(sentence => !lead.includes(sentence))].join(" ").split(/(?<=[.!?])\s+/).slice(0, 5).join(" ");
    return {
      shortAnswer: shortAnswer.trim(),
      whyItMatters: `This comes from ${quoteList(cited.map(passage => passage.title))} in the program library, which give${cited.length === 1 ? "s" : ""} the full guidance and the conditions that go with it. Where a rule, a deadline or a decision in your own work is involved, the person or area responsible for that work confirms it.`,
      sources: cited.map(passage => ({ ...passage, citeable: true as const })),
      nextActions: [...cited.map(passage => ({ label: `Open ${passage.title}`, href: passage.href })), RESPONSIBLE],
      matched: true,
    };
  }
  const closest = local.closest;
  return {
    shortAnswer: closest
      ? `The program library does not answer this question directly. The closest page in it is "${closest.title}", linked below, which covers related ground: ${sentences(closest.excerpt)[0] ?? closest.title}`
      : "The program library does not answer this question directly; it holds practical guidance on access, language, engagement, workplace practice, hiring and equity analysis, all listed under Resources.",
    whyItMatters: "For a rule, a deadline or a decision that applies to your own work, the person or area responsible for that work is the one who can confirm it, and Find the right person shows who that is.",
    sources: [],
    nextActions: [closest ? { label: `Open ${closest.title}`, href: closest.href } : LIBRARY, RESPONSIBLE],
    matched: false,
  };
}

import { AUTHORITY, type AskIntent } from "@/lib/content/types";
import { normalizeAskPath, type AskPage } from "@/lib/ask/page-context";
import { searchDocs, searchExcerpt, type Doc, type SearchHit } from "./search";

/**
 * The page a person opened Ask from is a hint for finding sources, never a requirement.
 * Its own material is offered first when the question points at the page ("this page",
 * "this brief") or shares its subject; any other question is answered on its own terms.
 * Only the page's address is matched against the program's own published material. The
 * title the browser sent only helps choose the page's main entry; it is never written into
 * a prompt, so the name given to the writer is always the program's own title.
 */

// Words that point at what the person has open. "This course of action" is not a course.
const REFERS_TO_PAGE_SOURCE = String.raw`\b(?:this|current)\s+(?:page|web ?page|site page|screen|resource|reading|article|guide|brief|profile|community|module|lesson|course(?! of)|training|section|stage|topic|overview|tool|toolkit|document|policy|framework|standard|charter|story|podcast|episode|video|collection|list|map|calendar|path|pathway|checklist|job aid|worksheet|chart|table|data|report|summary)\b|\b(?:on|from|in)\s+here\b|\bwhat\s+(?:am\s+i|i'm|i\s+am)\s+(?:reading|looking\s+at|on)\b|^\s*(?:please\s+)?(?:summari[sz]e|explain|simplify)\s+(?:this|it)\s*[.?!]?\s*$`;
const REFERS_TO_PAGE = new RegExp(REFERS_TO_PAGE_SOURCE, "i");
const PAGE_WORDS = new RegExp(REFERS_TO_PAGE_SOURCE, "gi");

/** A question that only makes sense with the page in view. */
export function refersToOpenPage(question: string): boolean {
  return REFERS_TO_PAGE.test(question);
}

/** A question that shares enough of the page's subject for its material to come first, without naming the page. */
export const PAGE_MATCH_FLOOR = 6;

export type PageContextHint = {
  /** The page's own passages to offer first, best first. Empty when the page does not bear on the question. */
  hits: SearchHit[];
  /** The program's own name and address for the page, when its material is offered. */
  page?: { title: string; href: string };
  /** The question points at the page itself. */
  referred: boolean;
};

const NO_HINT: PageContextHint = { hits: [], referred: false };

function hitFor(doc: Doc, query: string): SearchHit {
  return {
    kind: doc.kind, id: doc.id, title: doc.title, href: doc.href,
    authority: doc.authority, authorityLabel: AUTHORITY[doc.authority].label,
    type: doc.type, layer: doc.layer, status: doc.status, reviewDate: doc.reviewDate, scope: doc.scope,
    excerpt: searchExcerpt(doc.text || doc.summary, query, doc.title), score: 0,
  };
}

export function pageContextHint(options: {
  page?: AskPage;
  /** The question as the person asked it. */
  question: string;
  /** The question with any earlier turn it continues, as used for retrieval. */
  retrievalQuestion: string;
  docs: Doc[];
  intents?: AskIntent[];
  limit?: number;
}): PageContextHint {
  const { page, question, retrievalQuestion, docs, intents } = options;
  if (!page) return NO_HINT;
  const onPage = docs.filter(doc => normalizeAskPath(doc.href) === page.path);
  if (!onPage.length) return NO_HINT;
  const referred = refersToOpenPage(question);
  const limit = Math.max(1, options.limit ?? 2);
  // Words that only point at the page ("this page") say nothing about which part of it the question is about.
  const matched = searchDocs(retrievalQuestion.replace(PAGE_WORDS, " "), onPage, { limit, intents });
  let hits = referred ? matched : matched.filter(hit => hit.score >= PAGE_MATCH_FLOOR);
  if (!hits.length && !referred) return { hits: [], referred };
  // The page's main entry: one published at exactly this address, the one whose title the reader sees.
  const exact = onPage.filter(doc => doc.href === page.path);
  const pool = exact.length ? exact : onPage;
  const mainId = searchDocs(page.title, pool, { limit: 1, rankOnly: true })[0]?.id;
  const main = pool.find(doc => doc.id === mainId) ?? pool.find(doc => doc.kind === "brief") ?? pool[0];
  // "Summarize this page" shares no words with the page, so its main entry stands for it.
  if (!hits.length) hits = [hitFor(main, page.title)];
  return { hits, page: { title: main.title, href: main.href }, referred };
}

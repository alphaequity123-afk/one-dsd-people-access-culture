import { searchDocs, tokens, type Doc, type SearchHit } from "./search";

/** Select a bounded, exact passage from the current page, near the requested subject. */
function pagePassage(text: string, query: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const wanted = new Set(tokens(query));
  const words = [...normalized.matchAll(/\S+/g)];
  let best = normalized.slice(0, 700), bestScore = -1;
  for (let start = 0; start < words.length; start++) {
    const offset = words[start].index!;
    const seen = new Set<string>();
    let end = offset;
    for (let i = start; i < words.length && words[i].index! + words[i][0].length - offset <= 700; i++) {
      for (const token of tokens(words[i][0])) if (wanted.has(token)) seen.add(token);
      end = words[i].index! + words[i][0].length;
    }
    if (seen.size > bestScore) { bestScore = seen.size; best = normalized.slice(offset, end); }
  }
  return best;
}

/** Focus every selected original PDF page, including paraphrased title matches. */
export function focusPdfPageHits(query: string, hits: SearchHit[], docs: Doc[]): SearchHit[] {
  const current = new Map(docs.map(doc => [doc.id, doc]));
  return hits.map(hit => {
    const doc = current.get(hit.id);
    if (!doc || doc.status !== "approved" || !/-pdf-page-\d+$/.test(doc.id) || !/\.pdf#page=\d+$/.test(doc.href)) return hit;
    const heading = new Set(tokens(doc.title + " cite citation original PDF page pages according"));
    const subject = tokens(query).filter(term => !heading.has(term)).join(" ") || query;
    return { ...hit, excerpt: pagePassage(doc.text, subject) };
  });
}

/** A named, currently published PDF takes precedence over generic workflow summaries. */
export function namedPdfPageHits(query: string, docs: Doc[], limit = 5): SearchHit[] {
  const terms = new Set(tokens(query));
  const parents = docs.filter(doc => {
    const title = tokens(doc.title);
    return !/-pdf-page-\d+$/.test(doc.id) && doc.status === "approved"
      && title.length > 1 && title.every(term => terms.has(term))
      && docs.some(page => page.id.startsWith(doc.id + "-pdf-page-") && /\.pdf#page=\d+$/.test(page.href));
  });
  if (!parents.length) return [];
  const navigation = new Set(tokens("cite citation original PDF page pages according"));
  for (const parent of parents) for (const term of tokens(parent.title)) navigation.add(term);
  const subject = tokens(query).filter(term => !navigation.has(term)).join(" ") || query;
  const subjectTerms = new Set(tokens(subject));
  const namedPages = docs.filter(doc => parents.some(parent => doc.id.startsWith(parent.id + "-pdf-page-")) && doc.status === "approved");
  const pageTerms = new Map(namedPages.map(doc => [doc.id, new Set(tokens(doc.text))]));
  const frequency = new Map([...subjectTerms].map(term => [term, namedPages.filter(doc => pageTerms.get(doc.id)!.has(term)).length]));
  const groups = parents.map(parent => {
    const pages = docs.filter(doc => doc.status === "approved" && doc.id.startsWith(parent.id + "-pdf-page-") && /\.pdf#page=\d+$/.test(doc.href));
    const byId = new Map(pages.map(doc => [doc.id, doc]));
    // Score page bodies, not repeated resource titles/tags. Rare requested subjects
    // such as childcare must outweigh generic "planning" or the PDF's own title.
    return searchDocs(query, pages, { limit: pages.length }).map(hit => ({ ...hit,
      score: [...subjectTerms].reduce((score, term) => score + (pageTerms.get(hit.id)!.has(term) ? Math.log(1 + (namedPages.length + 1) / (frequency.get(term)! + 1)) : 0), 0),
    })).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
      .map(hit => ({ ...hit, excerpt: pagePassage(byId.get(hit.id)!.text, subject) }));
  });
  // Retain evidence from each named document before filling remaining space by rank.
  return Array.from({ length: limit }, (_, rank) => groups.flatMap(group => group[rank] ? [group[rank]] : [])).flat().slice(0, limit);
}

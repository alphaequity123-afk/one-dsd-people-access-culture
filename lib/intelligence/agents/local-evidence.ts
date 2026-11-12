import { tokens } from "../retrieval/search";

type Passage = { title: string; excerpt: string };

/**
 * Whether the program's own passages plausibly answer the question. Outside research waits for this,
 * so a question the program already answers is not held up by a web search.
 */
export function assessLocalEvidence(question: string, passages: Passage[]): 'absent' | 'insufficient' | 'potentially_sufficient' {
  if (!passages.length) return 'absent';
  const terms = [...new Set(tokens(question))].filter(term => !['explain', 'describe', 'give', 'help', 'please', 'application', 'program', 'resource', 'material', 'using', 'only'].includes(term));
  const useful = passages.filter(passage => passage.excerpt.trim().length >= 60);
  if (!useful.length || !terms.length) return 'insufficient';
  const evidenceTerms = new Set(tokens(useful.map(passage => passage.title + ' ' + passage.excerpt).join(' ')));
  const coverage = terms.filter(term => evidenceTerms.has(term)).length / terms.length;
  // A generic matched page cannot establish the missing parts of a multi-part question.
  return coverage >= .65 ? 'potentially_sufficient' : 'insufficient';
}

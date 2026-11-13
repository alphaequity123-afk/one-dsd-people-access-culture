import "server-only";

import { z } from "zod";
import { asksToAvoidWebResearch } from "../research-preference";
import { externalResearchGate } from "../safety";
import { externalSource, isExcludedResearchUrl, plainText, type ExternalSource, type ResearchProvider } from "./providers";

const SEARCH_ENDPOINT = "https://api.consensus.app/v1/search";
const PAGE_SIZE = 6;
const QUERY_LIMIT = 400;
const ABSTRACT_LIMIT = 800;

export const CONSENSUS_EVIDENCE_NOTE =
  "These links point to research papers. This answer draws on available abstracts, which give a limited view of study methods and findings. The papers offer research context for decisions governed by Department of Human Services policy.";

const paperSearch = /\b(?:peer[- ]reviewed|published (?:research|studies|papers)|research evidence|scientific evidence|academic (?:research|studies|papers|literature)|(?:systematic|scoping) reviews?|meta[- ]analys(?:is|es))\b/i;
const studySearch = /\b(?:find|search|cite|compare|summari[sz]e|review|what (?:does|do)|which)\s+(?:for\s+)?(?:(?:the|some|relevant|recent|current|best|existing|available|scientific|empirical|published|scholarly|research|[0-9]+)\s+){0,6}(?:studies|papers|research literature)\b/i;
const namedSearch = /\b(?:search(?: with| in| on)?|consult|try|check|look up (?:in|with)|find (?:in|with|using))\s+consensus(?:\.app)?\b|\b(?:use|using)\s+consensus\.app\b|^\s*consensus(?:\.app)?\s*:/i;
const namedExclusion = /\b(?:without|do not|don['’]t|never)\b[^.!?\n]{0,35}\b(?:use|using|search|searching|consult|consulting)\b[^.!?\n]{0,20}\bconsensus(?:\.app)?\b/i;

export function asksForScholarlyResearch(question: string): boolean {
  return !asksToAvoidWebResearch(question) && !namedExclusion.test(question)
    && (namedSearch.test(question) || /\b(?:[Uu]se|[Uu]sing)\s+Consensus\b/.test(question) || paperSearch.test(question) || studySearch.test(question));
}

export function consensusQuery(question: string): string {
  // Check the entire request before any shortening so private context cannot
  // bypass the gate. Only the current public question goes to the paper index.
  if (!externalResearchGate(question).ok || /\b(?:my name is|you can reach me|my home address is|(?:my|our|this)\s+(?:client|patient|participant|recipient|employee|coworker|colleague|caseworker)\b)\b/i.test(question)) {
    throw new Error("research_consensus_private_query");
  }
  const query = question
    .replace(/^\s*(?:please\s+)?(?:consensus(?:\.app)?\s*:\s*|(?:(?:use|using|search(?: with| in| on)?|consult|check)\s+(?:the\s+)?consensus(?:\.app)?\s*(?:to\s+|for\s+|:\s*)?))/i, "")
    .replace(/https?:\/\/[^\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const prefix = query.slice(0, QUERY_LIMIT);
  const bounded = query.length > QUERY_LIMIT ? (prefix.replace(/\s+\S*$/, "") || prefix) : query;
  if (!bounded || !externalResearchGate(bounded).ok) throw new Error("research_consensus_private_query");
  return bounded;
}

const Paper = z.object({
  title: z.string().max(1_000),
  authors: z.array(z.string().max(200)).nullish(),
  journal_name: z.string().max(300).nullish(),
  publish_year: z.number().int().min(1500).max(2200).nullish(),
  publish_date: z.string().max(32).nullish(),
  doi: z.string().max(300).nullish(),
  url: z.string().max(1_200).nullish(),
  abstract: z.string().max(30_000).nullish(),
  is_preprint: z.boolean().nullish(),
});

type PaperSearch = { source: ExternalSource; context: string };

const CONSENSUS_PAPER_URL = /^https:\/\/consensus\.app\/papers\/[a-z0-9-]+\/[a-f0-9]{32}\/?$/i;

function doiUrl(doi: string | null | undefined): string | undefined {
  const value = doi?.trim();
  if (!value || !/^10\.\d{4,9}\/[A-Z0-9._;()/+:\-]+$/i.test(value)
    || value.split("/").some(segment => segment === "." || segment === "..")) return undefined;
  return `https://doi.org/${value}`;
}

function safeExcerpt(text: string, limit: number): string {
  return plainText(text)
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\[\d+(?:[ ,;]+\d+)*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit)
    .trim();
}

function recentEnough(paper: z.infer<typeof Paper>, since?: string): boolean {
  if (!since) return true;
  if (paper.publish_date && /^\d{4}-\d{2}-\d{2}$/.test(paper.publish_date)) return paper.publish_date >= since;
  return (paper.publish_year ?? 0) > Number(since.slice(0, 4));
}

function searchResults(payload: unknown, allowedDomains: string[], since?: string): PaperSearch[] {
  const envelope = z.object({ results: z.array(z.unknown()).max(100) }).safeParse(payload);
  if (!envelope.success) throw new Error("research_consensus_invalid_response");
  const seen = new Set<string>();
  const papers: PaperSearch[] = [];
  for (const raw of envelope.data.results.slice(0, PAGE_SIZE)) {
    const parsed = Paper.safeParse(raw);
    if (!parsed.success || parsed.data.is_preprint === true || !recentEnough(parsed.data, since)) continue;
    const paper = parsed.data;
    const title = safeExcerpt(paper.title, 300);
    const journal = safeExcerpt(paper.journal_name ?? "", 160);
    const author = safeExcerpt(paper.authors?.[0] ?? "", 100);
    const abstract = safeExcerpt(paper.abstract ?? "", ABSTRACT_LIMIT);
    if (!title || !journal || !author || !paper.publish_year) continue;
    if (paper.url && isExcludedResearchUrl(paper.url)) continue;

    const candidates = [doiUrl(paper.doi), paper.url && CONSENSUS_PAPER_URL.test(paper.url) ? paper.url : undefined];
    const source = candidates.filter((url): url is string => !!url).map(url =>
      externalSource({ url, title, date: String(paper.publish_year) }, allowedDomains)).find(Boolean);
    const key = (doiUrl(paper.doi) ?? source?.url)?.toLowerCase();
    if (!source || !key || seen.has(key)) continue;
    seen.add(key);
    const context = `${author}${(paper.authors?.length ?? 0) > 1 ? " and colleagues" : ""}, ${journal} (${paper.publish_year})`;
    source.snippet = abstract ? `${context}. Abstract excerpt: ${abstract}` : `${context}. Bibliographic record only. No abstract was available.`;
    papers.push({ source, context });
  }
  return papers;
}

let nextSearchAt = 0;
function configuredKey(): string | undefined {
  return process.env.CONSENSUS_API_KEY?.trim() || undefined;
}

export const consensusResearchProvider: ResearchProvider = {
  id: "consensus",
  configured: () => Boolean(configuredKey()),
  modelFor: () => "consensus-search",
  async run(request, fetcher = fetch) {
    const key = configuredKey();
    if (!key) throw new Error("research_consensus_not_configured");
    if (asksToAvoidWebResearch(request.question)) throw new Error("research_source_only");
    const query = consensusQuery(request.question);
    const endpoint = new URL(SEARCH_ENDPOINT);
    endpoint.searchParams.set("query", query);
    endpoint.searchParams.set("page_size", String(PAGE_SIZE));
    endpoint.searchParams.set("exclude_preprints", "true");
    endpoint.searchParams.set("include_full_text_chunks", "false");
    const searchedAt = new Date();
    let since: string | undefined;
    if (request.recency !== "any") {
      const minimum = new Date(searchedAt);
      if (request.recency === "year") minimum.setUTCFullYear(minimum.getUTCFullYear() - 1);
      else minimum.setUTCDate(minimum.getUTCDate() - (request.recency === "week" ? 7 : 30));
      since = minimum.toISOString().slice(0, 10);
      endpoint.searchParams.set("year_min", since.slice(0, 4));
      endpoint.searchParams.set("month_min", String(Number(since.slice(5, 7))));
    }

    // The upstream account allows one search per second across clients.
    if (Date.now() < nextSearchAt) throw new Error("research_consensus_rate_limited");
    nextSearchAt = Date.now() + 1_000;
    let response: Response;
    try {
      response = await fetcher(endpoint, {
        method: "GET",
        headers: { "x-api-key": key, accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      // A networking error can include the request URL (and the question).
      throw new Error(error instanceof Error && error.name === "TimeoutError" ? "research_consensus_timeout" : "research_consensus_unavailable");
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      if (response.status === 429) {
        throw new Error(response.headers.has("retry-after") ? "research_consensus_rate_limited" : "research_consensus_quota");
      }
      throw new Error(`research_consensus_http_${response.status}`);
    }
    const payload: unknown = await response.json().catch(() => { throw new Error("research_consensus_invalid_response"); });
    const papers = searchResults(payload, request.allowed_domains, since);
    if (!papers.length) throw new Error("research_consensus_no_papers");
    const sources = papers.map(paper => paper.source);
    const answer = [
      "The paper search returned the following research records. The available evidence is limited to abstracts and publication details.",
      ...papers.map(({ source, context }, index) => `${source.title}. ${context}. [${index + 1}]`),
    ].join("\n\n");
    return {
      provider: "consensus",
      model: "consensus-search",
      depth: request.depth,
      answer,
      sources,
      searchedAt: searchedAt.toISOString(),
      usage: { search_queries: 1, tool_calls: 1 },
      estimated_usd: 0,
    };
  },
};

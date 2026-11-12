import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Doc } from "./search";
import { hybridSearchHits, scoreDoc, searchDocs, searchExcerpt } from "./search";
import { citationEvidenceFromDocs } from "./evidence";
import { indexedStaffDocs } from "./staff-search";
import { indexedProgramResources, publicProjectionAuditId } from "./program-resources";
import { organizationalBrief, organizationalDocs } from "../memory/organization";

// The end-to-end checks run the real Ask route logic over the real public index with
// only the model adapter, outside research and semantic search replaced. Semantic search
// returning nothing mirrors production whenever the vector projection is stale.
const f = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _name: string, fn: () => unknown) => fn(), auditRefusal: async () => {} }));
vi.mock("../clone/jev", () => ({ planWithJev: async () => null, SPECIALIST_GUIDANCE: {} }));
vi.mock("./local-semantic", () => ({ semanticRetrieveForAgent: async () => [], SemanticSearchUnavailable: class extends Error {} }));
vi.mock("../providers", () => ({ resolveBinding: () => ({ generative: true, model: { model_id: "synthetic-equity-data" }, adapter: { complete: f.complete } }) }));
vi.mock("../research", () => ({
  governedResearch: async () => ({ status: "failed", error_code: "research_timeout", message: "Outside research could not finish." }),
  governedSearch: async () => { throw new Error("Unexpected ranked search"); },
}));
import { askConcierge, classifyIntent } from "../agents/ask";
import { getAgent } from "../registry/agents";

const equityId = (page: string) => publicProjectionAuditId(`public-equity-data-${page}`);
/** Each question, the document that answers it, and the figure its passage must show. */
const CASES = [
  { question: "In fiscal year 2024, how many Black or African American adults on a waiver used Employment Support Services, Group, and what was the risk ratio?",
    page: "service-adults-ess-group-2024", figure: "Black or African American, fiscal year 2024: 125 people used Employment Support Services, Group. Risk ratio 0.19", first: true },
  { question: "What was the risk ratio for Hispanic or Latino youth using Vocational Rehabilitation Services in fiscal year 2022?",
    page: "service-youth-vrs-ssb-2022", figure: "Hispanic or Latino, fiscal year 2022: 84 people used Vocational Rehabilitation Services or State Services for the Blind. Risk ratio 1.39", first: true },
  { question: "How many White adults on a waiver had no reported income in fiscal year 2023?",
    page: "income-adults", figure: "Fiscal year 2023, White (44,672 people): 26,613 had no reported income (60 out of every 100)", first: false },
  { question: "What were first-year earnings after exit for people on a waiver who left Vocational Rehabilitation Services?",
    page: "vocational-rehabilitation-exit-income", figure: "$9,622 on average for people on a waiver", first: true },
  { question: "Which service had the lowest risk ratio for Asian or Pacific Islander adults in fiscal year 2024?",
    page: "service-access-adults-2024", figure: "Asian or Pacific Islander, fiscal year 2024: compared with everyone else, least likely to use Prevocational Services (risk ratio 0.43)", first: false },
];

/** The same document set the Ask route searches for a One DSD question. */
async function askDocs(question: string): Promise<Doc[]> {
  const organization = organizationalBrief(question);
  return [
    ...organizationalDocs().filter(doc => organization.entries.some(entry => entry.id === doc.id)),
    ...(await indexedStaffDocs("dsd")).filter(doc => doc.kind !== "brief"),
    ...(await indexedProgramResources("dsd")).destinations,
  ];
}

describe("excerpt selection for line-structured data", () => {
  const title = "Employment Support Services, Group: who used it, age 22 to 64, fiscal year 2024";
  const text = [title,
    "In fiscal year 2024, 2,721 people on a disability waiver, age 22 to 64, used Employment Support Services, Group. Counts and risk ratios by race and ethnicity.",
    "American Indian or Alaska Native, fiscal year 2024: 48 people used Employment Support Services, Group. Risk ratio 0.68: 32% less likely than everyone else.",
    "Asian or Pacific Islander, fiscal year 2024: 48 people used Employment Support Services, Group. Risk ratio 0.46: 54% less likely than everyone else.",
    "Black or African American, fiscal year 2024: 125 people used Employment Support Services, Group. Risk ratio 0.19: 81% less likely than everyone else.",
    "Hispanic or Latino, fiscal year 2024: 51 people used Employment Support Services, Group. Risk ratio 0.66: 34% less likely than everyone else.",
    "White, fiscal year 2024: 2,412 people used Employment Support Services, Group. Risk ratio 3.85: 3.9 times as likely as everyone else.",
  ].join("\n");
  it("shows the line naming the requested group and year, not the first lines that share the title's words", () => {
    const excerpt = searchExcerpt(text, CASES[0].question, title);
    expect(excerpt).toContain("Black or African American, fiscal year 2024: 125 people used Employment Support Services, Group. Risk ratio 0.19");
    expect(searchExcerpt(text, "What was the risk ratio for White people using Employment Support Services, Group, in fiscal year 2024?", title))
      .toContain("White, fiscal year 2024: 2,412 people");
  });
  it("counts only the words that remain after the passage is cut at a sentence boundary", () => {
    const filler = "Background sentence about services. ".repeat(9);
    const body = `Opening. ${filler}Finding: the distinctive remedy is accessible invitations. ${"More background about services. ".repeat(12)}`;
    const excerpt = searchExcerpt(body, "distinctive remedy accessible invitations", "");
    expect(excerpt).toContain("distinctive remedy is accessible invitations");
  });
  it("keeps short text whole and the earliest passage when nothing distinguishes the candidates", () => {
    expect(searchExcerpt("A short note.", "note", "A short note")).toBe("A short note.");
    const plain = "First sentence of a long document. ".repeat(20);
    expect(searchExcerpt(plain, "unrelated words", "Title")).toMatch(/^First sentence/);
  });
});

describe("naming a community does not name every research entry on its page", () => {
  const base: Doc = { kind: "brief", id: "x", title: "Latino and Hispanic Minnesotans", href: "/minnesota-communities/latino", authority: "community_brief", type: "community_brief", status: "approved", reviewDate: "", scope: "dsd", summary: "", text: "Latino and Hispanic Minnesotans community page.", tags: [], intents: [] };
  it("boosts the community brief, not entries that only share its link", () => {
    const question = "What was the risk ratio for Hispanic or Latino youth using Vocational Rehabilitation Services in fiscal year 2022?";
    const brief = scoreDoc(question, base);
    const research = scoreDoc(question, { ...base, id: "y", type: "community_research", title: "Latino and Hispanic Minnesotans: National Hispanic Media Coalition" });
    expect(brief).toBeGreaterThan(20);
    expect(research).toBeLessThan(20);
  });
});

describe("per-year equity data questions reach the exact figure", () => {
  for (const { question, page, figure, first } of CASES) {
    it(`retrieves ${page} with its figure for: ${question}`, async () => {
      const docs = await askDocs(question);
      const { all } = classifyIntent(question);
      const keyword = searchDocs(question, docs, { limit: 5, intents: all });
      const ids = keyword.map(hit => hit.id);
      expect(ids, ids.join(", ")).toContain(equityId(page));
      if (first) expect(ids[0]).toBe(equityId(page));
      const citations = citationEvidenceFromDocs(hybridSearchHits([], keyword, 10).slice(0, 5), docs);
      const citation = citations.find(source => source.id === equityId(page))!;
      expect(citation.excerpt).toContain(figure);
      expect(citation.evidence?.excerpt.quote).toContain(figure);
    }, 300000);
  }
});

describe("Ask hands the generator the passage with the figure", () => {
  const ctx = () => ({ agent: getAgent("ask_concierge"), role: "staff" as const, dry_run: false, trace_id: "27ee20cc-5384-4e66-af31-9e3ae7e07922" });
  type Source = { id: string; title: string; excerpt: string; href: string; ref?: string };
  let prompts: Array<{ question: string; programSources: Source[] }>;
  let expected = "";
  beforeEach(() => {
    prompts = [];
    vi.stubEnv("PAC_CLONE_AGENTS", "off"); vi.stubEnv("PAC_STORE", "memory"); vi.stubEnv("PAC_CONTENT_SOURCE", "static");
    // The synthetic model quotes the expected source exactly, as a grounded answer would.
    f.complete.mockImplementation(async (request: { user: string }) => {
      const payload = JSON.parse(request.user);
      prompts.push(payload);
      const source = payload.programSources.find((row: Source) => row.id === expected);
      const evidenceClaims = source?.ref ? [{ text: source.excerpt, refs: [source.ref] }] : [];
      return { parsed: { shortAnswer: "Answer drafted from the supplied sources.", whyItMatters: "", limits: [], resourceHrefs: [], evidenceClaims } };
    });
  });
  afterEach(() => { vi.unstubAllEnvs(); f.complete.mockReset(); });
  for (const { question, page, figure } of CASES) {
    it(`supplies ${page} for: ${question}`, async () => {
      expected = equityId(page);
      const result = await askConcierge({ question, contextPreference: "one_dsd" }, ctx());
      expect(result.kind).toBe("answer");
      const source = prompts.at(-1)?.programSources.find(row => row.id === expected);
      expect(source?.href).toBe("/data/equity-baseline/goal/1");
      expect(source?.excerpt).toContain(figure);
      if (result.kind === "answer") {
        expect(result.answer.generative).toBe(true);
        expect(result.answer.sources.map(row => row.id)).toContain(expected);
        expect(result.answer.evidenceClaims?.[0]?.text).toContain(figure);
      }
    }, 300000);
  }
});

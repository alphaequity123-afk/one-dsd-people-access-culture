import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { searchExcerpt, tokens } from "./search";
import { indexedStaffDocs } from "./staff-search";
import { indexedProgramResources } from "./program-resources";
import { agencyDocs } from "@/lib/search/site-search";
import { statePageDocs } from "@/lib/search/state-pages";

/** The passage chooser as it was before it was made faster. The faster one must choose exactly the same passages. */
function excerptWindowBefore(clean: string, start: number): string {
  const normalized = clean.slice(start);
  if (normalized.length <= 360) return normalized;
  const window = normalized.slice(0, 361);
  const sentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
  const wordEnd = window.lastIndexOf(" ");
  const end = sentenceEnd >= 160 ? sentenceEnd + 1 : wordEnd >= 160 ? wordEnd : 360;
  return window.slice(0, end).trim();
}
function searchExcerptBefore(text: string, query: string, title = ""): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 360) return clean;
  const terms = new Set(tokens(query));
  const titled = new Set(tokens(title));
  const lower = clean.toLowerCase();
  const starts = new Set([0]);
  for (const term of terms) {
    let from = 0;
    for (let count = 0; count < 40; count++) {
      const index = lower.indexOf(term, from);
      if (index < 0) break;
      starts.add(Math.max(0, index - 60)); from = index + term.length;
    }
  }
  let start = 0, bestSpecific = -1, bestTotal = -1;
  for (const candidate of starts) {
    const found = new Set(tokens(excerptWindowBefore(clean, candidate)));
    const matched = [...terms].filter(term => found.has(term));
    const specific = matched.filter(term => !titled.has(term)).length;
    if (specific > bestSpecific || (specific === bestSpecific && matched.length > bestTotal)) {
      start = candidate; bestSpecific = specific; bestTotal = matched.length;
    }
  }
  const passage = excerptWindowBefore(clean, start);
  const truncated = passage.length < clean.length - start;
  return `${start > 0 ? "..." : ""}${passage}${truncated ? "..." : ""}`;
}

const QUERIES = [
  "Two people on my team keep clashing in meetings. What can I try this week?",
  "How do I write a notice in plain language for people who use interpreters?",
  "What is the IDI continuum and where does Minimization fit?",
  "In fiscal year 2024, how many Black or African American adults on a waiver used employment services?",
  "accessible meeting captions interpretation hybrid participation",
  "supervisor feedback coaching performance conversation fairness",
  "community engagement listening session compensation childcare transportation",
  "language access vital documents translation Somali Hmong Spanish",
  "equity analysis toolkit decision alternatives burden",
  "leadership styles servant democratic visible assignments",
  "the of and a",
  "",
];

describe("choosing the passage to show", () => {
  it("chooses exactly the passage it chose before, for every document in the library", async () => {
    vi.stubEnv("PAC_STORE", "memory"); vi.stubEnv("PAC_CONTENT_SOURCE", "static");
    const docs = [...await indexedStaffDocs("dsd"), ...(await indexedProgramResources("dsd")).destinations, ...agencyDocs({ forAnswers: true }), ...statePageDocs().slice(0, 400)];
    expect(docs.length).toBeGreaterThan(1000);
    let compared = 0;
    for (const doc of docs) {
      for (const query of QUERIES) {
        const text = doc.text || doc.summary;
        const expected = searchExcerptBefore(text, query, doc.title);
        expect(searchExcerpt(text, query, doc.title), `${doc.id} :: ${query.slice(0, 40)}`).toBe(expected);
        compared += 1;
      }
    }
    expect(compared).toBe(docs.length * QUERIES.length);
    vi.unstubAllEnvs();
  }, 600000);

  it("handles cut-off words, punctuation, capitals and unusual characters the same way", () => {
    const filler = "The program supports people across Minnesota in many ways. ";
    const texts = [
      filler.repeat(8) + "Accessible meetings need captions; ACCESSIBILITY isn't optional — it's planned. " + filler.repeat(8) + "Interpreters' schedules matter.",
      "İstanbul and KELVIN K units appear here. " + filler.repeat(10) + "Meetings in İzmir were accessible to everyone who attended the session.",
      filler.repeat(3) + "x".repeat(500) + " meeting " + "y".repeat(500) + " accessible. " + filler.repeat(5),
      "Short text about meetings.",
      "   \n\n" + filler.repeat(7) + "\n\nMeetings?   Yes!   Accessible meetings.\n" + filler.repeat(7),
    ];
    for (const text of texts) for (const query of ["accessible meetings", "interpreters schedules", "kelvin units izmir", "nothing matches zzz"]) for (const title of ["", "Accessible meetings guide"]) {
      expect(searchExcerpt(text, query, title)).toBe(searchExcerptBefore(text, query, title));
    }
  });
});

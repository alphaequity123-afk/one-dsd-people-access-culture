import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GLOSSARY, GOALS, measures } from "@/lib/content/data/equity-baseline";
import EquityBaselinePage from "./page";
import EquityGoalPage from "./goal/[number]/page";
import EquityGlossaryPage from "./glossary/page";
import { resetStoreForTests } from "@/lib/intelligence/memory/store";
import { REVIEW_COUNT_OFF } from "./review-count-section";
import { passageGrade } from "@/lib/content/readability";
import { TUTOR_SIGNALS_COPY } from "./tutor-signals-section";

vi.mock("@/lib/auth/leaders-access", () => ({ leadersAllowed: async () => true }));
vi.mock("next/navigation", async original => ({ ...await original<typeof import("next/navigation")>(), usePathname: () => "/data/equity-baseline", notFound: () => { throw new Error("not found"); } }));

const html = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element).replaceAll("&#x27;", "'").replaceAll("&amp;", "&").replaceAll("&quot;", '"');
const visibleText = (page: string) => page.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

/** Owner rule: never "AI" or "tutor" where a learner or leader can see it. */
const BANNED_VISIBLE = /\bAI\b|\bA\.I\.\b|artificial intelligence|\btutor/i;
const SHORT_FORMS = GLOSSARY.terms.filter(t => t.short !== t.full).map(t => t.short);
function shortFormIn(text: string): string | null {
  let cleaned = text;
  for (const full of [...GLOSSARY.terms.map(t => t.full)].sort((a, b) => b.length - a.length)) cleaned = cleaned.split(full).join(" ");
  for (const short of SHORT_FORMS) {
    const escaped = short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?<![A-Za-z0-9$])${escaped}(?![A-Za-z0-9])`).test(cleaned)) return short;
  }
  return null;
}

describe("equity baseline pages", () => {
  beforeEach(() => { resetStoreForTests(); });
  it("renders the overview with six goal links, five narratives and no short forms", async () => {
    const page = html(await EquityBaselinePage());
    expect(page).toContain("Equity baseline");
    for (const goal of GOALS) { expect(page).toContain(`/data/equity-baseline/goal/${goal.number}`); expect(page).toContain(goal.title); }
    expect(page).toContain("What the numbers say");
    expect(page).toContain("How we count");
    expect(page).not.toContain("life cycle");
    expect(shortFormIn(visibleText(page))).toBeNull();
  });
  it("renders goal 1 with every measure, a bar chart, a numbers table, the questions and an Ask link", async () => {
    const page = html(await EquityGoalPage({ params: Promise.resolve({ number: "1" }) }));
    for (const m of measures().filter(m => m.goal === 1)) {
      expect(page, m.id).toContain(`id="${m.id}"`);
      expect(page, m.id).toContain(m.title);
    }
    expect(page).toContain('role="img"');
    expect(page).toContain("1.0 = no difference");
    expect(page).toContain("Show the numbers");
    expect(page).toContain("Race not recorded");
    expect(page).toContain("/ask?q=");
    for (const q of GOALS[0].questions) expect(page).toContain(q);
    expect(page).not.toMatch(/<details[^>]*\sopen/);
    expect(shortFormIn(visibleText(page))).toBeNull();
  });
  it("renders goal 3 with the data it still needs", async () => {
    const page = html(await EquityGoalPage({ params: Promise.resolve({ number: "3" }) }));
    expect(page).toContain("Data we still need");
    expect(page).toContain("No workforce data exists yet");
    expect(shortFormIn(visibleText(page))).toBeNull();
  });
  it("says plainly that One DSD keeps no review or guidance totals", async () => {
    const page = html(await EquityBaselinePage());
    const reviews = page.slice(page.indexOf('aria-labelledby="reviews-completed-title"'), page.indexOf('aria-labelledby="guidance-signals-title"'));
    expect(reviews).toContain("Equity reviews completed");
    expect(reviews).toContain(REVIEW_COUNT_OFF);
    expect(reviews).not.toContain("<table");
    const guidance = page.slice(page.indexOf('aria-labelledby="guidance-signals-title"'), page.indexOf('aria-labelledby="count-title"'));
    expect(guidance).toContain(TUTOR_SIGNALS_COPY.heading);
    expect(guidance).toContain(TUTOR_SIGNALS_COPY.off);
    expect(guidance).not.toContain("<table");
    expect(visibleText(page)).not.toMatch(BANNED_VISIBLE);
    expect(visibleText(page)).not.toMatch(/\bthe app\b|\b(?:the|this) application\b/i);
    expect(shortFormIn(visibleText(page))).toBeNull();
  });
  it("keeps every guidance-signals string at or below a 10.5 reading grade with no banned words", () => {
    const flat = (value: unknown): string[] => typeof value === "string" ? [value] : typeof value === "object" && value ? Object.values(value).flatMap(flat) : [];
    for (const text of flat(TUTOR_SIGNALS_COPY)) {
      expect(passageGrade(text, ["Culturally and Linguistically Appropriate Services"]), text).toBeLessThanOrEqual(10.5);
      expect(text, text).not.toMatch(BANNED_VISIBLE);
    }
  });
  it("shows the short forms only on the glossary page, beside the full names", async () => {
    const page = html(await EquityGlossaryPage());
    for (const term of GLOSSARY.terms) { expect(page).toContain(term.full); expect(page).toContain(term.short); }
  });
});

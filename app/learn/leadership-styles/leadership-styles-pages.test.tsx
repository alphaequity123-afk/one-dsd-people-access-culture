import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LEADERSHIP_SCENARIO_FAMILIES, LEADERSHIP_STYLE_LESSONS, STYLE_SECTIONS } from "@/lib/content/leadership-styles-pathway";

vi.mock("@/components/tutor-panel", () => ({ default: ({ lessonId }: { lessonId: string }) => <div data-guided-practice={lessonId} /> }));

import IndexPage from "./page";
import StylePage, { generateStaticParams } from "./[style]/page";
import ScenariosPage from "./scenarios/page";
import RacePage from "./race-and-leadership/page";
import LifecyclePage from "./conflict-lifecycle/page";
import CapstonePage from "./capstone/page";

const BANNED = /\bAI\b|artificial intelligence|\btutor|\boffices?\b/i;
const visibleText = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("leadership styles pathway pages", () => {
  it("renders the overview with every lesson and the go-deeper pages", () => {
    const html = renderToStaticMarkup(<IndexPage />);
    for (const lesson of LEADERSHIP_STYLE_LESSONS) expect(html).toContain(`/learn/leadership-styles/${lesson.slug}`);
    for (const href of ["/learn/leadership-styles/scenarios", "/learn/leadership-styles/race-and-leadership", "/learn/leadership-styles/conflict-lifecycle", "/learn/leadership-styles/capstone"]) expect(html).toContain(href);
    for (const id of ["about", "foundations", "common-scenario", "styles", "conducive"]) expect(html).toContain(`id="${id}"`);
    expect(visibleText(html)).not.toMatch(BANNED);
  });
  it("renders a full lesson for every style, with every anchored section", async () => {
    expect(generateStaticParams()).toHaveLength(16);
    for (const { style } of generateStaticParams()) {
      const html = renderToStaticMarkup(await StylePage({ params: Promise.resolve({ style }) }));
      for (const section of STYLE_SECTIONS) expect(html, `${style}#${section.id}`).toContain(`id="${section.id}"`);
      for (const word of ["Strengths", "Weaknesses", "Opportunities", "Threats", "A stronger version", "A harmful version", "Review prompts"]) expect(html, style).toContain(word);
      expect(visibleText(html), style).not.toMatch(BANNED);
    }
    await expect(StylePage({ params: Promise.resolve({ style: "not-a-style" }) })).rejects.toThrow();
  });
  it("renders the scenarios, race, lifecycle and capstone pages, with Guidance on practice pages", () => {
    const scenarios = renderToStaticMarkup(<ScenariosPage />);
    for (const family of LEADERSHIP_SCENARIO_FAMILIES) expect(scenarios).toContain(`id="scenario-${family.id}"`);
    expect(scenarios).toContain('data-guided-practice="ls02"');
    const capstone = renderToStaticMarkup(<CapstonePage />);
    expect(capstone).toContain('id="rubric"');
    expect(capstone).toContain('data-guided-practice="ls01"');
    expect(capstone).toContain("Guidance");
    for (const html of [scenarios, capstone, renderToStaticMarkup(<RacePage />), renderToStaticMarkup(<LifecyclePage />)]) expect(visibleText(html)).not.toMatch(BANNED);
  });
});

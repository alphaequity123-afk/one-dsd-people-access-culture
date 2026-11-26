import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DIRECTOR_TEMPLATES, DIRECTOR_TOOLKIT_INTRO, DIRECTOR_TOOLKIT_SECTIONS, sectionText, templateDescriptionText, templateText } from "@/lib/content/director-toolkit";
import { LEADERSHIP_STYLE_LESSONS } from "@/lib/content/leadership-styles-pathway";
import { tutorItems } from "@/lib/tutor/items";
import { LEADERSHIP_CAPSTONE_LESSON_ID, LEADERSHIP_SCENARIO_LESSON_ID } from "@/lib/tutor/leadership-items";

vi.mock("@/components/tutor-panel", () => ({ default: ({ lessonId }: { lessonId: string }) => <div data-guided-practice={lessonId} /> }));

import PathwayPage from "./page";
import StylePage from "./[style]/page";
import ScenariosPage from "./scenarios/page";
import RacePage from "./race-and-leadership/page";
import LifecyclePage from "./conflict-lifecycle/page";
import CapstonePage from "./capstone/page";

/**
 * Owner rule (2026-11-04): no status labels and no program or system language that
 * classifies or disclaims the material. Practical guidance and protective cautions stay.
 */
const STATUS_LANGUAGE = new RegExp([
  "\brecommended\b", "\bLimitation\b", "Existing DHS resource", "ADSA guidance", "Project recommendations?", "How items are labeled", "three (?:labels|tiers|kinds of guidance)",
  "kinds of guidance", "kept distinct", "proposed, not adopted", "not adopted agency policy", "not a claim that", "proposed architecture",
  "proposed measures", "established (?:DHS )?scorecard", "recommended adaptation", "Items 1 to 3 are", "proposed (?:tool|component|plan|arrangement|administrative support|operational supports)",
  "design resource", "agency-?wide mandate", "validated probabilit", "voluntary", "standalone",
  "\\bthe project\\b", "\\byour project\\b", "\\bthis program\\b", "\\bthe applications?\\b", "\\bthis application\\b",
].join("|"), "i");

const visibleText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("Equity Director toolkit and leadership pathway carry no status labels", () => {
  it("in the toolkit content, templates and their plain-text copies", () => {
    const texts = [DIRECTOR_TOOLKIT_INTRO.lede, ...DIRECTOR_TOOLKIT_INTRO.summary, DIRECTOR_TOOLKIT_INTRO.privacy,
      ...DIRECTOR_TOOLKIT_SECTIONS.map(sectionText), ...DIRECTOR_TEMPLATES.map(templateDescriptionText), ...DIRECTOR_TEMPLATES.map(template => templateText(template, {}))];
    for (const text of texts) expect(text, text.slice(0, 80)).not.toMatch(STATUS_LANGUAGE);
  });
  it("on every rendered toolkit and pathway page, with no tier badges", async () => {
    const pages = [PathwayPage(), ScenariosPage(), RacePage(), LifecyclePage(), CapstonePage(),
      ...await Promise.all(LEADERSHIP_STYLE_LESSONS.map(lesson => StylePage({ params: Promise.resolve({ style: lesson.slug }) })))];
    for (const page of pages) {
      const html = renderToStaticMarkup(page);
      expect(html).not.toContain("data-tier");
      expect(visibleText(html)).not.toMatch(STATUS_LANGUAGE);
    }
  });
  it("in the leadership Guidance questions", () => {
    for (const lessonId of [LEADERSHIP_CAPSTONE_LESSON_ID, LEADERSHIP_SCENARIO_LESSON_ID]) for (const item of tutorItems(lessonId)) {
      for (const text of [item.question, item.reflection, ...item.options.flatMap(option => [option.text, option.feedback])]) expect(text, text).not.toMatch(STATUS_LANGUAGE);
    }
  });
  it("keeps the protective cautions", () => {
    const all = DIRECTOR_TOOLKIT_SECTIONS.map(sectionText).join("\n");
    expect(all).toMatch(/internal-only/);
    expect(all).toMatch(/should not be given to external partners/);
    expect(DIRECTOR_TOOLKIT_INTRO.privacy).toMatch(/Keep sensitive employee concerns and protected client information out/);
    expect(all).toMatch(/procurement staff should verify/i);
  });
});

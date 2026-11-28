// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ALL_COURSE_SURFACES } from "./definitions";
import { DEIA_CATALOG_SERIES, DEIA_CATALOG_LEVELS } from "./deia-catalog-series";
import { catalogDisplayLabel } from "./authored/deia-catalog/display-labels";
import plan from "./authored/deia-catalog/plan.json";
import collections from "@/lib/content/collections-data.json";
import type { CoursePack } from "./source-types";

/** The program is People, Access and Culture. The DEI and DEIA acronyms never appear in course labels. */
const ACRONYM = /\bDEIA?\b/;

describe("program name in learning labels", () => {
  it("keeps DEI and DEIA out of every published course title, series label, subtitle and scope", () => {
    const offenders: string[] = [];
    for (const surface of ALL_COURSE_SURFACES) {
      const course = (surface.approvedValues.pack as CoursePack).course;
      for (const text of [course.title, course.seriesLabel, course.subtitle, course.scope]) {
        if (text && ACRONYM.test(text)) offenders.push(`${course.id}: ${text}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("maps every recovered planning label to a display label without the acronym", () => {
    const offenders = plan
      .flatMap(row => [row.title, row.series, row.category])
      .map(catalogDisplayLabel)
      .filter(label => ACRONYM.test(label));
    expect([...new Set(offenders)]).toEqual([]);
    for (const series of DEIA_CATALOG_SERIES) expect(series.title).not.toMatch(ACRONYM);
    for (const level of DEIA_CATALOG_LEVELS) expect(level.description).not.toMatch(ACRONYM);
  });

  it("keeps the acronym out of collection item titles", () => {
    const titles = Object.values(collections.items as Record<string, { title: string }>).map(item => item.title);
    expect(titles.filter(title => ACRONYM.test(title))).toEqual([]);
  });
});

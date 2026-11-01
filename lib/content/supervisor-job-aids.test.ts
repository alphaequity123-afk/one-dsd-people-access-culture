import { describe, expect, it } from "vitest";
import { libraryDocument } from "@/lib/downloads/adapters/library";
import { renderText } from "@/lib/downloads/exporters/text";
import { resourceProgressionLevel } from "./progression";
import { RESOURCE_LEGACY_THEME_LABELS, resourceLearningLevel, resourceOrganizationDecision, resourceThemeIds, matchesResourceTheme } from "./resource-organization";
import { staffReleaseValidationIssues } from "./resource-release-contract";
import { getPublishedStaffContent, loadStaffContentSnapshot } from "./staff-publications";
import { collectionItem, jobAidHref } from "./collections";
import { SUPERVISOR_MANAGER_COURSE_PACKS } from "./courses/authored/supervisor-manager";
import memberships from "./courses/theme-memberships.json";
import { resourceDevelopment } from "@/lib/program/development-membership";
import { SUPERVISOR_COURSE_PLACEMENT, SUPERVISOR_JOB_AIDS, supervisorJobAidHref, supervisorJobAidId } from "./supervisor-job-aids";

const courseIds = SUPERVISOR_MANAGER_COURSE_PACKS.map(pack => pack.course.id);

describe("standalone job aids for the supervisor and manager courses", () => {
  it("builds one approved job aid resource from each of the 19 course packs", () => {
    expect(SUPERVISOR_JOB_AIDS).toHaveLength(19);
    expect(SUPERVISOR_JOB_AIDS.map(item => item.id)).toEqual(courseIds.map(supervisorJobAidId));
    expect(supervisorJobAidHref("sm-first-week")).toBe("/resources/ja-sm-first-week");
    for (const pack of SUPERVISOR_MANAGER_COURSE_PACKS) {
      const item = SUPERVISOR_JOB_AIDS.find(candidate => candidate.id === supervisorJobAidId(pack.course.id))!;
      expect(item.type, item.id).toBe("job_aid");
      expect(item.status, item.id).toBe("approved");
      expect(item.title, item.id).toBe(pack.jobAid.title);
      expect(item.body.length, item.id).toBeGreaterThanOrEqual(pack.jobAid.sections.length);
      for (const section of pack.jobAid.sections) for (const line of section.items) expect(item.body.join("\n"), item.id).toContain(line);
      expect(item.nextActions.map(action => action.href), item.id).toContain(`/courses/${pack.course.id}`);
      const text = JSON.stringify(item);
      expect(text, item.id).not.toContain("Review needed");
      expect(text, item.id).not.toContain("Not yet reviewed");
      expect(staffReleaseValidationIssues({ ...item, status: "approved" }), item.id).toEqual([]);
    }
  });
  it("is served as a library resource and downloads like the other job aids", async () => {
    const snapshot = await loadStaffContentSnapshot({ source: "static", scope: "dsd" });
    for (const id of courseIds) {
      const aidId = supervisorJobAidId(id);
      expect(snapshot.items.some(item => item.id === aidId), aidId).toBe(true);
      const item = await getPublishedStaffContent(aidId, { source: "static", scope: "dsd" });
      expect(item?.status, aidId).toBe("approved");
      const document = await libraryDocument(aidId, "dsd");
      expect(document?.title, aidId).toBe(item!.title);
      expect(renderText(document!).toString("utf8"), aidId).toContain(item!.body[0]);
    }
  });
  it("is organized like comparable job aids: themes, a progression level and a development journey", () => {
    for (const id of courseIds) {
      const aidId = supervisorJobAidId(id);
      const placement = SUPERVISOR_COURSE_PLACEMENT[id];
      expect(placement, id).toBeDefined();
      const aid = { id: aidId, type: "job_aid" as const, tags: [] };
      expect(resourceThemeIds(aid), aidId).toEqual(placement.themes);
      expect(resourceLearningLevel(aid), aidId).toBeNull();
      expect(resourceOrganizationDecision(aidId)?.basis.length, aidId).toBeGreaterThan(20);
      expect(resourceProgressionLevel(aidId), aidId).toBe(placement.progression);
      expect(resourceDevelopment(aidId)?.journeyIds, aidId).toEqual(placement.journeys);
      // The course itself shows under the same themes and the legacy theme URLs.
      const course = { id: `course-${id}`, type: "learning_module" as const, tags: [] };
      expect(resourceThemeIds(course), id).toEqual(placement.themes);
      expect(resourceLearningLevel(course), id).toBe(placement.level);
      for (const legacy of placement.legacyThemes) {
        expect((memberships as Record<string, string[]>)[legacy], `${id} in ${legacy}`).toContain(`course-${id}`);
        // Retired theme URLs (culture, structural, ...) resolve through the recorded decision; access and partnership are current themes.
        if (Object.hasOwn(RESOURCE_LEGACY_THEME_LABELS, legacy)) expect(matchesResourceTheme(course, legacy), `${id} matches ${legacy}`).toBe(true);
      }
    }
  });
  it("is where the supervisor and manager doors send readers for a job aid", () => {
    for (const id of courseIds) expect(jobAidHref(collectionItem(id)!), id).toBe(supervisorJobAidHref(id));
    expect(jobAidHref(collectionItem("dhs-equity-analysis-toolkit")!)).toBe("/courses/dhs-equity-analysis-toolkit#job-aid");
  });
});

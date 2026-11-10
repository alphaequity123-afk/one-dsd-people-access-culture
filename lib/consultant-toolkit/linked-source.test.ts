import { describe, expect, it } from "vitest";
import { REFERRAL_ONLY_COURSE_IDS } from "@/lib/program/retired-features";
import { linkedSourceAllowed, linkedSourceHref, linkedSourceId, linkedSourceTextHref, linkedSourceTitle, parseLinkedSource } from "./linked-source";
import { toolkitSourceSchema } from "./schema";

describe("a course linked into the Equity Analysis Toolkit", () => {
  it("builds and reads the two link forms", () => {
    expect(linkedSourceHref("course", "div-f02-microaggressions")).toBe("/consultant/toolkit?source=course%3Adiv-f02-microaggressions");
    expect(linkedSourceHref("self-directed-course", "F07")).toBe("/consultant/toolkit?source=self-directed-course%3AF07");
    expect(parseLinkedSource("course:div-f02-microaggressions")).toEqual({ kind: "course", id: "div-f02-microaggressions" });
    expect(parseLinkedSource("self-directed-course:F07")).toEqual({ kind: "self-directed-course", id: "F07" });
    expect(parseLinkedSource(new URLSearchParams(linkedSourceHref("self-directed-course", "A24").split("?")[1]).get("source"))).toEqual({ kind: "self-directed-course", id: "A24" });
  });

  it("accepts only the known kinds and id shapes", () => {
    for (const value of [null, undefined, "", "course", "course:", ":F07", "lesson:div-f02~lesson-1", "library:guide", "policy:1", "course:../secret", "course:Has Space", "course:a/b", "course:a?format=html", "self-directed-course:F00", "self-directed-course:F25", "self-directed-course:f07", "self-directed-course:F07:extra", "https://example.org", `course:${"a".repeat(200)}`]) {
      expect(parseLinkedSource(value), String(value)).toBeNull();
    }
  });

  it("never offers the referral-only courses", () => {
    expect(REFERRAL_ONLY_COURSE_IDS.size).toBeGreaterThan(0);
    for (const id of REFERRAL_ONLY_COURSE_IDS) {
      expect(linkedSourceAllowed("course", id), id).toBe(false);
      expect(parseLinkedSource(`course:${id}`), id).toBeNull();
    }
  });

  it("uses the plain-text download and one stable source identifier", () => {
    const source = { kind: "self-directed-course" as const, id: "F07" };
    expect(linkedSourceTextHref(source)).toBe("/api/downloads/self-directed-course/F07?format=txt");
    expect(linkedSourceTextHref({ kind: "course", id: "div-f02-microaggressions" })).toBe("/api/downloads/course/div-f02-microaggressions?format=txt");
    expect(linkedSourceId(source)).toBe("linked-self-directed-course:F07");
    const text = "One DSD People, Access and Culture · Self-directed learning\nMicroaggressions: Recognizing Messages\nFoundation · All staff\n";
    expect(linkedSourceTitle(text, source)).toBe("Microaggressions: Recognizing Messages");
    expect(linkedSourceTitle("", source)).toBe("Self-directed course F07");
    expect(toolkitSourceSchema.safeParse({ id: linkedSourceId(source), title: linkedSourceTitle(text, source), text, origin: "user" }).success).toBe(true);
  });
});

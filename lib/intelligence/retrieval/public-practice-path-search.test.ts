import { describe, expect, it } from "vitest";
import { getEditableSurfaceDefinition } from "@/lib/content/staff-surface-registry";
import { practicePathSearchValues } from "./public-practice-path-search";

describe("published practice path search projection", () => {
  it("uses rendered privacy and closed consultation wording even for older stored values", () => {
    const values = { ...getEditableSurfaceDefinition("graduation-path.gp-1")!.approvedValues,
      privacy: "Your progress is saved in the web browser you are using.",
      step0Title: "Send a confidential consultation request",
      step0Guidance: "Submit a request so a consultant will respond.",
      step0Links: [{ label: "Submit confidential request", href: "/support/request" }],
      artifactTitle: "Submit a consultation request",
    };
    const projected = practicePathSearchValues("graduation-path.gp-1", values)!;
    const text = JSON.stringify(projected);
    expect(text).toContain("Staff consultation request forms are closed");
    expect(text).toContain("This page does not save your answers or progress");
    expect(text).not.toMatch(/Submit confidential request|consultant will respond|progress is saved|Submit a consultation request/i);
  });
  it("does not project unknown or unrelated surfaces", () => {
    expect(practicePathSearchValues("ask.page", {})).toBeUndefined();
    expect(practicePathSearchValues("graduation-path.not-real", {})).toBeUndefined();
  });
});

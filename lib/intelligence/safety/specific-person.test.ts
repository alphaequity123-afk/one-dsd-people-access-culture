import { describe, expect, it } from "vitest";
import { askPrivacyGate } from "./index";

const message = (question: string) => {
  const result = askPrivacyGate(question);
  return result.ok ? "" : result.message ?? "";
};

describe("a question about a specific person", () => {
  it("keeps the general privacy message when the person is someone served", () => {
    const reply = message("My client filed a complaint because her waiver eligibility was denied, what should I do?");
    expect(reply).not.toBe("");
    expect(reply).not.toMatch(/Employee Culture/);
  });
  it("points a concern at work to the people who can act on it", () => {
    expect(message("My supervisor keeps retaliating against me after my complaint. What can I do?")).toMatch(/Employee Culture/);
  });
});

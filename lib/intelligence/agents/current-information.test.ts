import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { asksForCurrentInformation, selfContainedWork } from "./ask";

describe("whether a question asks for current public information", () => {
  it.each([
    "What is the latest federal guidance on waiver rates?",
    "What changed this year in the disability waiver rules?",
    "Is there a new rule about interpreter services?",
    "What is the current poverty guideline?",
    "What should we know about the latest rule today?",
    "Who is the commissioner as of now?",
  ])("yes: %s", question => expect(asksForCurrentInformation(question)).toBe(true));
  it.each([
    "Two people on my team keep clashing in meetings. What can I try this week?",
    "What should I do today to prepare for a hard conversation?",
    "How can we make our meetings more accessible this month?",
    "I want to give better feedback this year. Where do I start?",
    "How do I support my current team through a change?",
    "Our recent reorganization left people unsure who decides. What helps?",
    "How do I plan an accessible meeting?",
  ])("no: %s", question => expect(asksForCurrentInformation(question)).toBe(false));
});

describe("work that carries its own material", () => {
  it.each([
    "what is 12 * (1450 + 3)?",
    "Calculate 12 * (1450 + (3 * (250 + 75))) - (2 * (600 + (4 * 35)))",
    "15 percent of 200",
    "Summarize this: The team met on Tuesday and agreed to three changes to intake.",
  ])("yes: %s", question => expect(selfContainedWork(question)).toBe(true));
  it.each([
    "what is 2024",
    "Summarize the latest Olmstead plan changes for me",
    "what is the ADA",
  ])("no: %s", question => expect(selfContainedWork(question)).toBe(false));
  it("checks a long run of brackets followed by words quickly", () => {
    const began = performance.now();
    expect(selfContainedWork(`what is ${"(1)".repeat(2000)} dollars please`)).toBe(false);
    expect(performance.now() - began).toBeLessThan(50);
  });
});

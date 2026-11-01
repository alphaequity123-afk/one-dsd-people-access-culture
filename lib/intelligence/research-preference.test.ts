import { describe, expect, it } from "vitest";
import { asksForProgramSourcesOnly } from "./research-preference";

describe("explicit internal-source preference", () => {
  it.each([
    "Only use sources from this application to explain person-centered planning.",
    "Use only internal sources for my question.",
    "Only the information in this program, please.",
    "Use this site only.",
    "Use internal sources only.",
    "Search the program materials only.",
    "Cite this application's sources only.",
    "Use the app documents exclusively.",
    "Explain the toolkit without searching the web.",
    "Don't use external research.",
    "No outside sources, please.",
  ])("respects an explicit request: %s", text => expect(asksForProgramSourcesOnly(text)).toBe(true));

  it.each([
    "Explain equity in the application and compare it with external research.",
    "What does the application say about external research?",
    "Search the web for current accessibility guidance.",
    "Only one course in this application discusses leadership.",
    "What is person-centered planning?",
  ])("leaves normal or external requests on automatic routing: %s", text => expect(asksForProgramSourcesOnly(text)).toBe(false));
});

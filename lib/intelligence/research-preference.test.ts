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
    "Using only this application, what example does the democratic leadership video give?",
    "Using exclusively this app, explain servant leadership.",
    "Using just the site, summarize the lesson.",
    "Using this program alone, explain the scenario.",
    "Use only this app for the answer.",
    "Based solely on this application, what is in the video?",
    "What can I learn from only this site?",
    "Use only the information from this program.",
    "Using only the Effective Communication reading in this application, explain what it says about companions and requiring a companion to interpret. Cite that reading.",
    "Use only The Water We Swim In collection in this application to make a discussion guide.",
    "Cite exclusively the American Culture brief within the program.",
    "What does the democratic video say from this app only?",
  ])("respects an explicit request: %s", text => expect(asksForProgramSourcesOnly(text)).toBe(true));

  it.each([
    "Explain equity in the application and compare it with external research.",
    "What does the application say about external research?",
    "Search the web for current accessibility guidance.",
    "Only one course in this application discusses leadership.",
    "What is person-centered planning?",
    "Do not use only this application; include other research.",
    "Don't use only this app when answering.",
    "Not using only this application, compare different sources.",
    "Not only use internal sources, but also search the web.",
    "Using only this application, also search the web for current guidance.",
    "Use only this site and include external sources too.",
    "Using only the Effective Communication reading in this application, also search the web for new guidance.",
    "Do not use only the Effective Communication reading in this application.",
  ])("leaves normal or external requests on automatic routing: %s", text => expect(asksForProgramSourcesOnly(text)).toBe(false));
});

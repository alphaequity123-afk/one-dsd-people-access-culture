// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { EquityScanCompanion, summaryText } from "./equity-scan-companion";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); localStorage.clear(); sessionStorage.clear(); });

it("quotes the four questions exactly as the DHS Equity Policy 2.0 words them", async () => {
  await act(async () => { root.render(<EquityScanCompanion />); });
  const quotes = Array.from(container.querySelectorAll("blockquote")).map(quote => quote.textContent);
  expect(quotes).toHaveLength(4);
  expect(quotes[0]).toContain("What groups are impacted by the proposed policy or budget item? (racial and ethnic groups, LGBTQIA2S+ individuals, people with disabilities and veterans)");
  expect(quotes[1]).toContain("Is the proposed item submitted to reduce or eliminate any disparities for racial and ethnic groups");
  expect(quotes[2]).toContain("If negative, please adjust the proposal to achieve a more equitable outcome.");
  expect(quotes[3]).toContain("Can the policy or budget idea be sustainably successful?");
});

it("keeps everything in the page: nothing is stored or sent", async () => {
  await act(async () => { root.render(<EquityScanCompanion />); });
  const textarea = container.querySelector("textarea")!;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    setter.call(textarea, "Fewer people can reach the office.");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(container.querySelector("pre")!.textContent).toContain("Fewer people can reach the office.");
  expect(localStorage.length + sessionStorage.length).toBe(0);
  expect(container.querySelector("form")!.getAttribute("action")).toBeNull();
});

it("reminds people to confer early when consultation has not happened yet", async () => {
  await act(async () => { root.render(<EquityScanCompanion />); });
  const notYet = Array.from(container.querySelectorAll<HTMLInputElement>("input[type=radio]")).at(-1)!;
  await act(async () => { notYet.click(); });
  expect(container.textContent).toContain("research identification, development co-creation, then implementation with a joint feedback loop");
});

it("writes notes that say they prepare for, and do not replace, the formal analysis", () => {
  const text = summaryText({ action: "Public notice, letter or communication", title: "Waiver notice", groups: ["People with disabilities"], impact: "", consultation: "early", q2: "", q3: "", q4: "" });
  expect(text).toContain("Equity scan preparation notes: Waiver notice");
  expect(text).toContain("Groups: People with disabilities");
  expect(text).toContain("not a completed equity analysis");
  expect(text).toContain("equity.directors.dhs@state.mn.us");
});

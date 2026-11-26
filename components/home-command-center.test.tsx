// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("@/components/home-ask", () => ({ HomeAsk: () => <form aria-label="Ask a question" /> }));
const { HomeCommandCenter } = await import("./home-command-center");

let container: HTMLDivElement;
let root: Root;
beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

const tabs = () => Array.from(container.querySelectorAll<HTMLButtonElement>("[role=tab]"));
const visiblePanels = () => Array.from(container.querySelectorAll<HTMLElement>("[role=tabpanel]")).filter(panel => !panel.hidden);

it("offers Ask, Search and Review a draft as tabs, with one panel showing at a time", async () => {
  await act(async () => { root.render(<HomeCommandCenter copy={{}} askAvailable researchAvailable={false} />); });
  expect(tabs().map(tab => tab.textContent)).toEqual(["Ask", "Search", "Review a draft"]);
  expect(visiblePanels()).toHaveLength(1);
  expect(container.querySelector("form[aria-label='Ask a question']")).not.toBeNull();
  await act(async () => { tabs()[1].click(); });
  expect(tabs()[1].getAttribute("aria-selected")).toBe("true");
  expect(visiblePanels()[0].querySelector("form[role=search]")?.getAttribute("action")).toBe("/search");
});

it("moves between tabs with the arrow, Home and End keys", async () => {
  await act(async () => { root.render(<HomeCommandCenter copy={{}} askAvailable researchAvailable={false} />); });
  await act(async () => { tabs()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })); });
  expect(tabs()[2].getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabs()[2]);
  expect(visiblePanels()[0].querySelector("a")?.getAttribute("href")).toBe("/ask?mode=review");
  await act(async () => { tabs()[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true })); });
  expect(tabs()[0].getAttribute("aria-selected")).toBe("true");
});

it("links to the Ask page when Ask cannot run here, and never uses icons", async () => {
  await act(async () => { root.render(<HomeCommandCenter copy={{}} askAvailable={false} researchAvailable={false} />); });
  expect(visiblePanels()[0].querySelector("a")?.getAttribute("href")).toBe("/ask");
  expect(container.querySelector("svg")).toBeNull();
  expect(container.textContent).not.toMatch(/[›→•»]/);
});

// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const f = vi.hoisted(() => ({ write: vi.fn(() => true) }));
vi.mock("@/lib/client/storage", () => ({ writeStored: f.write }));
vi.mock("@/components/ask-voice", () => ({ AskVoice: () => null }));
vi.mock("@/components/ask-client", () => ({ AskClient: ({ compact }: { compact?: boolean }) => createElement("div", { "data-testid": "conversation", "data-compact": String(compact) }, createElement("textarea", { "aria-label": "Follow-up" })) }));
import { HomeAsk } from "@/components/home-ask";

const window_ = () => render(createElement(HomeAsk, { copy: {}, researchAvailable: true }));
beforeEach(() => { f.write.mockClear(); });
afterEach(cleanup);

it("answers a typed question in a side panel, handing it over through session storage and never the page address", () => {
  window_();
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.change(screen.getByRole("textbox", { name: "Ask a question" }), { target: { value: "  How do I plan an accessible meeting?  " } });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  expect(f.write).toHaveBeenCalledWith("session", "pac_ask_home_question_v1", "How do I plan an accessible meeting?");
  expect(screen.getByRole("dialog", { name: "Ask" })).toBeTruthy();
  expect(screen.getByTestId("conversation").getAttribute("data-compact")).toBe("true");
  expect(window.location.search).toBe("");
});

it("opens the panel for a spoken conversation and closes it with Close or Escape", () => {
  window_();
  fireEvent.click(screen.getByRole("button", { name: "Talk with Ask" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(f.write).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Talk with Ask" }));
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("asks for a question before opening the panel", () => {
  window_();
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  expect(f.write).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("alert").textContent).toBe("Type a question first.");
});

it("says what to leave out before anything is typed", () => {
  window_();
  const note = document.getElementById(screen.getByRole("textbox").getAttribute("aria-describedby")!.split(" ")[0]);
  expect(note?.textContent).toMatch(/leave out names/i);
  expect(note?.textContent).not.toMatch(/\b(AI|tutor|chatbot|bot)\b/);
});

// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/components/ask-voice", () => ({ AskVoice: () => null, VOICE_PRIVACY_NOTE: "" }));
vi.mock("@/components/program-context", () => ({ useProgramContext: () => ({ context: "one_dsd" }) }));
vi.mock("@/components/multimedia/resource-media-preview", () => ({ ResourceMediaPreview: () => null, mediaResourceIdFromHref: () => undefined }));
import { AskClient } from "@/components/ask-client";

const copy = { questionLabel: "Ask a question", answerButton: "Ask", askedKicker: "You asked", shortAnswerTitle: "Answer", answerError: "Ask could not answer just now.", questionTooShort: "Type a question first." };
const finished = { kind: "answer", answer: { shortAnswer: "Plan interpreters early.", whyItMatters: "", sources: [], limits: [], nextActions: [] } };
const page = { path: "/library/ja-language-access-checklist", title: "Language access checklist" };

function answering() {
  const fetcher = vi.fn(async () => new Response(JSON.stringify(finished), { headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetcher);
  return () => fetcher.mock.calls.map(call => JSON.parse(((call as unknown as [string, RequestInit])[1].body as string)) as Record<string, unknown>);
}
async function ask(question: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: question } });
  await act(async () => { fireEvent.submit(screen.getByRole("textbox").closest("form")!); });
}

beforeEach(() => { window.sessionStorage.clear(); window.localStorage.clear(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("says which page it is asking about and sends only that page's address and title", async () => {
  const sent = answering();
  render(createElement(AskClient, { compact: true, page, researchAvailable: true, intakeEnabled: false, copy }));
  const line = document.getElementById(screen.getByRole("textbox").id + "-page")!;
  expect(line.textContent).toContain("Asking about: Language access checklist");
  expect(screen.getByRole("textbox").getAttribute("aria-describedby")).toContain(line.id);
  await ask("What does this checklist say about interpreters?");
  await waitFor(() => expect(screen.getByText("Plan interpreters early.")).toBeTruthy());
  expect(sent()[0].page).toEqual(page);
  expect(Object.keys(sent()[0].page as object).sort()).toEqual(["path", "title"]);
});

it("lets the reader ask without the page, and bring it back", async () => {
  const sent = answering();
  render(createElement(AskClient, { compact: true, page, researchAvailable: true, intakeEnabled: false, copy }));
  const toggle = screen.getByRole("button", { name: "Ask without this page" });
  fireEvent.click(toggle);
  expect(screen.getByText("Your question will be answered on its own.", { exact: false })).toBeTruthy();
  // The same control stays in place, so keyboard focus is not lost.
  expect(screen.getByRole("button", { name: "Ask about Language access checklist instead" })).toBe(toggle);
  await ask("How do I plan a meeting?");
  await waitFor(() => expect(sent()).toHaveLength(1));
  expect(sent()[0]).not.toHaveProperty("page");

  fireEvent.click(toggle);
  expect(screen.getByText("Language access checklist", { selector: "strong" })).toBeTruthy();
  await waitFor(() => expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(false));
  await ask("And for written notices?");
  await waitFor(() => expect(sent()).toHaveLength(2));
  expect(sent()[1].page).toEqual(page);
});

it("shows no page line and sends no page when Ask was not opened from a page", async () => {
  const sent = answering();
  render(createElement(AskClient, { researchAvailable: true, intakeEnabled: false, copy }));
  expect(screen.queryByText("Asking about:", { exact: false })).toBeNull();
  expect(screen.queryByRole("button", { name: "Ask without this page" })).toBeNull();
  await ask("How do I plan a meeting?");
  await waitFor(() => expect(sent()).toHaveLength(1));
  expect(sent()[0]).not.toHaveProperty("page");
});

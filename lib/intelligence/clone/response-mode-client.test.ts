// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
vi.mock("@/components/program-context", () => ({ useProgramContext: () => ({ context: "one_dsd" }) }));
vi.mock("@/components/multimedia/resource-media-preview", () => ({ ResourceMediaPreview: () => null, mediaResourceIdFromHref: () => undefined }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: ReactNode; href: string }) => createElement("a", { href }, children) }));
vi.mock("@/lib/client/storage", async () => {
  const { useState } = await import("react");
  return { newId: () => "synthetic-session", writeStored: vi.fn(), useStored: (_kind: unknown, _key: unknown, value: unknown) => useState(value) };
});
// Exercise the parent's actual event handling without browser microphone permissions.
// AskVoice calls onQuestion only for Talk with ASK; dictation only fills the composer.
vi.mock("@/components/ask-voice", () => ({ AskVoice: ({ onDictation, onQuestion }: {
  onDictation: (text: string) => void; onQuestion: (text: string) => Promise<unknown>;
}) => createElement("div", null,
  createElement("button", { onClick: () => onDictation("A dictated question") }, "Dictate question"),
  createElement("button", { onClick: () => { onDictation("A spoken question"); void onQuestion("A spoken question"); } }, "Talk with ASK")) }));
import { AskClient } from "@/components/ask-client";

const fetch = vi.fn();
const copy = { questionLabel: "Question", answerButton: "Ask", busyProgram: "Working", shortAnswerTitle: "Answer" };
beforeEach(() => {
  fetch.mockReset();
  fetch.mockResolvedValue({ ok: true, json: async () => ({ kind: "answer", answer: {
    shortAnswer: "A synthetic answer.", whyItMatters: "", sources: [], limits: [], nextActions: [],
  } }) });
  vi.stubGlobal("fetch", fetch);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("sends spoken only for Talk with ASK, without making dictation or subsequent typing inherit that preference", async () => {
  render(createElement(AskClient, { researchAvailable: true, intakeEnabled: false, copy }));
  const ask = () => screen.getByRole("button", { name: "Ask" });
  const waitForAnswer = async (count: number) => {
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(count));
    await waitFor(() => expect((ask() as HTMLButtonElement).disabled).toBe(false));
  };
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "A typed question" } });
  fireEvent.click(ask()); await waitForAnswer(1);
  fireEvent.click(screen.getByRole("button", { name: "Dictate question" }));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("A dictated question");
  fireEvent.click(ask()); await waitForAnswer(2);
  fireEvent.click(screen.getByRole("button", { name: "Talk with ASK" })); await waitForAnswer(3);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "A later typed question" } });
  fireEvent.click(ask()); await waitForAnswer(4);
  expect(fetch.mock.calls.map(([, init]) => JSON.parse(init.body).responseMode)).toEqual(["text", "text", "spoken", "text"]);
  expect(fetch.mock.calls.map(([, init]) => JSON.parse(init.body).question)).toEqual(["A typed question", "A dictated question", "A spoken question", "A later typed question"]);
  expect(screen.queryByRole("combobox")).toBeNull();
});

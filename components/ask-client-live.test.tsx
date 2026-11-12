// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/components/ask-voice", () => ({ AskVoice: () => null, VOICE_PRIVACY_NOTE: "" }));
vi.mock("@/components/program-context", () => ({ useProgramContext: () => ({ context: "one_dsd" }) }));
vi.mock("@/components/multimedia/resource-media-preview", () => ({ ResourceMediaPreview: () => null, mediaResourceIdFromHref: () => undefined }));
import { AskClient } from "@/components/ask-client";

const copy = { questionLabel: "Ask a question", answerButton: "Ask", askedKicker: "You asked", shortAnswerTitle: "Answer", answerError: "Ask could not answer just now.", questionTooShort: "Type a question first." };
const finished = (shortAnswer: string) => ({ kind: "answer", answer: { shortAnswer, whyItMatters: "", sources: [], limits: [], nextActions: [] } });

/** A connection the test feeds one line at a time, the way the server sends progress. */
function connection() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(started) { controller = started; } });
  const encoder = new TextEncoder();
  return {
    response: new Response(body, { headers: { "content-type": "application/x-ndjson; charset=utf-8" } }),
    send: async (event: unknown) => { await act(async () => { controller.enqueue(encoder.encode(JSON.stringify(event) + "\n")); await new Promise(resolve => setTimeout(resolve, 0)); }); },
    close: async () => { await act(async () => { controller.close(); await new Promise(resolve => setTimeout(resolve, 0)); }); },
  };
}
const page = () => render(createElement(AskClient, { researchAvailable: true, intakeEnabled: false, copy }));
async function ask(question: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: question } });
  await act(async () => { fireEvent.submit(screen.getByRole("textbox").closest("form")!); });
}

beforeEach(() => { window.sessionStorage.clear(); window.localStorage.clear(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("shows each stage and the answer as it is written, then the finished answer", async () => {
  const live = connection();
  const fetcher = vi.fn(async () => live.response);
  vi.stubGlobal("fetch", fetcher);
  page();
  await ask("How can I make a meeting more accessible?");

  const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect((init.headers as Record<string, string>).accept).toContain("application/x-ndjson");
  expect(screen.getByRole("status").textContent).toBe("Looking through the program’s material…");
  expect(document.querySelector("[aria-busy='true']")!.textContent).toContain("How can I make a meeting more accessible?");

  await live.send({ type: "stage", stage: "checking" });
  expect(screen.getByRole("status").textContent).toBe("Checking public sources…");
  await live.send({ type: "stage", stage: "writing" });
  await live.send({ type: "text", text: "Send materials" });
  expect(screen.getByRole("status").textContent).toBe("Writing your answer…");
  expect(screen.getByText("Send materials")).toBeTruthy();
  await live.send({ type: "text", text: "Send materials ahead of time." });
  expect(screen.getByText("Send materials ahead of time.")).toBeTruthy();
  // The growing answer sits outside the announced region, so a screen reader is not read every added word.
  expect(screen.getByText("Send materials ahead of time.").closest("[aria-live]")).toBeNull();
  expect(screen.getByText("Send materials ahead of time.").closest("[aria-busy='true']")).not.toBeNull();

  await live.send({ type: "stage", stage: "finishing" });
  await live.send({ type: "done", result: finished("Send materials ahead of time, and ask what would help.") });
  await live.close();
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  const answer = screen.getByText("Send materials ahead of time, and ask what would help.");
  expect(answer.closest("[aria-live='polite']")).not.toBeNull();
  expect(document.querySelector("[aria-busy='true']")).toBeNull();
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("");
});

it("sets aside what was shown when the answer is written again", async () => {
  const live = connection();
  vi.stubGlobal("fetch", vi.fn(async () => live.response));
  page();
  await ask("What should I try first?");
  await live.send({ type: "text", text: "A first draft" });
  expect(screen.getByText("A first draft")).toBeTruthy();
  await live.send({ type: "reset" });
  expect(screen.queryByText("A first draft")).toBeNull();
  await live.send({ type: "done", result: finished("Start with one small step.") });
  await live.close();
  await waitFor(() => expect(screen.getByText("Start with one small step.")).toBeTruthy());
});

it("says so and offers another try when the connection closes before the answer arrives", async () => {
  const live = connection();
  vi.stubGlobal("fetch", vi.fn(async () => live.response));
  page();
  await ask("What should I try first?");
  await live.send({ type: "text", text: "Half an ans" });
  await live.close();
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Ask could not answer just now."));
  expect(screen.queryByText("Half an ans")).toBeNull();
  expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
});

it("shows a failure that arrives as the finished result", async () => {
  const live = connection();
  vi.stubGlobal("fetch", vi.fn(async () => live.response));
  page();
  await ask("What should I try first?");
  await live.send({ type: "done", result: { error: "Ask has reached its limit for now." } });
  await live.close();
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Ask has reached its limit for now."));
});

it("still accepts a single finished answer", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(finished("One complete answer.")), { headers: { "content-type": "application/json" } })));
  page();
  await ask("What should I try first?");
  await waitFor(() => expect(screen.getByText("One complete answer.")).toBeTruthy());
  expect(screen.queryByRole("status")).toBeNull();
});

it("shows a refusal sent before any work began", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Please wait a moment before asking another question." }), { status: 429, headers: { "content-type": "application/json" } })));
  page();
  await ask("What should I try first?");
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Please wait a moment"));
});

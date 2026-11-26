import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AskVoice } from "./ask-voice";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class TestRecorder {
  static isTypeSupported() { return true; }
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onerror: (() => void) | null = null;
  onstop: (() => Promise<void>) | null = null;
  start() { this.state = "recording"; }
  stop() { this.state = "inactive"; void this.onstop?.(); }
}

class TestAudioContext {
  createAnalyser() { return { fftSize: 512, getByteTimeDomainData: () => undefined }; }
  createMediaStreamSource() { return { connect: () => undefined }; }
  close() { return Promise.resolve(); }
}

let root: Root;
beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = "<div id='root'></div>";
  vi.stubGlobal("MediaRecorder", TestRecorder);
  vi.stubGlobal("AudioContext", TestAudioContext);
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/voice")
    ? new Response(JSON.stringify({ transcription: true, speech: true, paused: false }))
    : new Response(JSON.stringify({ text: "A general question" }))));
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => undefined }] }) } });
  Object.defineProperty(navigator, "permissions", { configurable: true, value: { query: async () => ({ state: "granted", onchange: null }) } });
  root = createRoot(document.getElementById("root")!);
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "mediaDevices");
  Reflect.deleteProperty(navigator, "permissions");
});

it("delivers a completed recording to the latest committed dictation callback", async () => {
  const first = vi.fn();
  const latest = vi.fn();
  const question = vi.fn(async () => undefined);
  await act(async () => { root.render(<AskVoice busy={false} onDictation={first} onQuestion={question} />); });
  const button = (label: string) => Array.from(document.querySelectorAll("button")).find(item => (item.getAttribute("aria-label") ?? item.textContent) === label)!;
  expect(button("Speak your question").disabled).toBe(false);
  await act(async () => { button("Speak your question").click(); });
  await act(async () => { root.render(<AskVoice busy={false} onDictation={latest} onQuestion={question} />); });
  await act(async () => { button("Done speaking").click(); });
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledWith("A general question");
});

const control = (label: string) => Array.from(document.querySelectorAll("button")).find(item => (item.getAttribute("aria-label") ?? item.textContent) === label);

it("shows the voice controls as short words, with a fuller name for screen readers", async () => {
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." />); });
  for (const [word, name] of [["Speak", "Speak your question"], ["Talk", "Talk with Ask"], ["Listen", "Listen to the answer"]]) {
    const found = control(name);
    expect(found, name).toBeDefined();
    expect(found!.textContent).toBe(word);
    expect(name.startsWith(word)).toBe(true);
    expect(found!.querySelector("svg"), name).toBeNull();
    expect(found!.getAttribute("type")).toBe("button");
  }
});

it("offers dictation alone on the landing page, and leaves the microphone out when dictation cannot work", async () => {
  await act(async () => { root.render(<AskVoice mode="dictate" busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." />); });
  expect(control("Speak your question")).toBeDefined();
  expect(control("Talk with Ask")).toBeUndefined();
  expect(control("Listen to the answer")).toBeUndefined();
  await act(async () => root.unmount());
  root = createRoot(document.getElementById("root")!);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ transcription: false, speech: false, paused: false }))));
  vi.stubGlobal("SpeechRecognition", undefined); vi.stubGlobal("webkitSpeechRecognition", undefined);
  await act(async () => { root.render(<AskVoice mode="dictate" busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} />); });
  expect(document.querySelectorAll("button")).toHaveLength(0);
  expect(document.body.textContent).not.toMatch(/not available|could not confirm|unavailable/i);
});

it("puts the read-aloud control under the latest answer when the page gives it a place", async () => {
  const slot = document.createElement("span"); document.body.appendChild(slot);
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." listenSlot={slot} />); });
  expect(slot.querySelector("button")?.getAttribute("aria-label")).toBe("Listen to the answer");
  expect(document.getElementById("root")!.querySelector("[aria-label='Listen to the answer']")).toBeNull();
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." listenSlot={null} />); });
  expect(control("Listen to the answer")).toBeUndefined();
});

class BrowserRecognition {
  static latest: BrowserRecognition;
  lang = ""; continuous = false; interimResults = false;
  onresult: ((event: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  start = vi.fn(); abort = vi.fn();
  constructor() { BrowserRecognition.latest = this; }
  stop() { this.onend?.(); }
  hear(text: string, isFinal: boolean) { this.onresult?.({ results: [{ isFinal, 0: { transcript: text } }] }); }
}
class BrowserUtterance {
  lang = ""; onend: (() => void) | null = null; onerror: (() => void) | null = null;
  constructor(public text: string) {}
}
function browserSpeech(services = { transcription: false, speech: false, paused: false }) {
  BrowserRecognition.latest = undefined as unknown as BrowserRecognition;
  vi.stubGlobal("SpeechRecognition", BrowserRecognition);
  vi.stubGlobal("SpeechSynthesisUtterance", BrowserUtterance);
  const synthesis = { speak: vi.fn(), cancel: vi.fn() };
  vi.stubGlobal("speechSynthesis", synthesis);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(services))));
  return synthesis;
}

it("shows the words in the question box while the person is still speaking, using the browser's own speech", async () => {
  browserSpeech(); const dictation = vi.fn();
  await act(async () => { root.render(<AskVoice busy={false} onDictation={dictation} onQuestion={vi.fn(async () => undefined)} />); });
  expect(control("Speak your question")!.disabled).toBe(false);
  await act(async () => { control("Speak your question")!.click(); });
  const listening = BrowserRecognition.latest;
  expect(listening.interimResults).toBe(true);
  await act(async () => { listening.hear("How do I plan", false); });
  expect(dictation).toHaveBeenLastCalledWith("How do I plan");
  await act(async () => { listening.hear("How do I plan an accessible meeting?", true); listening.stop(); });
  expect(dictation).toHaveBeenLastCalledWith("How do I plan an accessible meeting?");
  expect(fetch).toHaveBeenCalledTimes(1);   // only the availability check; no recording left the browser
});

it("never substitutes a browser voice when Geffen is offline", async () => {
  const synthesis = browserSpeech();
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." />); });
  expect(control("Listen to the answer")!.disabled).toBe(true);
  expect(control("Talk with Ask")!.disabled).toBe(true);
  expect(control("Speak your question")!.disabled).toBe(false);
  expect(synthesis.speak).not.toHaveBeenCalled();
});

it("keeps the written answer without switching voices when Geffen rejects playback", async () => {
  const synthesis = browserSpeech();
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => init?.method === "POST"
    ? new Response(JSON.stringify({ error: "Geffen is busy. Please try again." }), { status: 503 })
    : new Response(JSON.stringify({ transcription: true, speech: true, paused: false }))));
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." />); });
  await act(async () => { control("Listen to the answer")!.click(); });
  expect(synthesis.speak).not.toHaveBeenCalled();
  expect(document.body.textContent).toContain("Geffen is busy. Please try again.");
});

const micState = (state: string) => Object.defineProperty(navigator, "permissions", { configurable: true, value: { query: async () => ({ state, onchange: null }) } });
const micStub = (getUserMedia: unknown) => Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

it("shows a muted microphone icon until the microphone is allowed, with no Allow microphone label", async () => {
  browserSpeech(); micState("prompt");
  const asked = vi.fn(async () => ({ getTracks: () => [{ stop: () => undefined }] }));
  micStub(asked);
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} />); });
  await settle();
  expect(document.body.textContent).not.toContain("Allow microphone");
  expect(control("Speak your question (the microphone is off; select to turn it on)")!.textContent).toBe("Speak");
  await act(async () => { control("Speak your question (the microphone is off; select to turn it on)")!.click(); });
  await settle();
  expect(asked).toHaveBeenCalledWith({ audio: true });
  expect(BrowserRecognition.latest.start).toHaveBeenCalledOnce();
});

it("explains a blocked microphone after a press and does not start listening", async () => {
  browserSpeech(); micState("denied");
  micStub(vi.fn(async () => { throw new DOMException("Permission denied", "NotAllowedError"); }));
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} />); });
  await settle();
  expect(document.body.textContent).not.toContain("Allow microphone");
  await act(async () => { control("Speak your question (the microphone is off; select to turn it on)")!.click(); });
  await settle();
  expect(BrowserRecognition.latest).toBeUndefined();
  expect(document.body.textContent).toContain("The microphone is blocked for this site");
});

it("shows the plain microphone once it is allowed, and mutes spoken answers from the speaker icon", async () => {
  browserSpeech({ transcription: true, speech: true, paused: false }); micState("granted");
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." />); });
  await settle();
  expect(control("Speak your question")).toBeDefined();
  await act(async () => { control("Mute spoken answers")!.click(); });
  expect(control("Unmute spoken answers")!.getAttribute("aria-pressed")).toBe("true");
  expect(window.localStorage.getItem("ask-voice-muted")).toBe("1");
  await act(async () => { control("Unmute spoken answers")!.click(); });
  expect(control("Mute spoken answers")!.getAttribute("aria-pressed")).toBe("false");
});

it("does not play an in-flight speech response after muting and unmuting", async () => {
  browserSpeech({ transcription: true, speech: true, paused: false });
  let finish!: (response: Response) => void;
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => init?.method === "POST"
    ? new Promise<Response>(resolve => { finish = resolve; })
    : new Response(JSON.stringify({ transcription: true, speech: true, paused: false }))));
  const player = vi.fn(); vi.stubGlobal("Audio", player);
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." />); });
  await act(async () => { control("Listen to the answer")!.click(); });
  await act(async () => { control("Mute spoken answers")!.click(); });
  await act(async () => { control("Unmute spoken answers")!.click(); });
  await act(async () => { finish(new Response('{"audio":"UklGRg=="}\n{"done":true}\n')); });
  expect(player).not.toHaveBeenCalled();
  expect(control("Listen to the answer")).toBeDefined();
});

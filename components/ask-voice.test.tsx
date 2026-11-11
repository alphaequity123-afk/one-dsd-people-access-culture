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
  const button = (label: string) => Array.from(document.querySelectorAll("button")).find(item => item.textContent === label)!;
  expect(button("Dictate question").disabled).toBe(false);
  await act(async () => { button("Dictate question").click(); });
  await act(async () => { root.render(<AskVoice busy={false} onDictation={latest} onQuestion={question} />); });
  await act(async () => { button("Finish speaking").click(); });
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledWith("A general question");
});

const control = (label: string) => Array.from(document.querySelectorAll("button")).find(item => item.textContent === label);

it("shows the voice controls as icons that keep their names for screen readers and as tooltips", async () => {
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." />); });
  for (const name of ["Dictate question", "Talk with Ask", "Listen to answer"]) {
    const found = control(name);
    expect(found, name).toBeDefined();
    expect(found!.title).toBe(name);
    expect(found!.querySelector("svg[aria-hidden='true']"), name).not.toBeNull();
    expect(found!.getAttribute("type")).toBe("button");
  }
});

it("offers dictation alone on the landing page, and leaves the microphone out when dictation cannot work", async () => {
  await act(async () => { root.render(<AskVoice mode="dictate" busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." />); });
  expect(control("Dictate question")).toBeDefined();
  expect(control("Talk with Ask")).toBeUndefined();
  expect(control("Listen to answer")).toBeUndefined();
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
  expect(slot.querySelector("button")?.textContent).toBe("Listen to answer");
  expect(document.getElementById("root")!.textContent).not.toContain("Listen to answer");
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="An answer." listenSlot={null} />); });
  expect(control("Listen to answer")).toBeUndefined();
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
  expect(control("Dictate question")!.disabled).toBe(false);
  await act(async () => { control("Dictate question")!.click(); });
  const listening = BrowserRecognition.latest;
  expect(listening.interimResults).toBe(true);
  await act(async () => { listening.hear("How do I plan", false); });
  expect(dictation).toHaveBeenLastCalledWith("How do I plan");
  await act(async () => { listening.hear("How do I plan an accessible meeting?", true); listening.stop(); });
  expect(dictation).toHaveBeenLastCalledWith("How do I plan an accessible meeting?");
  expect(fetch).toHaveBeenCalledTimes(1);   // only the availability check; no recording left the browser
});

it("holds a spoken conversation: hears the question, asks it, reads the answer aloud and listens again", async () => {
  const synthesis = browserSpeech(); const question = vi.fn(async () => "Share the agenda ahead of time.");
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={question} />); });
  await act(async () => { control("Talk with Ask")!.click(); });
  const first = BrowserRecognition.latest;
  await act(async () => { first.hear("How do I plan an accessible meeting?", true); first.stop(); });
  expect(question).toHaveBeenCalledWith("How do I plan an accessible meeting?");
  expect(synthesis.speak.mock.calls[0][0].text).toBe("Share the agenda ahead of time.");
  await act(async () => { synthesis.speak.mock.calls[0][0].onend(); });
  expect(BrowserRecognition.latest).not.toBe(first);
  expect(BrowserRecognition.latest.start).toHaveBeenCalledOnce();
  await act(async () => { control("Stop and turn off the microphone")!.click(); });
  expect(synthesis.cancel).toHaveBeenCalled();
});

it("reads an answer aloud with the browser's voice when the program voice is not connected, and respects a pause", async () => {
  const synthesis = browserSpeech();
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} latestAnswer="Offer meaningful language access." />); });
  await act(async () => { control("Listen to answer")!.click(); });
  expect(synthesis.speak.mock.calls[0][0].text).toBe("Offer meaningful language access.");
  await act(async () => { synthesis.speak.mock.calls[0][0].onend(); });
  await act(async () => root.unmount());
  root = createRoot(document.getElementById("root")!);
  browserSpeech({ transcription: false, speech: false, paused: true });
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} />); });
  expect(control("Dictate question")!.disabled).toBe(true);
  expect(control("Talk with Ask")!.disabled).toBe(true);
});

const micState = (state: string) => Object.defineProperty(navigator, "permissions", { configurable: true, value: { query: async () => ({ state, onchange: null }) } });
const micStub = (getUserMedia: unknown) => Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

it("shows an Allow microphone button until the microphone is allowed, then removes it", async () => {
  browserSpeech(); micState("prompt");
  const asked = vi.fn(async () => ({ getTracks: () => [{ stop: () => undefined }] }));
  micStub(asked);
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} />); });
  await settle();
  expect(document.body.textContent).toContain("Ask needs your microphone to hear you");
  await act(async () => { control("Allow microphone")!.click(); });
  await settle();
  expect(asked).toHaveBeenCalledWith({ audio: true });
  expect(control("Allow microphone")).toBeUndefined();
  await act(async () => { control("Dictate question")!.click(); });
  await settle();
  expect(BrowserRecognition.latest.start).toHaveBeenCalledOnce();
});

it("asks for the microphone when a listening button is pressed before it is allowed", async () => {
  browserSpeech(); micState("prompt");
  const asked = vi.fn(async () => ({ getTracks: () => [{ stop: () => undefined }] }));
  micStub(asked);
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} />); });
  await settle();
  await act(async () => { control("Dictate question")!.click(); });
  await settle();
  expect(asked).toHaveBeenCalledOnce();
  expect(BrowserRecognition.latest.start).toHaveBeenCalledOnce();
});

it("explains a blocked microphone and does not start listening", async () => {
  browserSpeech(); micState("denied");
  micStub(vi.fn(async () => { throw new DOMException("Permission denied", "NotAllowedError"); }));
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} />); });
  await settle();
  expect(document.body.textContent).toContain("Microphone access is not allowed for this site");
  await act(async () => { control("Dictate question")!.click(); });
  await settle();
  expect(BrowserRecognition.latest).toBeUndefined();
  expect(document.body.textContent).toContain("Microphone access is not allowed for this site");
});

it("does not show the Allow microphone button once the microphone is allowed", async () => {
  browserSpeech(); micState("granted");
  await act(async () => { root.render(<AskVoice busy={false} onDictation={vi.fn()} onQuestion={vi.fn(async () => undefined)} />); });
  await settle();
  expect(control("Allow microphone")).toBeUndefined();
});

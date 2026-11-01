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
  root = createRoot(document.getElementById("root")!);
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "mediaDevices");
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

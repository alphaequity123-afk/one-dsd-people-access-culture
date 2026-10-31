import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ paused: vi.fn() }));
vi.mock("../orchestrator", () => ({ paused: f.paused }));
vi.mock("./config", () => ({ cloneAgentsEnabled: () => true }));
import { GET } from "@/app/api/ask/voice/worker/route";
import { queueVoice, takeVoiceJob } from "./voice-queue";
const controllers: AbortController[] = [];
const signal = () => { const controller = new AbortController(); controllers.push(controller); return controller; };
const request = (query = "", controller = signal(), authorized = true) => new NextRequest(`https://ask.example/api/ask/voice/worker${query}`, {
  signal: controller.signal, headers: authorized ? { authorization: "Bearer worker-test-secret" } : {},
});
beforeEach(() => {
  vi.useFakeTimers(); vi.stubEnv("PAC_GEFFEN_WORKER_KEY", "worker-test-secret");
  f.paused.mockReset().mockResolvedValue(false); takeVoiceJob();
});
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.abort();
  vi.useRealTimers(); vi.unstubAllEnvs();
});
it("keeps immediate GET polling backward compatible", async () => {
  expect(await (await GET(request())).json()).toEqual({ job: null });
  queueVoice("Immediate answer", signal().signal);
  const result = await (await GET(request())).json();
  expect(result.job.text).toBe("Immediate answer");
  expect(takeVoiceJob()).toBe(null);
});
it("delivers a newly queued job to a waiting authenticated worker", async () => {
  const response = GET(request("?wait=15000"));
  await Promise.resolve();
  queueVoice("Begin speaking", signal().signal);
  const result = await response;
  expect(result.headers.get("cache-control")).toBe("no-store");
  expect((await result.json()).job.text).toBe("Begin speaking");
  expect(takeVoiceJob()).toBe(null);
});
it("does not claim a job when the owner pauses during a wait", async () => {
  const response = GET(request("?wait=15000"));
  await Promise.resolve();
  f.paused.mockResolvedValue(true);
  queueVoice("Wait for owner resume", signal().signal);
  expect(await (await response).json()).toEqual({ paused: true });
  expect(takeVoiceJob()?.text).toBe("Wait for owner resume");
});
it("does not claim a job after the waiting request is aborted", async () => {
  const controller = signal();
  const response = GET(request("?wait=15000", controller));
  await Promise.resolve();
  controller.abort();
  queueVoice("For the next worker", signal().signal);
  expect(await (await response).json()).toEqual({ job: null });
  expect(takeVoiceJob()?.text).toBe("For the next worker");
});
it("rechecks cancellation after the asynchronous owner-state lookup", async () => {
  let releasePause!: (paused: boolean) => void;
  f.paused.mockResolvedValueOnce(false).mockImplementationOnce(() => new Promise<boolean>(resolve => { releasePause = resolve; }));
  const controller = signal();
  const response = GET(request("?wait=15000", controller));
  await Promise.resolve();
  queueVoice("Keep this job available", signal().signal);
  await Promise.resolve();
  controller.abort(); releasePause(false);
  expect(await (await response).json()).toEqual({ job: null });
  expect(takeVoiceJob()?.text).toBe("Keep this job available");
});
it("allows only one of two waiting requests to claim the same job", async () => {
  const responses = [GET(request("?wait=15000")), GET(request("?wait=15000"))];
  await Promise.resolve();
  queueVoice("Speak once", signal().signal);
  const results = await Promise.all(responses.map(async response => (await response).json()));
  expect(results.filter(result => result.job)).toHaveLength(1);
  expect(results.find(result => result.job).job.text).toBe("Speak once");
});
it("caps the route wait and returns an empty job after timeout", async () => {
  const response = GET(request("?wait=90000"));
  await vi.advanceTimersByTimeAsync(20_000);
  expect(await (await response).json()).toEqual({ job: null });
  expect(vi.getTimerCount()).toBe(0);
});
it("preserves authentication, pause and active-job checks", async () => {
  expect((await GET(request("?wait=15000", signal(), false))).status).toBe(401);
  expect(vi.getTimerCount()).toBe(0);
  f.paused.mockResolvedValue(true);
  expect(await (await GET(request("?wait=15000"))).json()).toEqual({ paused: true });
  expect(vi.getTimerCount()).toBe(0);
  f.paused.mockResolvedValue(false);
  expect(await (await GET(request("?active=missing&wait=15000"))).json()).toEqual({ active: false });
  expect(vi.getTimerCount()).toBe(0);
});
it("rejects invalid wait durations without starting a timer", async () => {
  for (const value of ["-1", "not-a-number", "1.5"]) {
    expect((await GET(request(`?wait=${value}`))).status).toBe(400);
  }
  expect(vi.getTimerCount()).toBe(0);
});

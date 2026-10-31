import { it, expect, vi, afterEach } from "vitest";
vi.mock("server-only", () => ({}));
import { workerAuthorized, takeVoiceJob, completeVoiceJob, queueVoice, voiceWorkerReady, waitForVoiceJob } from "./voice-queue";
const controllers: AbortController[] = [];
const signal = () => { const controller = new AbortController(); controllers.push(controller); return controller; };
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.abort();
  vi.useRealTimers(); vi.unstubAllEnvs();
});
it("requires the exact worker credential", () => {
  vi.stubEnv("PAC_GEFFEN_WORKER_KEY", "test-worker-secret");
  expect(workerAuthorized(null)).toBe(false);
  expect(workerAuthorized("Bearer wrong")).toBe(false);
  expect(workerAuthorized("Bearer test-worker-secret")).toBe(true);
});
it("delivers a job once and releases its waiting request", async () => {
  takeVoiceJob(); expect(voiceWorkerReady()).toBe(true);
  const result = queueVoice("A public example", new AbortController().signal);
  const job = takeVoiceJob(); expect(job?.text).toBe("A public example");
  expect(takeVoiceJob()).toBe(null);
  expect(completeVoiceJob(job!.id, new Uint8Array([1,2]))).toBe(true);
  expect(await new Response(result).text()).toContain('"audio":"AQI="');
  expect(completeVoiceJob(job!.id, new Uint8Array([1]))).toBe(false);
});
it("drops cancelled text and rejects late worker output", async () => {
  const controller = new AbortController();
  const result = queueVoice("A cancelled example", controller.signal);
  const job = takeVoiceJob(); controller.abort();
  expect(await new Response(result).text()).toBe("");
  expect(completeVoiceJob(job!.id, new Uint8Array([1]))).toBe(false);
});
it("wakes immediately for a new job without claiming it", async () => {
  vi.useFakeTimers();
  const pending = waitForVoiceJob(signal().signal, 15_000);
  expect(voiceWorkerReady()).toBe(true);
  expect(vi.getTimerCount()).toBe(1);
  queueVoice("Wake the waiting worker", signal().signal);
  expect(await pending).toBe(true);
  expect(vi.getTimerCount()).toBe(1); // Only the queued job's deadline remains.
  expect(takeVoiceJob()?.text).toBe("Wake the waiting worker");
  expect(takeVoiceJob()).toBe(null);
});
it("reports an existing job immediately without reserving it", async () => {
  takeVoiceJob();
  queueVoice("Already queued", signal().signal);
  expect(await waitForVoiceJob(signal().signal, 15_000)).toBe(true);
  expect(takeVoiceJob()?.text).toBe("Already queued");
});
it("cleans up an aborted wait and leaves later jobs available", async () => {
  vi.useFakeTimers();
  const controller = signal();
  const pending = waitForVoiceJob(controller.signal, 15_000);
  controller.abort();
  expect(await pending).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  queueVoice("After abort", signal().signal);
  expect(takeVoiceJob()?.text).toBe("After abort");
  expect(await waitForVoiceJob(controller.signal, 15_000)).toBe(false);
});
it("caps waits at twenty seconds and refreshes the heartbeat on timeout", async () => {
  vi.useFakeTimers();
  let settled = false;
  const pending = waitForVoiceJob(signal().signal, 100_000).then(value => { settled = true; return value; });
  await vi.advanceTimersByTimeAsync(19_999);
  expect(settled).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(await pending).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(50_000);
  expect(voiceWorkerReady()).toBe(true);
});
it("wakes multiple waiters but permits only one job claim", async () => {
  const first = waitForVoiceJob(signal().signal, 15_000);
  const second = waitForVoiceJob(signal().signal, 15_000);
  queueVoice("Only one claimant", signal().signal);
  expect(await Promise.all([first, second])).toEqual([true, true]);
  expect(takeVoiceJob()?.text).toBe("Only one claimant");
  expect(takeVoiceJob()).toBe(null);
});

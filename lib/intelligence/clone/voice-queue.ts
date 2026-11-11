import "server-only";
import { randomUUID, timingSafeEqual } from "node:crypto";
type Job = { id: string; text: string; claimed: boolean; sequence: number; controller: ReadableStreamDefaultController<Uint8Array>; timer: ReturnType<typeof setTimeout>; cleanup: () => void };
const state = globalThis as typeof globalThis & { cloneVoiceStream?: { heartbeat: number; jobs: Map<string, Job>; waiters?: Set<() => void> } };
const queue = state.cloneVoiceStream ??= { heartbeat: 0, jobs: new Map<string, Job>(), waiters: new Set<() => void>() };
const waiters = queue.waiters ??= new Set<() => void>();
const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value) + "\n");
export function workerAuthorized(header: string | null) {
  const secret = process.env.PAC_GEFFEN_WORKER_KEY;
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice(7)), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function voiceWorkerReady() { return Date.now() - queue.heartbeat < 60_000; }
/** Notify availability without claiming; the route rechecks owner pause before claiming. */
export function waitForVoiceJob(signal: AbortSignal, milliseconds: number): Promise<boolean> {
  queue.heartbeat = Date.now();
  if (signal.aborted) return Promise.resolve(false);
  const available = () => [...queue.jobs.values()].some(job => !job.claimed);
  if (available()) return Promise.resolve(true);
  const duration = Number.isFinite(milliseconds) ? Math.min(20_000, Math.max(0, Math.floor(milliseconds))) : 0;
  if (!duration) return Promise.resolve(false);
  return new Promise(resolve => {
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      waiters.delete(wake);
      signal.removeEventListener("abort", abort);
      queue.heartbeat = Date.now();
      resolve(ready);
    };
    const wake = () => { if (available()) finish(true); };
    const abort = () => finish(false);
    const timer = setTimeout(() => finish(false), duration);
    waiters.add(wake);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort(); else wake();
  });
}
export function takeVoiceJob() {
  queue.heartbeat = Date.now();
  const job = [...queue.jobs.values()].find(item => !item.claimed);
  if (!job) return null;
  job.claimed = true;
  return { id: job.id, text: job.text };
}
export function voiceJobActive(id: string) { queue.heartbeat = Date.now(); return queue.jobs.has(id); }
export function completeVoiceJob(id: string, audio: Uint8Array | null, sequence = 0, done = true) {
  queue.heartbeat = Date.now();
  const job = queue.jobs.get(id);
  if (!job || !job.claimed || sequence !== job.sequence) return false;
  job.sequence++;
  if (audio?.length) job.controller.enqueue(encode({ audio: Buffer.from(audio).toString("base64"), sequence }));
  if (done || !audio) {
    job.controller.enqueue(encode(audio ? { done: true } : { error: "The answer could not finish playing. You can still read it here." }));
    job.controller.close(); job.cleanup();
  }
  return true;
}
export function queueVoice(text: string, signal: AbortSignal): ReadableStream<Uint8Array> | null {
  if (!voiceWorkerReady() || queue.jobs.size >= 4 || signal.aborted) return null;
  const id = randomUUID();
  const cleanup = () => { const job = queue.jobs.get(id); if (job) clearTimeout(job.timer); queue.jobs.delete(id); signal.removeEventListener("abort", cancel); };
  const cancel = () => { const job = queue.jobs.get(id); if (job) { try { job.controller.close(); } catch {} } cleanup(); };
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const timer = setTimeout(() => { controller.enqueue(encode({ error: "Reading the answer aloud took too long, but the written answer is still here." })); cancel(); }, 580_000);
      queue.jobs.set(id, { id, text, claimed: false, sequence: 0, controller, timer, cleanup });
      signal.addEventListener("abort", cancel, { once: true });
      for (const wake of [...waiters]) wake();
    }, cancel: cleanup,
  });
}

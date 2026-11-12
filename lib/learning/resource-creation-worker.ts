import "server-only";

import { lstat } from "node:fs/promises";
import { join } from "node:path";
import { paused } from "@/lib/intelligence/orchestrator";
import {
  generateResourceArtifact, ResourceArtifactError, verifyArtifactSources,
} from "@/lib/intelligence/learning/resource-artifact-generation";
import { overviewVoiceAvailable } from "@/lib/intelligence/clone/overview-voice";
import type { ResourceArtifact } from "./resource-artifact-types";
import {
  claimCreation, creationFileNames, creationRoot, ensureCreationOutputDirectory,
  finishCreation, hasClaimableCreation, renewCreation, saveCreationArtifact,
  type CreationFileKind, type CreationLease,
} from "./resource-creation-store";

const state = globalThis as typeof globalThis & {
  resourceCreationWorkerStarted?: boolean;
  resourceCreationWorkerRunning?: boolean;
};

export function resourceCreationAvailable() {
  return !!creationRoot() && !!process.env.GEMINI_API_KEY?.trim();
}

async function processCreation(job: CreationLease, apiKey: string) {
  const leaseLost = new AbortController();
  const signal = AbortSignal.any([leaseLost.signal, AbortSignal.timeout(30 * 60_000)]);
  const heartbeat = setInterval(() => {
    try {
      if (!renewCreation(job)) leaseLost.abort();
    } catch {
      leaseLost.abort();
    }
  }, 25_000);
  heartbeat.unref();
  try {
    const artifact = job.artifact ? JSON.parse(job.artifact) as ResourceArtifact : await generateResourceArtifact({
      resourcePath: job.resourcePath, kind: job.kind, expectedRevision: job.revision, scope: job.scope,
    }, apiKey, AbortSignal.any([signal, AbortSignal.timeout(95_000)]));
    signal.throwIfAborted();
    if (artifact.sourceRevision !== job.revision || !(await verifyArtifactSources(artifact, job.scope))) {
      finishCreation(job, "stale", [], "The resource changed while this draft was being made. Start a new draft from the current version.");
      return;
    }
    if (!saveCreationArtifact(job, artifact)) return;
    const files: CreationFileKind[] = [];
    if (artifact.kind === "audio-overview" || artifact.kind === "video-overview") {
      if (!overviewVoiceAvailable(artifact.kind === "video-overview" ? "geffen" : "host1")) {
        finishCreation(job, "failed", [], "The approved voice service is unavailable. Your draft script is ready to review.");
        return;
      }
      const directory = ensureCreationOutputDirectory(job.id);
      const { renderResourceMedia } = await import("./resource-media-renderer");
      const rendered = await renderResourceMedia(artifact, directory, signal);
      for (const file of rendered) {
        if (!Object.hasOwn(creationFileNames, file.kind) || creationFileNames[file.kind].name !== file.fileName) {
          throw new Error("Resource creation output was invalid");
        }
        const stat = await lstat(join(directory, file.fileName));
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > 96 * 1024 * 1024) {
          throw new Error("Resource creation output was invalid");
        }
        if (!files.includes(file.kind)) files.push(file.kind);
      }
      const primary = artifact.kind === "audio-overview" ? "audio" : "video";
      if (![primary, "captions", "transcript"].every(kind => files.includes(kind as CreationFileKind))) {
        throw new Error("Resource creation output was incomplete");
      }
      signal.throwIfAborted();
      if (!(await verifyArtifactSources(artifact, job.scope))) {
        finishCreation(job, "stale", [], "The source changed before the recording was ready. Start a new draft from the current version.");
        return;
      }
    }
    finishCreation(job, "ready", files);
    console.info("resource_creation_ready", { kind: job.kind, files: files.length });
  } catch (error) {
    if (leaseLost.signal.aborted) return;
    if (error instanceof ResourceArtifactError && error.code === "stale") {
      finishCreation(job, "stale", [], "The source changed before generation finished. Start a new draft from the current version.");
    } else {
      console.warn("resource_creation_failed", { kind: job.kind, code: error instanceof ResourceArtifactError ? error.code : "processing" });
      finishCreation(job, "failed", [], error instanceof ResourceArtifactError && error.code === "insufficient"
        ? "This resource does not have enough published text for the requested draft."
        : "The draft could not finish. If a script is available, you can still review it and try a new draft later.");
    }
  } finally {
    clearInterval(heartbeat);
  }
}

async function tick() {
  if (state.resourceCreationWorkerRunning) return;
  state.resourceCreationWorkerRunning = true;
  try {
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key || !hasClaimableCreation() || await paused()) return;
    const job = claimCreation();
    if (job) await processCreation(job, key);
  } catch {
    console.warn("resource_creation_worker_unavailable");
  } finally {
    state.resourceCreationWorkerRunning = false;
  }
}

export function startResourceCreationWorker() {
  if (state.resourceCreationWorkerStarted || !resourceCreationAvailable()) return;
  state.resourceCreationWorkerStarted = true;
  setInterval(() => void tick(), 5000).unref();
}

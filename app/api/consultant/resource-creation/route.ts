import type { NextRequest } from "next/server";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { ownerFromRequest } from "@/lib/auth/request";
import { readBoundedJson } from "@/lib/http/request";
import { overviewVoiceAvailable } from "@/lib/intelligence/clone/overview-voice";
import { captureArtifactSourceRevision, searchArtifactResources } from "@/lib/intelligence/learning/resource-artifact-generation";
import { paused } from "@/lib/intelligence/orchestrator";
import { isResourceArtifactKind } from "@/lib/learning/resource-artifact-types";
import { creationJobId, creationJobView, enqueueCreation, findCreationJob, listCreationJobs } from "@/lib/learning/resource-creation-store";
import { resourceCreationAvailable, startResourceCreationWorker } from "@/lib/learning/resource-creation-worker";
import { requestedContentScope } from "@/lib/product/request-context";

export const runtime = "nodejs";
export const maxDuration = 45;
const headers = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const reply = (value: unknown, status = 200) => Response.json(value, { status, headers });
const unavailable = "Resource creation is temporarily unavailable.";
const unauthorized = "Sign in to the Consultant Workspace to create learning materials.";

export async function GET(request: NextRequest) {
  if (!(await ownerFromRequest(request))) return reply({ error: unauthorized }, 401);
  if (!resourceCreationAvailable()) return reply({ error: unavailable }, 503);
  try {
    const scope = await requestedContentScope();
    const query = request.nextUrl.searchParams;
    const id = query.get("id");
    if (id !== null) {
      const job = creationJobId.test(id) ? findCreationJob(id, scope) : undefined;
      return job ? reply({ job: creationJobView(job) }) : reply({ error: "Draft not found." }, 404);
    }
    const search = query.get("search");
    if (search !== null) {
      const offset = Number(query.get("offset") ?? 0);
      if (search.length > 160 || !Number.isSafeInteger(offset) || offset < 0 || offset > 20_000) {
        return reply({ error: "Check the catalog search and try again." }, 400);
      }
      return reply(await searchArtifactResources(search, offset, scope));
    }
    startResourceCreationWorker();
    return reply({ jobs: listCreationJobs(scope).map(creationJobView) });
  } catch {
    return reply({ error: unavailable }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!(await ownerFromRequest(request))) return reply({ error: unauthorized }, 401);
  if (!isSameOriginMutation(request)) return reply({ error: "Open the resource creation page before submitting." }, 403);
  if (!resourceCreationAvailable()) return reply({ error: unavailable }, 503);
  const body = await readBoundedJson(request, 4096);
  if (!body.ok) return reply({ error: body.message }, body.status);
  const { resourcePath, kind } = (body.value ?? {}) as { resourcePath?: unknown; kind?: unknown };
  if (typeof resourcePath !== "string" || resourcePath.length > 480 || !isResourceArtifactKind(kind)) {
    return reply({ error: "Choose a published resource and an output format." }, 400);
  }
  if ((kind === "audio-overview" && !overviewVoiceAvailable("host1")) ||
    (kind === "video-overview" && !overviewVoiceAvailable("geffen"))) {
    return reply({ error: "The approved overview voice service is temporarily unavailable." }, 503);
  }
  try {
    if (await paused()) return reply({ error: unavailable }, 503);
    const scope = await requestedContentScope();
    const source = await captureArtifactSourceRevision(resourcePath, scope);
    if (!source) return reply({ error: "Choose a published resource with readable source material." }, 404);
    const result = enqueueCreation({
      scope, resourcePath: source.resourcePath, title: source.title, kind, revision: source.sourceRevision,
    });
    if (!result) return reply({ error: "The creation queue is at its limit. Try again after the current drafts finish." }, 429);
    startResourceCreationWorker();
    return reply({ job: creationJobView(result.job) }, result.reused ? 200 : 202);
  } catch {
    return reply({ error: unavailable }, 503);
  }
}

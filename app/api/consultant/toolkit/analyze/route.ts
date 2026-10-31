import type { NextRequest } from "next/server";
import { z } from "zod";
import { readBoundedJson } from "@/lib/http/request";
import { toolkitRequestSchema } from "@/lib/consultant-toolkit/schema";
import { prepareToolkitDraft } from "@/lib/consultant-toolkit/service";
import { toolkitAccess, toolkitCapacity, toolkitFailure, toolkitJson } from "@/lib/consultant-toolkit/http";

export const runtime = "nodejs";
export const maxDuration = 180;
const schema = z.object({ request: toolkitRequestSchema }).strict();
export async function POST(request: NextRequest) {
  const denied = await toolkitAccess(request, true); if (denied) return denied;
  const body = await readBoundedJson(request, 3_200_000);
  if (!body.ok) return toolkitJson({ error: body.message }, body.status);
  const checked = schema.safeParse(body.value);
  if (!checked.success) return toolkitJson({ error: "Check the title, question, sources, and selected toolkit track." }, 400);
  const release = toolkitCapacity("analysis");
  if (!release) return toolkitJson({ error: "Finish the current draft or try again in a few minutes." }, 429);
  try { return toolkitJson(await prepareToolkitDraft(checked.data.request)); }
  catch (error) { return toolkitFailure(error); }
  finally { release(); }
}

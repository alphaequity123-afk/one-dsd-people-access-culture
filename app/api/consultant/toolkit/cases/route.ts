import type { NextRequest } from "next/server";
import { z } from "zod";
import { readBoundedJson } from "@/lib/http/request";
import { casePayloadSchema } from "@/lib/consultant-toolkit/schema";
import { createToolkitCase, listToolkitCases } from "@/lib/consultant-toolkit/cases";
import { toolkitAccess, toolkitFailure, toolkitJson } from "@/lib/consultant-toolkit/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({ payload: casePayloadSchema }).strict();
export async function GET(request: NextRequest) {
  const denied = await toolkitAccess(request); if (denied) return denied;
  const value = request.nextUrl.searchParams.get("offset") ?? "0";
  if (!/^\d{1,6}$/.test(value)) return toolkitJson({ error: "Choose a valid case-list page." }, 400);
  try { return toolkitJson(await listToolkitCases(Number(value))); } catch (error) { return toolkitFailure(error); }
}
export async function POST(request: NextRequest) {
  const denied = await toolkitAccess(request, true); if (denied) return denied;
  const body = await readBoundedJson(request, 3_200_000);
  if (!body.ok) return toolkitJson({ error: body.message }, body.status);
  const checked = schema.safeParse(body.value);
  if (!checked.success) return toolkitJson({ error: "This working copy could not be saved. Check the required fields and source references." }, 400);
  try { return toolkitJson({ case: await createToolkitCase(checked.data.payload) }, 201); } catch (error) { return toolkitFailure(error); }
}

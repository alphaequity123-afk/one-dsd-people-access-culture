import type { NextRequest } from "next/server";
import { z } from "zod";
import { readBoundedJson } from "@/lib/http/request";
import { casePayloadSchema } from "@/lib/consultant-toolkit/schema";
import { deleteToolkitCase, getToolkitCase, updateToolkitCase } from "@/lib/consultant-toolkit/cases";
import { toolkitAccess, toolkitFailure, toolkitJson } from "@/lib/consultant-toolkit/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const update = z.object({ expectedVersion: z.number().int().positive(), payload: casePayloadSchema, status: z.enum(["draft", "review", "final"]), approveFinal: z.boolean().optional() }).strict();
const remove = z.object({ expectedVersion: z.number().int().positive() }).strict();
export async function GET(request: NextRequest, context: Context) {
  const denied = await toolkitAccess(request); if (denied) return denied;
  try { const value = await getToolkitCase((await context.params).id); return value ? toolkitJson({ case: value }) : toolkitJson({ error: "This case was not found." }, 404); }
  catch (error) { return toolkitFailure(error); }
}
export async function PUT(request: NextRequest, context: Context) {
  const denied = await toolkitAccess(request, true); if (denied) return denied;
  const body = await readBoundedJson(request, 3_200_000);
  if (!body.ok) return toolkitJson({ error: body.message }, body.status);
  const checked = update.safeParse(body.value);
  if (!checked.success) return toolkitJson({ error: "Check the case version, fields, and requested review state." }, 400);
  try { return toolkitJson({ case: await updateToolkitCase((await context.params).id, checked.data.expectedVersion, checked.data.payload, checked.data.status, checked.data.approveFinal) }); }
  catch (error) { return toolkitFailure(error); }
}
export async function DELETE(request: NextRequest, context: Context) {
  const denied = await toolkitAccess(request, true); if (denied) return denied;
  const body = await readBoundedJson(request, 1000);
  if (!body.ok) return toolkitJson({ error: body.message }, body.status);
  const checked = remove.safeParse(body.value);
  if (!checked.success) return toolkitJson({ error: "Reopen the case before removing it." }, 400);
  try { await deleteToolkitCase((await context.params).id, checked.data.expectedVersion); return toolkitJson({ removed: true }); }
  catch (error) { return toolkitFailure(error); }
}

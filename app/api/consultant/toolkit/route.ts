import type { NextRequest } from "next/server";
import { toolkitAvailability } from "@/lib/consultant-toolkit/service";
import { toolkitAccess, toolkitFailure, toolkitJson } from "@/lib/consultant-toolkit/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const denied = await toolkitAccess(request); if (denied) return denied;
  try { return toolkitJson(await toolkitAvailability()); } catch (error) { return toolkitFailure(error); }
}

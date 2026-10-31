import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { consumeRequestLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { consultationIntakeEnabled } from "@/lib/intelligence/consult/availability";
import { intakePreview, intakeSubmit, intakeValidate } from "@/lib/intelligence/orchestrator";
const headers = { "cache-control": "no-store" };
const Body = z.object({mode:z.enum(["preview","submit"]),input:z.unknown(),idempotency_key:z.string().min(16).max(160).regex(/^[A-Za-z0-9_-]+$/)}).strict();
export async function POST(request: NextRequest) {
 if (!consultationIntakeEnabled()) return NextResponse.json({error:"Consultation requests have been removed. Please use the staff support directory."},{status:410,headers});
 if (!isSameOriginMutation(request)) return NextResponse.json({error:"Open the consultation form from this program."},{status:403,headers});
 const body=await readBoundedJson(request,32768);
 if (!body.ok) return NextResponse.json({error:body.message},{status:body.status,headers});
 const parsed=Body.safeParse(body.value);
 if (!parsed.success) return NextResponse.json({error:"Invalid consultation request."},{status:400,headers});
 try {
  const limit=await consumeRequestLimit(request,{scope:"consultation-intake",limit:20,windowSeconds:3600});
  if (!limit.allowed) return NextResponse.json({error:"Please wait before trying another request."},{status:429,headers:{...headers,...rateLimitHeaders(limit)}});
  const {input,mode,idempotency_key}=parsed.data;
  if(mode==="preview") {
   const validated=await intakeValidate(input);
   if (!("ok" in validated)) return NextResponse.json(validated,{status:400,headers});
   return NextResponse.json({kind:"preview",packet:await intakePreview(validated.input)},{headers});
  }
  const result=await intakeSubmit(input,idempotency_key);
  if(result.kind!=="created") return NextResponse.json(result,{status:result.kind==="conflict"?409:400,headers});
  const r=result.request;
  return NextResponse.json({kind:"created",duplicate:result.duplicate,request:{request_id:r.request_id,access_key:result.tracking_secret,work_name:r.work_name,created_at:r.created_at}},{status:result.duplicate?200:201,headers});
 } catch {return NextResponse.json({error:"We could not complete this request. Please retry using the same form."},{status:503,headers});}
}

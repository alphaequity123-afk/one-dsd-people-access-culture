import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { consumeRequestLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { consultationTrackingEnabled, consultationCorrectionEnabled } from "@/lib/intelligence/consult/availability";
import { intakeTrack, intakeCorrect, intakeWithdraw, intakeRotateKey } from "@/lib/intelligence/orchestrator";
const headers={"cache-control":"no-store"};
const key=z.string().min(32).max(160).regex(/^[A-Za-z0-9_-]+$/);
const Body=z.discriminatedUnion("action",[
 z.object({action:z.literal("lookup"),access_key:key}).strict(),
 z.object({action:z.literal("withdraw"),access_key:key}).strict(),
 z.object({action:z.literal("correct"),access_key:key,expected_version:z.number().int().positive(),corrections:z.unknown()}).strict(),
 z.object({action:z.literal("rotate_key"),access_key:key,expected_version:z.number().int().positive()}).strict(),
]);
export async function GET(){return NextResponse.json({error:"Use the secure request tracking form."},{status:405,headers:{...headers,allow:"POST"}});}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!consultationTrackingEnabled())return NextResponse.json({error:"Request tracking is temporarily unavailable."},{status:503,headers});
 if(!isSameOriginMutation(request))return NextResponse.json({error:"Open request tracking from this program."},{status:403,headers});
 const {id}=await params;
 if(!/^CR-[0-9]{8}-[0-9]{4,10}$/.test(id))return NextResponse.json({error:"Request not found."},{status:404,headers});
 const body=await readBoundedJson(request,32768);
 if(!body.ok)return NextResponse.json({error:body.message},{status:body.status,headers});
 const parsed=Body.safeParse(body.value);
 if(!parsed.success)return NextResponse.json({error:"Invalid tracking request."},{status:400,headers});
 try{
  const limit=await consumeRequestLimit(request,{scope:"consultation-tracking",limit:20,windowSeconds:600});
  if(!limit.allowed)return NextResponse.json({error:"Please wait before checking again."},{status:429,headers:{...headers,...rateLimitHeaders(limit)}});
  const b=parsed.data;
  if(b.action==="lookup") {const view=await intakeTrack(id,b.access_key);return view?NextResponse.json(view,{headers}):NextResponse.json({error:"Request not found."},{status:404,headers});}
  if(b.action==="withdraw"){const result=await intakeWithdraw(id,b.access_key);return result.ok?NextResponse.json({ok:true},{headers}):NextResponse.json({error:"This request could not be withdrawn."},{status:result.reason==="not_found"?404:409,headers});}
  if(b.action==="correct"&&!consultationCorrectionEnabled())return NextResponse.json({error:"Corrections are temporarily unavailable."},{status:503,headers});
  const result=b.action==="correct"?await intakeCorrect(id,b.access_key,b.corrections,b.expected_version):await intakeRotateKey(id,b.access_key,b.expected_version);
  if(result.kind==="updated")return NextResponse.json(result.request,{headers});
  if(result.kind==="rotated")return NextResponse.json(result,{headers});
  return NextResponse.json({...result,error:result.kind==="not_found"?"Request not found.":"This change could not be saved. Check the latest status and try again."},{status:result.kind==="not_found"?404:result.kind==="invalid"||result.kind==="refusal"?400:409,headers});
 }catch{return NextResponse.json({error:"Request tracking is temporarily unavailable. Please try again."},{status:503,headers});}
}

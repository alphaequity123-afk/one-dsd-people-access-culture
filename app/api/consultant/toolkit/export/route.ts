import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ownerFromRequest } from "@/lib/auth/request";
import { isSameOriginMutation } from "@/lib/auth/mutation";
import { readBoundedJson } from "@/lib/http/request";
import { getToolkitCase, ToolkitCaseError } from "@/lib/consultant-toolkit/cases";
import { toolkitReportWord, toolkitReportPdf, ToolkitPdfFontError } from "@/lib/consultant-toolkit/report";

export const runtime="nodejs";
export const maxDuration=60;
const headers={"cache-control":"private, no-store","x-content-type-options":"nosniff"};
const requestSchema=z.object({caseId:z.string().uuid(),expectedVersion:z.number().int().positive(),format:z.enum(["word","pdf","json"]),kind:z.enum(["report","worksheet","action-plan"])}).strict();
let running=0;
const error=(message:string,status:number)=>NextResponse.json({error:message},{status,headers});

export async function POST(request:NextRequest){
  if(!(await ownerFromRequest(request)))return error("Sign in to the Consultant Workspace before downloading.",401);
  if(!isSameOriginMutation(request))return error("Open the Consultant Workspace before downloading.",403);
  const body=await readBoundedJson(request,5000);if(!body.ok)return error("This download request could not be read.",body.status);
  const parsed=requestSchema.safeParse(body.value);if(!parsed.success)return error("Choose a saved analysis and a supported download format.",400);
  if(running>=2)return error("Two downloads are being prepared. Please try again shortly.",429);
  running++;
  try{
    const {caseId,expectedVersion,format,kind}=parsed.data;
    const saved=await getToolkitCase(caseId);if(!saved)return error("The saved analysis was not found.",404);
    if(saved.version!==expectedVersion)return error("This case changed in another window. Reopen it before downloading.",409);
    const data=format==="json"?new TextEncoder().encode(JSON.stringify(saved,null,2)):format==="word"?await toolkitReportWord(saved,kind):await toolkitReportPdf(saved,kind);
    const extension=format==="word"?"docx":format;
    const type=format==="word"?"application/vnd.openxmlformats-officedocument.wordprocessingml.document":format==="pdf"?"application/pdf":"application/json; charset=utf-8";
    return new Response(new Blob([new Uint8Array(data)],{type}),{headers:{...headers,"content-type":type,"content-disposition":`attachment; filename="equity-${kind}-${saved.status}.${extension}"`,"content-security-policy":"sandbox"}});
  }catch(cause){if(cause instanceof ToolkitCaseError)return error(cause.message,cause.status);if(cause instanceof ToolkitPdfFontError)return error(cause.message,422);return error("The download could not be prepared. Your saved analysis is unchanged.",500);}
  finally{running--;}
}

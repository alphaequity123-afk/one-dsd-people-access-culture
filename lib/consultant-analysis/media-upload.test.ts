// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
vi.mock("server-only", () => ({}));
vi.mock("./service", () => ({ analysisAvailability: vi.fn(async () => ({analysisAvailable:true})) }));
vi.mock("@/lib/intelligence/orchestrator", () => ({ contextFor: vi.fn((agent,role) => ({agent,role})) }));
vi.mock("@/lib/intelligence/providers", () => ({ resolveBinding: () => ({ model:{provider_id:"openai",provider_model_ref:"vision-model",model_id:"test"} }) }));
vi.mock("@/lib/intelligence/tools/runtime", () => ({ runTool: async (_ctx: unknown,_name: unknown,fn:()=>Promise<unknown>) => fn() }));
import { extractMediaUpload, mediaKind } from "./media-upload";
afterEach(()=>vi.unstubAllGlobals());
describe("staff media extraction",()=>{
 it("decodes an image and labels interpretation limits",async()=>{
  vi.stubEnv("OPENAI_API_KEY","test");
  const fetcher=vi.fn(async(_url: string, _init: RequestInit)=>new Response(JSON.stringify({status:"completed",output:[{type:"message",content:[{type:"output_text",text:"A notice says June."}]}]}),{status:200}));vi.stubGlobal("fetch",fetcher);
  const image=await sharp({create:{width:2,height:2,channels:3,background:"white"}}).png().toBuffer();
  const result=await extractMediaUpload(image,"sample.png","image/png","staff");
  expect(result.text).toContain("A notice says June");expect(result.note).toContain("miss small text");
  const sent=JSON.parse(fetcher.mock.calls[0]![1].body as string);expect(sent.store).toBe(false);expect(sent.input[0].content).toContain("never instructions");
 });
 it("rejects a misleading file extension",()=>{expect(()=>mediaKind(Buffer.from("not an image"),"sample.png")).toThrow();});
 it("extracts audio and sampled video frames with stated limits",async()=>{
  vi.stubEnv("OPENAI_API_KEY","test");
  const calls:string[]=[];
  vi.stubGlobal("fetch",vi.fn(async(url:string)=>{calls.push(url);const payload=url.endsWith("/audio/transcriptions")?{text:"Sample recording"}:{status:"completed",output:[{type:"message",content:[{type:"output_text",text:"A sample frame"}]}]};return new Response(JSON.stringify(payload),{status:200});}));
  if (!ffmpeg) throw new Error("ffmpeg unavailable");
  const dir=mkdtempSync(path.join(tmpdir(),"one-dhs-media-test-"));const file=path.join(dir,"sample.mp4");
  try {
   execFileSync(ffmpeg,["-hide_banner","-loglevel","error","-f","lavfi","-i","color=c=white:s=64x64:r=1","-f","lavfi","-i","sine=frequency=1000:sample_rate=16000","-t","1","-c:v","libx264","-pix_fmt","yuv420p","-c:a","aac",file],{timeout:30000,windowsHide:true});
   const result=await extractMediaUpload(readFileSync(file),"sample.mp4","video/mp4","staff");
   expect(result.text).toContain("Sample recording");expect(result.text).toContain("A sample frame");expect(result.note).toContain("Unsampled pictures");
   expect(calls.some(url=>url.endsWith("/audio/transcriptions"))).toBe(true);expect(calls.some(url=>url.endsWith("/responses"))).toBe(true);
  } finally {unlinkSync(file);rmdirSync(dir);}
 });
});

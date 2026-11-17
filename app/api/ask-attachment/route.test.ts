// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const f=vi.hoisted(()=>({ limit:vi.fn(), media:vi.fn() }));
vi.mock("@/lib/security/rate-limit",()=>({consumeRequestLimit:f.limit,rateLimitHeaders:()=>({})}));
vi.mock("@/lib/consultant-analysis/media-upload",()=>({acceptsMediaUpload:(name:string)=>name.endsWith(".png"),extractMediaUpload:f.media,MediaUploadError:class extends Error {status=422}}));
import { POST } from "./route";
const origin="http://localhost:8911";
beforeEach(()=>{vi.stubEnv("PAC_PUBLIC_ORIGIN",origin);f.limit.mockResolvedValue({allowed:true});f.media.mockReset();});
function request(name:string,bytes:string,host=origin){const data=new FormData();data.append("file",new File([bytes],name));return new NextRequest(origin+"/api/ask-attachment",{method:"POST",headers:{origin:host},body:data});}
describe("staff attachment intake",()=>{
 it("extracts document text",async()=>{const r=await POST(request("notice.txt","Fictional notice text"));expect(r.status).toBe(200);expect((await r.json()).source.text).toBe("Fictional notice text");});
 it("routes media using staff authority and returns disclosure",async()=>{f.media.mockResolvedValue({text:"Image text",note:"Check the image"});const r=await POST(request("image.png","image"));expect(r.status).toBe(200);expect(f.media.mock.calls[0][3]).toBe("staff");expect((await r.json()).note).toBe("Check the image");});
 it("rejects cross-origin uploads",async()=>{const r=await POST(request("a.txt","test","https://other.test"));expect(r.status).toBe(403);});
});

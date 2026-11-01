import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Doc } from "../retrieval/search";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ staff:vi.fn(), complete:vi.fn(), research:vi.fn() }));
vi.mock("../tools/runtime", () => ({ runTool: async (_ctx: unknown, _name: string, fn: () => unknown) => fn(), auditRefusal: async () => {} }));
vi.mock("./jev", () => ({ reviewWithJev: async () => "pass", planWithJev: async () => ({ route:"resources", evidence:"sufficient" }), SPECIALIST_GUIDANCE: { resources:"Use current evidence." } }));
vi.mock("../retrieval/local-semantic", () => ({ semanticRetrieveForAgent: async () => [], SemanticSearchUnavailable: class extends Error {} }));
vi.mock("../retrieval/program-resources", () => ({ indexedProgramResources: async () => ({ destinations:[], communityDocs:[] }), programResourceLinks: () => [] }));
vi.mock("../retrieval/staff-search", () => ({ indexedStaffDocs: f.staff }));
vi.mock("../providers", () => ({ resolveBinding: () => ({ generative:true, model:{ model_id:"synthetic-media" }, adapter:{ complete:f.complete } }) }));
vi.mock("../research", () => ({ governedResearch:f.research, governedSearch:async()=>{throw Error("Unexpected research");} }));
import { askConcierge } from "../agents/ask";
import { getAgent } from "../registry/agents";

const doc: Doc = { kind:"content", id:"asset-media-123", title:"Synthetic access recording", href:"/resources/approved-resource#resource-listen-approved-resource", authority:"learning", type:"public_resource_media_transcript", status:"approved", reviewDate:"", scope:"dsd", summary:"A fictional recording explains accessible service notices.", text:"A fictional recording explains accessible service notices.", tags:["recording","access"], intents:[], evidenceRevisions:[{sourceId:"asset-media-123",revisionId:"00000000-0000-4000-8000-000000000001",payloadHash:"a".repeat(64),scope:"dsd"}] };
const answer = "Synthetic generated text based on the recording.";
beforeEach(()=>{
  vi.resetAllMocks();
  vi.stubEnv("PAC_CLONE_AGENTS","on"); vi.stubEnv("PAC_STORE","memory"); vi.stubEnv("PAC_CONTENT_SOURCE","static");
  vi.stubGlobal("fetch",vi.fn(()=>{throw Error("Network blocked");}));
  f.complete.mockResolvedValue({parsed:{shortAnswer:answer,whyItMatters:"",limits:[],resourceHrefs:[],evidenceClaims:[]}});
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});

describe("Ask dynamic media currentness",()=>{
  it.each(["withdrawn","changed","unavailable"])("withholds the entire generated answer when media is %s",async state=>{
    f.staff.mockResolvedValueOnce([doc]);
    if(state==="withdrawn")f.staff.mockResolvedValue([]);
    else if(state==="changed")f.staff.mockResolvedValue([{...doc,text:"A revised recording.",summary:"A revised recording."}]);
    else f.staff.mockRejectedValue(Error("synthetic_db_failure"));
    const result=await askConcierge({question:"Using only this application, what does the synthetic access recording explain?",contextPreference:"one_dsd"},{agent:getAgent("ask_concierge"),role:"staff",dry_run:false,trace_id:"4cecf283-d438-4528-a884-c7b2cc30b68a"});
    expect(result.kind).toBe("answer");
    if(result.kind!=="answer")return;
    expect(result.answer.failureCode).toBe("public_media_currentness_failed");
    expect(result.answer.sources).toEqual([]); expect(result.answer.nextActions).toEqual([]);
    expect(JSON.stringify(result.answer)).not.toContain(answer);
  },20000);
  it("retains the generated answer when every supplied media passage remains current",async()=>{
    f.staff.mockResolvedValue([doc]);
    const result=await askConcierge({question:"Using only this application, what does the synthetic access recording explain?",contextPreference:"one_dsd"},{agent:getAgent("ask_concierge"),role:"staff",dry_run:false,trace_id:"4cecf283-d438-4528-a884-c7b2cc30b68a"});
    expect(result.kind).toBe("answer");
    if(result.kind==="answer") { expect(result.answer.shortAnswer).toBe(answer); expect(result.answer.failureCode).toBeUndefined(); }
  },20000);
});

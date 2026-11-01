import { afterEach, describe, expect, it, vi } from "vitest";
import type { ContentItem } from "@/lib/content/types";
import type { RuntimeSql } from "@/lib/db/runtime-client";
import { publicResourceMediaDocs, projectPublicResourceMedia, publicResourceMediaStillCurrent, readPublicResourceMediaLines, type PublicResourceMediaLine } from "./public-resource-media";

const parent = { id:"approved-resource", title:"Public resource", status:"approved", authority:"learning", reviewDate:"2026-10-01" } as ContentItem;
const line = (): PublicResourceMediaLine => ({ content_item_id:parent.id, revision_id:"00000000-0000-4000-8000-000000000001", publication_hash:"a".repeat(64), publication_scope:"dsd", resource_media_id:"00000000-0000-4000-8000-000000000002", media_title:"Public recording", line_number:1, line_text:"A public fictional example explains accessible services." });
afterEach(() => vi.unstubAllEnvs());

describe("scoped public resource media", () => {
  it("is disabled until explicitly enabled and does not contact a database", async () => {
    vi.stubEnv("PAC_PUBLIC_RESOURCE_MEDIA_INDEX", "off");
    expect(await publicResourceMediaDocs([parent],"dsd")).toEqual([]);
  });
  it("projects exact citation-sized text only for an approved visible parent", () => {
    const rows=[{...line(),line_text:("Accessible public example 🙂 ".repeat(50)).trim()}];
    const docs=projectPublicResourceMedia(rows,[parent],"dsd");
    expect(docs.length).toBeGreaterThan(1);
    expect(docs.every(doc=>Array.from(doc.text).length<=300 && doc.summary===doc.text)).toBe(true);
    expect(docs.map(doc=>doc.text).join(" ")).toBe(rows[0].line_text.replace(/\s+/g," ").trim());
    expect(docs.every(doc=>doc.href===`/resources/${parent.id}#resource-listen-${parent.id}`)).toBe(true);
    expect(()=>projectPublicResourceMedia(rows,[{...parent,status:"under_review"}],"dsd")).toThrow("public_media_parent_mismatch");
    expect(()=>projectPublicResourceMedia(rows,[],"dsd")).toThrow("public_media_parent_mismatch");
  });
  it("rejects sensitive information before any script can enter retrieval", () => {
    expect(()=>projectPublicResourceMedia([{...line(),line_text:"The client's social security number is 123-45-6789."}],[parent],"dsd")).toThrow("public_media_safety_failed");
  });
  it("invalidates changed, withdrawn, or relabeled media without accepting stale evidence", () => {
    const original=projectPublicResourceMedia([line()],[parent],"dsd");
    expect(publicResourceMediaStillCurrent(original,original)).toBe(true);
    expect(publicResourceMediaStillCurrent(original,[])).toBe(false);
    expect(publicResourceMediaStillCurrent(original,projectPublicResourceMedia([{...line(),line_text:"A revised example."}],[parent],"dsd"))).toBe(false);
    expect(publicResourceMediaStillCurrent(original,projectPublicResourceMedia([{...line(),media_title:"A different title"}],[parent],"dsd"))).toBe(false);
  });
  it("reads bounded pages and fails without returning partial data on a later error", async () => {
    let calls=0;
    const page=Array.from({length:250},(_,i)=>({...line(),line_number:i+1}));
    const tx=Object.assign(async()=>{calls++; if(calls===1)return page; throw Error("synthetic_db_failure");},{array:(ids:string[])=>ids});
    const fake={begin:async(_opts:string,fn:(value:typeof tx)=>unknown)=>fn(tx)} as unknown as RuntimeSql;
    await expect(readPublicResourceMediaLines(fake,"dsd",[parent.id])).rejects.toThrow("synthetic_db_failure");
    expect(calls).toBe(2);
    await expect(readPublicResourceMediaLines(fake,"dsd",Array.from({length:5001},(_,i)=>String(i)))).rejects.toThrow("public_media_parent_limit_exceeded");
  });
});

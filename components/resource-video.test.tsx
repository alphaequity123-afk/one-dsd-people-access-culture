import React from "react";
import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { captionsFromScript, ResourceVideo } from "./resource-video";
import { SyncedAudio } from "./synced-audio";
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
const script=[{start:0,end:3,text:"Read <the> source & compare."}];
it("uses only valid provided timing and escapes cue markup",()=>{
 expect(captionsFromScript(script)).toContain("00:00:00.000 --> 00:00:03.000\nRead &lt;the&gt; source &amp; compare.");
 expect(captionsFromScript([{start:3,end:1,text:"Invalid"}])).toBeNull();
 expect(captionsFromScript([])).toBeNull();
});
it("attaches captions without forcing preference and revokes the URL",async()=>{
 const revoke=vi.fn();vi.stubGlobal("URL",{createObjectURL:vi.fn(()=>"blob:captions"),revokeObjectURL:revoke});
 const v=render(<ResourceVideo src="/sample.mp4" title="Sample" script={script}/>);
 await waitFor(()=>expect(v.container.querySelector("track")?.getAttribute("src")).toBe("blob:captions"));
 expect(v.container.querySelector("track")?.hasAttribute("default")).toBe(false);
 v.unmount();expect(revoke).toHaveBeenCalledWith("blob:captions");
});
it("keeps script reading still until the learner chooses to follow",()=>{
 const v=render(<SyncedAudio src="/sample.mp3" title="Sample" script={script}/>);
 expect((v.getByRole("checkbox",{name:"Follow along"}) as HTMLInputElement).checked).toBe(false);
 expect(v.getByRole("button",{name:"Read <the> source & compare."}).tagName).toBe("BUTTON");
 fireEvent.error(v.container.querySelector("audio")!);
 expect(v.getByRole("status").textContent).toContain("transcript below");
});
it("allows in-memory caption tracks independently of Ask configuration",()=>{
 const config=readFileSync("next.config.ts","utf8");
 // v2 rebuild: the page may also play training video from the live One DSD course-media bucket.
 expect(config).toContain("value: contentSecurityPolicy + `; media-src 'self' blob: ${LIVE_DSD_MEDIA_HOST}`");
 expect(config).not.toContain('contentSecurityPolicy + (askVoiceAllowed ?');
});

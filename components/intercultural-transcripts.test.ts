import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import transcripts from "@/lib/content/intercultural-transcripts.json";
import media from "@/lib/content/intercultural-verified-media.json";
it("preserves every delivered caption in the complete lesson transcript",()=>{
 expect(Object.keys(transcripts)).toHaveLength(7);
 for (const lesson of media.lessons) {
  const vtt=readFileSync(`public${lesson.captions}`,"utf8");
  const cues=vtt.replace(/\r/g,"").split(/\n\s*\n/).flatMap(block=>{
   const lines=block.split("\n");const index=lines.findIndex(line=>line.includes(" --> "));
   return index<0?[]:[lines.slice(index+1).join(" ")];
  }).join(" ").trim();
  const chapters=(transcripts as Record<string,{title:string;text:string}[]>)[lesson.id];
  expect(chapters.map(ch=>ch.title)).toEqual(lesson.chapters.map(ch=>ch.title));
  expect(chapters.map(ch=>ch.text).join(" ").trim()).toBe(cues);
 }
});

import "server-only";

import { resourceExportSources } from "@/lib/client/resource-creation-exports";
import type { ResourceArtifact } from "./resource-artifact-types";

type Slides = Extract<ResourceArtifact, { kind: "slides" }>;

export async function resourcePowerPoint(artifact: Slides, origin: string) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = artifact.title;
  pptx.subject = "Draft learning material";
  pptx.author = "One DHS People, Access and Culture";
  pptx.company = "Minnesota Department of Human Services";
  pptx.defineSlideMaster({title:"Accessible learning",background:{color:"F4F8FA"},objects:[
    {placeholder:{options:{name:"title",type:"title",x:.65,y:.35,w:12,h:1.1,fontSize:32,color:"173951"}}},
    {placeholder:{options:{name:"body",type:"body",x:.85,y:1.65,w:11.6,h:4.6,fontSize:23,color:"173951"}}},
  ]});
  const titleCounts=new Map<string,number>();
  const sources = resourceExportSources(artifact, origin);
  const byId = new Map(sources.map(source => [source.id, source]));

  function frame(title: string) {
    const slide = pptx.addSlide({masterName:"Accessible learning"});
    const count=(titleCounts.get(title)??0)+1;titleCounts.set(title,count);
    if(count>1)title=`${title} (${count})`;
    slide.background = { color: "F4F8FA" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: "18768A" }, line: { color: "18768A" } });
    slide.addText(title, { placeholder:"title",objectName:"Slide title",x: 0.65, y: 0.35, w: 12, h: 1.1, fontSize: 32, bold: true, color: "173951", fit: "shrink", margin: 0 });
    return slide;
  }

  const cover = frame(artifact.title);
  cover.addText(artifact.summary, { placeholder:"body",objectName:"Summary",x: 0.65, y: 1.65, w: 11.8, h: 4.7, fontSize: 24, color: "294E65", fit: "shrink", valign: "top", margin: 0 });
  cover.addText("Draft for review", { x: 0.65, y: 6.75, w: 11.8, h: 0.3, fontSize: 12, color: "294E65", margin: 0 });
  for (const section of artifact.sections) {
    const slide = frame(section.heading);
    slide.addText(section.points.join("\n"), {
      placeholder:"body",objectName:"Learning points",
      x: 0.85, y: 1.65, w: 11.6, h: 4.6, fontSize: 23, color: "173951", bullet: true,
      breakLine: true, paraSpaceAfter: 12, valign: "top", fit: "shrink",
    });
    const citations = [...new Set(section.sourceIds)].flatMap(id => {
      const source = byId.get(id);
      return source ? [source] : [];
    });
    if (citations.length) slide.addText(citations.map(source => ({
      text: `[${source.number}]  `,
      options: { hyperlink: { url: source.url }, color: "185D77" },
    })), { x: 0.65, y: 6.8, w: 12, h: 0.35, fontSize: 12, margin: 0 });
    slide.addNotes([section.speakerNotes, ...citations.map(source => `[${source.number}] ${source.title}: ${source.url}`)].join("\n\n"));
  }
  for (let index = 0; index < sources.length; index += 8) {
    const slide = frame(index ? "Sources, continued" : "Sources");
    sources.slice(index, index + 8).forEach((source, row) => slide.addText(
      `[${source.number}] ${source.title}`,
      { x: 0.65, y: 1.65 + row * 0.65, w: 12, h: 0.55, fontSize: 18, color: "185D77", fit: "shrink", hyperlink: { url: source.url }, margin: 0 },
    ));
  }
  const bytes = await pptx.write({ outputType: "nodebuffer", compression: true });
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 4) throw new Error("PowerPoint archive is unavailable");
  return new Uint8Array(bytes);
}

import { localStudyHref } from "./resource-study-links";
import type { ResourceArtifact } from "@/lib/learning/resource-artifact-types";

type Slides = Extract<ResourceArtifact, { kind: "slides" }>;
type Visual = Extract<ResourceArtifact, { kind: "mind-map" | "infographic" }>;

function sourcesFor(artifact: ResourceArtifact, origin: string) {
  return artifact.sources.filter(source => localStudyHref(source.href)).map((source, index) => ({
    ...source, number: index + 1, url: new URL(source.href, origin).href,
  }));
}

export async function resourcePowerPoint(artifact: Slides, origin: string) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = artifact.title;
  pptx.subject = "Draft learning material";
  const sources = sourcesFor(artifact, origin);
  const byId = new Map(sources.map(source => [source.id, source]));

  function frame(title: string) {
    const slide = pptx.addSlide();
    slide.background = { color: "F4F8FA" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: "18768A" }, line: { color: "18768A" } });
    slide.addText(title, { x: 0.65, y: 0.35, w: 12, h: 1.1, fontSize: 32, bold: true, color: "173951", fit: "shrink", margin: 0 });
    return slide;
  }

  const cover = frame(artifact.title);
  cover.addText(artifact.summary, { x: 0.65, y: 1.65, w: 11.8, h: 4.7, fontSize: 24, color: "294E65", fit: "shrink", valign: "top", margin: 0 });
  cover.addText("Draft for review", { x: 0.65, y: 6.75, w: 11.8, h: 0.3, fontSize: 12, color: "294E65", margin: 0 });
  for (const section of artifact.sections) {
    const slide = frame(section.heading);
    slide.addText(section.points.join("\n"), {
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
  return pptx;
}

function htmlText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function resourceVisualHtml(artifact: Visual, origin: string) {
  const sources = sourcesFor(artifact, origin);
  const byId = new Map(sources.map(source => [source.id, source]));
  const sections = artifact.kind === "mind-map" ? artifact.sections.map(section => ({
    ...section, body: `<ul>${section.branches.map(branch => `<li>${htmlText(branch)}</li>`).join("")}</ul>`,
  })) : artifact.sections.map(section => ({
    ...section, body: `<p>${htmlText(section.text)}</p><details><summary>Visual direction</summary><p>${htmlText(section.visualCue)}</p></details>`,
  }));
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${htmlText(artifact.title)}</title>
<style>
body{font:1.1rem/1.55 system-ui,sans-serif;color:#173951;background:#f4f8fa;margin:0}
main{max-width:68rem;margin:auto;padding:clamp(1rem,4vw,3rem)}
header{background:#173951;color:white;padding:clamp(1rem,4vw,2rem);border-radius:.5rem}
h1,h2,p{overflow-wrap:anywhere}h1,h2{line-height:1.2}header p{margin-bottom:0}
.branches{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1rem;padding:0;list-style:none}
.branches>li{background:white;border:1px solid #c6d9df;border-top:.35rem solid #18768a;border-radius:.4rem;padding:1rem}
.branches h2{margin-top:0;font-size:1.2rem}.branches p{white-space:pre-wrap}
a{color:#165a76;text-underline-offset:.18rem}a:focus-visible{outline:.2rem solid #18768a;outline-offset:.15rem}
summary{cursor:pointer;font-weight:600}.cites{font-size:.95rem}
@media print{body{background:white}.branches>li{break-inside:avoid}header{background:white;color:#173951}}
</style></head>
<body><main><header><p>Draft for review</p><h1>${htmlText(artifact.title)}</h1><p>${htmlText(artifact.summary)}</p></header>
<ul class="branches">${sections.map(section => `<li><h2>${htmlText(section.heading)}</h2>${section.body}
<p class="cites">${[...new Set(section.sourceIds)].flatMap(id => {
    const source = byId.get(id);
    return source ? [`<a href="${htmlText(source.url)}" aria-label="${htmlText(`Source ${source.number}: ${source.title}`)}">[${source.number}]</a>`] : [];
  }).join(" ")}</p></li>`).join("")}</ul>
${sources.length ? `<section><h2>Sources cited</h2><ol>${sources.map(source => `<li><a href="${htmlText(source.url)}">${htmlText(source.title)}</a></li>`).join("")}</ol></section>` : ""}
</main></body></html>`;
}

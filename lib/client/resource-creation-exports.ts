import { localStudyHref } from "./resource-study-links";
import type { ResourceArtifact } from "@/lib/learning/resource-artifact-types";

type Visual = Extract<ResourceArtifact, { kind: "mind-map" | "infographic" }>;

export function resourceExportSources(artifact: ResourceArtifact, origin: string) {
  return artifact.sources.filter(source => localStudyHref(source.href)).map((source, index) => ({
    ...source, number: index + 1, url: new URL(source.href, origin).href,
  }));
}

function htmlText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function resourceVisualHtml(artifact: Visual, origin: string) {
  const sources = resourceExportSources(artifact, origin);
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

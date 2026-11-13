"use client";
import { SourceLink } from "@/components/app-link";


import { resourceVisualHtml } from "@/lib/client/resource-creation-exports";
import { localStudyHref } from "@/lib/client/resource-study-links";
import type { ResourceArtifact } from "@/lib/learning/resource-artifact-types";

export type ResourceCreationFile = { kind: "audio" | "video" | "captions" | "transcript"; href: string; mime: string };

type PreviewBlock = {
  heading: string;
  text?: string;
  points?: string[];
  detail?: { label: string; text: string };
  sourceIds: string[];
};

function previewBlocks(artifact: ResourceArtifact): PreviewBlock[] {
  switch (artifact.kind) {
    case "study-guide":
      return artifact.sections;
    case "quiz":
      return artifact.sections.map((item, index) => ({
        heading: `${index + 1}. ${item.question}`,
        points: item.options,
        detail: { label: "Show answer and explanation", text: `${item.options[item.correctIndex]}\n\n${item.explanation}` },
        sourceIds: item.sourceIds,
      }));
    case "flashcards":
      return artifact.sections.map(item => ({
        heading: item.front, detail: { label: "Show answer", text: item.back }, sourceIds: item.sourceIds,
      }));
    case "mind-map":
      return artifact.sections.map(item => ({ heading: item.heading, points: item.branches, sourceIds: item.sourceIds }));
    case "slides":
      return artifact.sections.map(item => ({
        heading: item.heading, points: item.points,
        detail: { label: "Speaker notes", text: item.speakerNotes }, sourceIds: item.sourceIds,
      }));
    case "infographic":
      return artifact.sections.map(item => ({
        heading: item.heading, text: item.text,
        detail: { label: "Visual direction", text: item.visualCue }, sourceIds: item.sourceIds,
      }));
    case "audio-overview":
      return artifact.sections.map(item => ({
        heading: item.speaker === "host1" ? "Host 1" : "Host 2", text: item.text, sourceIds: item.sourceIds,
      }));
    case "video-overview":
      return artifact.sections.map(item => ({
        heading: item.heading, text: item.narration, points: item.onScreen,
        detail: { label: "Visual direction", text: item.visualCue }, sourceIds: item.sourceIds,
      }));
  }
}

const fileLabels: Record<ResourceCreationFile["kind"], string> = {
  audio: "Download audio",
  video: "Download video",
  captions: "Download captions",
  transcript: "Download transcript",
};

export function ResourceCreationMedia({ files }: { files: ResourceCreationFile[] }) {
  const usable = files.filter(file => localStudyHref(file.href));
  const audio = usable.find(file => file.kind === "audio");
  const video = usable.find(file => file.kind === "video");
  const captions = usable.find(file => file.kind === "captions");
  if (!usable.length) return null;
  return <section className="mt-4 space-y-3" aria-label="Preview and downloads">
    {audio ? <audio controls preload="none" src={audio.href} aria-label="Two-host audio overview" className="w-full">
      {captions ? <track kind="captions" src={captions.href} srcLang="en" label="English" /> : null}
    </audio> : null}
    {video ? <video controls preload="metadata" src={video.href} aria-label="Narrated video overview" className="aspect-video w-full bg-black">
      {captions ? <track kind="captions" src={captions.href} srcLang="en" label="English" default /> : null}
    </video> : null}
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {usable.map(file => <li key={file.href}><SourceLink href={file.href} download className="inline-flex min-h-11 items-center underline underline-offset-4">{fileLabels[file.kind]}</SourceLink></li>)}
    </ul>
  </section>;
}

function markdownText(value: string) {
  return value.replace(/[\\`*_{}[\]<>]/g, "\\$&");
}

function downloadText(content: string, mime: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ResourceCreationPreview({ artifact, powerPointHref }: { artifact: ResourceArtifact; powerPointHref?: string }) {
  const blocks = previewBlocks(artifact);
  const sources = artifact.sources.filter(source => localStudyHref(source.href));
  const numberById = new Map(sources.map((source, index) => [source.id, index + 1]));
  const visual = artifact.kind === "mind-map" || artifact.kind === "infographic";

  function exportHtml() {
    if (artifact.kind === "mind-map" || artifact.kind === "infographic") {
      downloadText(resourceVisualHtml(artifact, window.location.origin), "text/html;charset=utf-8", `${artifact.kind}-draft.html`);
    }
  }

  function exportMarkdown() {
    const content = [
      `# ${markdownText(artifact.title)}`, markdownText(artifact.summary),
      ...blocks.map(block => [
        `## ${markdownText(block.heading)}`,
        block.text ? markdownText(block.text) : "",
        block.points?.map(point => `- ${markdownText(point)}`).join("\n"),
        block.detail ? `**${block.detail.label}**\n\n${markdownText(block.detail.text)}` : "",
        block.sourceIds.map(id => numberById.get(id)).filter(Boolean).map(number => `[${number}]`).join(" "),
      ].filter(Boolean).join("\n\n")),
      "## Sources",
      sources.map((source, index) => `${index + 1}. ${markdownText(source.title)} — ${new URL(source.href, window.location.origin).href}`).join("\n"),
    ].filter(Boolean).join("\n\n");
    downloadText(content, "text/markdown;charset=utf-8", `${artifact.kind}-draft.md`);
  }
  return <article className="mt-5 border-t border-line pt-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-bold">{artifact.title}</h3>
      <div className="flex flex-wrap gap-2">
        {artifact.kind === "slides" && localStudyHref(powerPointHref)
          ? <SourceLink href={powerPointHref} download className="btn min-h-11">Download editable PowerPoint</SourceLink> : null}
        {visual ? <button type="button" className="btn min-h-11" onClick={exportHtml}>Download visual as HTML</button> : null}
        <button type="button" className="btn min-h-11" onClick={exportMarkdown}>Download draft as Markdown</button>
      </div>
    </div>
    <p className="mt-2 whitespace-pre-wrap">{artifact.summary}</p>
    {artifact.kind === "mind-map" ? <p className="mx-auto mt-4 max-w-fit rounded border border-[#18768a] bg-[#e7f2f5] px-4 py-3 text-center font-bold">{artifact.title}</p> : null}
    <div className={visual ? "mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3" : "mt-4 space-y-4"}>
      {blocks.map((block, index) => <section key={index} className={visual
        ? "min-w-0 break-words rounded border border-t-4 border-line border-t-[#18768a] bg-[#f4f8fa] p-3"
        : "border-t border-line pt-3"}>
        <h4 className="font-semibold">{block.heading}</h4>
        {block.text ? <p className="mt-2 whitespace-pre-wrap">{block.text}</p> : null}
        {block.points?.length ? <ul className="mt-2 list-disc space-y-1 pl-6">{block.points.map((point, index) => <li key={index}>{point}</li>)}</ul> : null}
        {block.detail ? <details className="mt-2">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold">{block.detail.label}</summary>
          <p className="whitespace-pre-wrap">{block.detail.text}</p>
        </details> : null}
        {block.sourceIds.length ? <p className="mt-2 text-sm">
          {Array.from(new Set(block.sourceIds)).map(id => {
            const number = numberById.get(id);
            return number ? <SourceLink key={id} href={sources[number - 1].href} className="mr-2 underline" aria-label={`Source ${number}: ${sources[number - 1].title}`}>[{number}]</SourceLink> : null;
          })}
        </p> : null}
      </section>)}
    </div>
    {sources.length ? <section className="mt-5 border-t border-line pt-3">
      <h4 className="font-semibold">Sources cited</h4>
      <ol className="mt-2 list-decimal space-y-1 pl-6">{sources.map(source => <li key={source.id}><SourceLink href={source.href} className="underline">{source.title}</SourceLink></li>)}</ol>
    </section> : null}
  </article>;
}


import { SourceLink } from "@/components/app-link";
import { FeaturedMediaPanel } from "@/components/featured-media-panel";
import { listResourceMedia, mediaAvailable, videoEmbedUrl, type ResourceMediaItem } from "@/lib/content/media";
import { ResourceMediaManager } from "@/components/resource-media-manager";
import { SyncedAudio } from "@/components/synced-audio";
import { ResourceVideo } from "@/components/resource-video";
import type { ReactNode } from "react";

/**
 * Images, infographics, video, and documents attached to a resource. Shown to
 * everyone. The consultant also sees controls to add and delete items.
 */
export async function ResourceMediaGallery({ contentItemId, owner, visualFallback }: { contentItemId: string; owner: boolean; visualFallback?: ReactNode }) {
  let items: ResourceMediaItem[] = [];
  // Keep connection diagnostics in logs and owner controls, not staff resource pages.
  let unavailable: "not-connected" | "failed" | null = mediaAvailable() ? null : "not-connected";
  if (!unavailable) {
    try {
      items = await listResourceMedia(contentItemId);
    } catch (error) {
      unavailable = "failed";
      console.error("Resource media could not be read.", error instanceof Error ? error.message : error);
    }
  }
  if (items.length === 0 && !owner) return visualFallback ?? null;
  const audio = items.filter((item) => item.kind === "audio");
  const visual = items.filter((item) => item.kind !== "audio");
  const showVisualHeading = visual.length > 0 || owner;
  const headingId = `resource-media-${contentItemId}`;
  const noticeId = `resource-media-notice-${contentItemId}`;

  return <>
    {!items.some(item => item.kind === "image" || item.kind === "video") ? visualFallback : null}
    <section className="mt-6" aria-labelledby={showVisualHeading ? headingId : unavailable ? noticeId : `resource-listen-${contentItemId}`} data-resource-media="true">
      {unavailable ? (
        <p id={noticeId} className="notice notice--warn" role="status" data-resource-media-unavailable={unavailable}>
          {unavailable === "failed"
            ? "Attached files are temporarily unavailable."
            : "Attached files are unavailable."}
        </p>
      ) : null}
      {audio.length > 0 ? (
        <FeaturedMediaPanel kind="audio" label="Listen"><div data-resource-listen="true">
          <h2 id={`resource-listen-${contentItemId}`} className="m-0 text-xl font-extrabold">Listen to this resource</h2>
          {audio.map((item) => (
            <figure key={item.id} className="m-0 mt-3">
              {item.script && item.script.length > 0
                ? <SyncedAudio src={item.mediaId ? `/api/media/${item.mediaId}` : item.externalUrl ?? ""} title={item.title || "Read aloud"} script={item.script} />
                : <audio controls preload="none" src={item.mediaId ? `/api/media/${item.mediaId}` : item.externalUrl ?? undefined} style={{ width: "100%" }} aria-label={item.title || "Read aloud"} />}
              {owner && !item.script?.length ? <p className="notice notice--warn">Accessibility review needed: no transcript is attached to this audio.</p> : null}
              {item.title ? <figcaption className="mt-1 text-sm">{item.title}</figcaption> : null}
              {owner ? <ResourceMediaManager contentItemId={contentItemId} deleteId={item.id} deleteTitle={item.title || item.fileName || "audio"} /> : null}
            </figure>
          ))}
        </div></FeaturedMediaPanel>
      ) : null}
      {showVisualHeading ? <h2 id={headingId} className="mt-6 text-xl font-extrabold">Images, video, and documents</h2> : null}
      <div className="mt-4 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {visual.map((item) => (
          <figure key={item.id} className="m-0" style={{ position: "relative" }}>
            <MediaBody item={item} />
            {item.kind === "video" && item.script?.length ? <details><summary>Read the transcript for {item.title || "this video"}</summary>{item.script.map((line, index) => <p key={index}>{line.text}</p>)}</details> : null}
            {owner && item.kind === "video" && !item.script?.length ? <p className="notice notice--warn">Accessibility review needed: no timed transcript is attached to this video. Confirm its captions and any essential visual descriptions before sharing it.</p> : null}
            {item.title ? <figcaption className="mt-2 text-sm">{item.title}</figcaption> : null}
            {owner ? <ResourceMediaManager contentItemId={contentItemId} deleteId={item.id} deleteTitle={item.title || item.fileName || item.kind} /> : null}
          </figure>
        ))}
      </div>
      {owner ? <ResourceMediaManager contentItemId={contentItemId} /> : null}
    </section>
  </>;
}

function MediaBody({ item }: { item: ResourceMediaItem }) {
  const fileUrl = item.mediaId ? `/api/media/${item.mediaId}` : null;
  if (item.kind === "image" && fileUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img loading="lazy" decoding="async" src={fileUrl} alt={item.alt || item.title} style={{ width: "100%", height: "auto", borderRadius: 12 }} />;
  }
  if (item.kind === "video") {
    const embed = item.externalUrl ? videoEmbedUrl(item.externalUrl) : null;
    if (embed) {
      return (
        <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden", background: "#000" }}>
          <iframe loading="lazy" src={embed} title={item.title || "Video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
        </div>
      );
    }
    if (fileUrl) return <ResourceVideo src={fileUrl} title={item.title || "Video"} script={item.script ?? []} />;
    if (item.externalUrl) return <SourceLink href={item.externalUrl} target="_blank" rel="noreferrer">Watch: {item.title || item.externalUrl}</SourceLink>;
  }
  if (item.kind === "document") {
    const href = fileUrl ?? item.externalUrl ?? "#";
    return <SourceLink className="btn" href={href} target="_blank" rel="noreferrer">Open {item.title || item.fileName || "document"}</SourceLink>;
  }
  if (fileUrl) return <SourceLink href={fileUrl} target="_blank" rel="noreferrer">Open {item.title || item.fileName || "file"}</SourceLink>;
  return null;
}

"use client";
import { SourceLink } from "@/components/app-link";


import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FeaturedMediaPanel } from "./featured-media-panel";

type Item = {
  id: string; title: string; kind: "video" | "audio"; summary: string; media: string; captions: string;
  transcript: string; poster?: string; durationSeconds: number; chapters: { title: string; start: number }[];
};

function minutes(seconds: number) {
  const m = Math.round(seconds / 60);
  return m <= 1 ? "about 1 minute" : `about ${m} minutes`;
}
function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Player({ item, withinSection = false }: { item: Item; withinSection?: boolean }) {
  const Heading = withinSection ? "h3" : "h2";
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const seek = (start: number) => { if (ref.current) { ref.current.currentTime = start; void ref.current.play().catch(() => undefined); } };
  return <FeaturedMediaPanel kind={item.kind === "video" ? "video" : "audio"} label={item.kind === "video" ? undefined : "Listen"} length={minutes(item.durationSeconds)}><section className="course-media-item" aria-labelledby={`cm-${item.id}`}>
    <Heading id={`cm-${item.id}`}>{item.title}</Heading>
    {item.summary ? <p className="calm-muted">{item.summary}</p> : null}
    {item.kind === "video"
      ? <video ref={ref} controls preload="none" poster={item.poster} style={{ width: "100%", maxWidth: "960px", borderRadius: "8px", background: "#000" }}>
          <source src={item.media} type="video/mp4" />
          <track kind="captions" src={item.captions} srcLang="en" label="English" default />
        </video>
      : <audio ref={ref} controls preload="none" style={{ width: "100%", maxWidth: "720px" }}>
          <source src={item.media} type="audio/mpeg" />
          <track kind="captions" src={item.captions} srcLang="en" label="English" default />
        </audio>}
    {item.chapters.length > 1 ? <details>
      <summary>Chapters</summary>
      <ol className="calm-list">{item.chapters.map(chapter => <li key={`${chapter.start}-${chapter.title}`}>
        <button type="button" className="course-media-chapter" onClick={() => seek(chapter.start)}>{chapter.title}</button> <span className="calm-muted calm-small">{clock(chapter.start)}</span>
      </li>)}</ol>
    </details> : null}
    <p className="calm-small"><SourceLink href={item.transcript}>Read the full transcript</SourceLink> · <SourceLink href={item.captions}>Download the captions</SourceLink></p>
  </section></FeaturedMediaPanel>;
}

/**
 * Where published course media goes on a page: directly under the page's title and its own players,
 * not at the foot of the page. A page marks the spot with this slot; it renders nothing by itself.
 */
export function CourseMediaSlot({ itemId }: { itemId?: string } = {}) {
  return itemId ? <div data-course-media-item={itemId} /> : <div id="course-media" data-course-media-slot="" />;
}

/**
 * Where a page's title area offers a "Watch the video explainer" button for its published course video.
 * Renders nothing by itself; the button appears only when a video is published for the page.
 */
export function CourseMediaJumpSlot({ label }: { label?: string } = {}) {
  return <span className="media-quick-links" data-course-media-jump={label ?? ""} style={{ display: "contents" }} />;
}

/**
 * The element the media is placed in: the page's slot when it has one, otherwise a holder placed
 * right after the page title (its header, when the title sits in one). `null` means the page has
 * neither, so the media stays where the layout renders it.
 */
function placeNearTitle(): { target: HTMLElement | null; cleanup?: () => void } {
  const slot = document.querySelector<HTMLElement>("[data-course-media-slot]");
  if (slot) return { target: slot };
  const title = document.querySelector<HTMLElement>("#main h1");
  const anchor = title?.closest<HTMLElement>("header") ?? title;
  if (!anchor?.parentNode) return { target: null };
  const holder = document.createElement("div");
  holder.setAttribute("data-course-media-placed", "");
  anchor.after(holder);
  return { target: holder, cleanup: () => holder.remove() };
}

/** Published course media for this page, if any. Shown only when something is published; nothing is recorded. */
export function CourseMediaForPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<Item[]>([]);
  const [placement, setPlacement] = useState<{ target: HTMLElement | null; itemTargets: Map<string, HTMLElement> }>();
  useEffect(() => {
    let live = true;
    // A new page starts with no media until its own list arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems([]);
    fetch(`/api/course-media?page=${encodeURIComponent(pathname)}`).then(r => r.ok ? r.json() : { items: [] }).then(body => {
      if (live && Array.isArray(body.items)) setItems(body.items as Item[]);
    }).catch(() => undefined);
    return () => { live = false; };
  }, [pathname]);
  useEffect(() => {
    if (!items.length) return;
    const placed = placeNearTitle();
    const itemTargets = new Map<string, HTMLElement>();
    for (const slot of document.querySelectorAll<HTMLElement>("[data-course-media-item]")) {
      if (slot.dataset.courseMediaItem) itemTargets.set(slot.dataset.courseMediaItem, slot);
    }
    // The slots are available after the page renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlacement({ target: placed.target, itemTargets });
    return () => { placed.cleanup?.(); setPlacement(undefined); };
  }, [items]);
  if (!items.length || !placement) return null;
  const { target, itemTargets } = placement;
  // Videos first, then audio, each in published order.
  const pageItems = items.filter(item => !itemTargets.has(item.id));
  const ordered = [...pageItems.filter(item => item.kind === "video"), ...pageItems.filter(item => item.kind !== "video")];
  const sectionMedia = items.flatMap(item => {
    const slot = itemTargets.get(item.id);
    return slot ? [createPortal(<Player item={item} withinSection />, slot, item.id)] : [];
  });
  // In a page's own slot the media lines up with the page column; elsewhere it keeps its own margins.
  const inSlot = target?.hasAttribute("data-course-media-slot") ?? false;
  const media = <div className="calm course-media" style={inSlot ? { paddingTop: "1.5rem", paddingBottom: "1.5rem", paddingLeft: 0, paddingRight: 0 } : { paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
    {ordered.map(item => <Player key={item.id} item={item} />)}
  </div>;
  const placedMedia = ordered.length ? (target ? createPortal(media, target) : media) : null;
  // A button in the title area, so the video is found without scrolling (owner rule, 2026-11-10).
  const jump = inSlot ? document.querySelector<HTMLElement>("[data-course-media-jump]") : null;
  const video = ordered.find(item => item.kind === "video");
  if (!jump || !video) return <>{placedMedia}{sectionMedia}</>;
  return <>{placedMedia}{sectionMedia}{createPortal(<SourceLink href="#course-media" className="media-quick-link media-quick-link--video text-white" style={{ background: "#003865", color: "#fff" }}>{jump.dataset.courseMediaJump || "Watch the lesson"}</SourceLink>, jump)}</>;
}

import type { ReactNode } from "react";
import "./featured-media-panel.css";

export type FeaturedMediaKind = "video" | "podcast" | "audio";

const LABELS: Record<FeaturedMediaKind, string> = {
  video: "Video explainer",
  podcast: "Podcast",
  audio: "Listen to the discussion",
};

/** "about 6 minutes" from seconds; nothing when the length is unknown. */
export function mediaLength(seconds: number | undefined) {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return undefined;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes === 1 ? "about 1 minute" : `about ${minutes} minutes`;
}

/**
 * A short "In this lesson" line right under a lesson title: one button per recording, in the same colors as
 * its panel, jumping to it. Used where a long transcript would otherwise push the second recording out of view.
 */
export function MediaQuickLinks({ links }: { links: { href: string; kind: FeaturedMediaKind; text: string }[] }) {
  if (links.length === 0) return null;
  return <p className="media-quick-links">
    {links.map(link => <a key={link.href} href={link.href} className={`media-quick-link media-quick-link--${link.kind} text-white`} style={{ background: link.kind === "video" ? "#003865" : "#1f5f3f", color: "#fff" }}>{link.text}</a>)}
  </p>;
}

/**
 * One look for every lesson video, explainer and podcast: a tinted panel with a thick colored top edge and border
 * (navy for video, green for listening), then the player with its own heading, captions and transcript links.
 * Owner 2026-11-10: no visible label bar or lengths; the panel's own heading ("Watch the lesson",
 * "Listen to the discussion") is the label. The kind name is kept only for screen readers.
 * Text labels only. The label is not a heading, so the page outline stays as the page sets it.
 */
export function FeaturedMediaPanel({ kind, label, description, length, className, children }: {
  kind: FeaturedMediaKind;
  /** Overrides the default label for the kind. */
  label?: string;
  /** One line on what the recording covers. */
  description?: ReactNode;
  /** Length in words, for example "about 6 minutes". */
  length?: string;
  className?: string;
  children: ReactNode;
}) {
  return <div aria-label={label ?? LABELS[kind]} role="group" className={`featured-media-panel featured-media-panel--${kind}${className ? ` ${className}` : ""}`} data-featured-media={kind}>
    {description ? <p className="featured-media-description">{description}</p> : null}
    {children}
  </div>;
}

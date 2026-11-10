import { FeaturedMediaPanel } from "@/components/featured-media-panel";
import SequenceVideo from "@/app/learn/equity-in-practice/sequence-video";
import videos from "@/lib/program/explainer-videos.json";

type Explainer = { title: string; summary: string; runtime: string; src: string; poster: string; captions: string; transcript: string };

/** A short narrated explainer, closed by default so the page stays uncluttered. Captions are shown in the picture. */
export function ExplainerVideo({ id, open = false }: { id: string; open?: boolean }) {
  const video = (videos as Record<string, Explainer>)[id];
  if (!video) return null;
  return <FeaturedMediaPanel kind="video"><details className="explainer-video" open={open}>
    <summary className="cursor-pointer font-semibold">Watch a short explainer: {video.title} <span className="font-normal text-muted">({video.runtime})</span></summary>
    <p className="mt-3">{video.summary}</p>
    <SequenceVideo className="mt-3 block aspect-video w-full rounded-lg bg-white" src={video.src} poster={video.poster} title={video.title} />
    <p className="mt-3 text-sm"><a href={video.transcript}>Read the transcript</a> · <a href={video.captions}>Download the captions</a></p>
  </details></FeaturedMediaPanel>;
}

import { trainingById } from "@/lib/trainings/catalog";
import { toVtt } from "@/lib/trainings/media";

/** WebVTT captions for one segment, generated from its narration. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; segment: string }> }) {
  const { id, segment } = await params;
  const seg = trainingById(id)?.segments.find(s => s.id === segment.replace(/\.vtt$/, ""));
  if (!seg) return new Response("Not found", { status: 404 });
  return new Response(toVtt(seg.scenes) + "\n", { headers: { "content-type": "text/vtt; charset=utf-8" } });
}

import { trainingById } from "@/lib/trainings/catalog";
import { transcript } from "@/lib/trainings/media";

/** The full transcript of a training for one version, as plain text to read, print or keep. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = trainingById(id);
  if (!t) return new Response("Not found", { status: 404 });
  const asked = new URL(request.url).searchParams.get("version") ?? "all-staff";
  const version = t.simulations.some(s => s.version === asked) ? asked : "all-staff";
  return new Response(transcript(t, version), { headers: { "content-type": "text/plain; charset=utf-8", "content-disposition": `inline; filename="${t.id}-${version}-transcript.txt"` } });
}

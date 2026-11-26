/** Retire the estimated script-timing endpoint. Released players use verified media-manifest captions. */
export async function GET() {
  return new Response("Recording captions are available with released course media.", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

import { configuredLeadershipRoot, serveLeadershipMedia } from '../../../../lib/content/leadership-media';

export const runtime = 'nodejs';
type Context = { params: Promise<{ name: string }> };

export async function GET(request: Request, { params }: Context) {
  const root = configuredLeadershipRoot(process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  const name = (await params).name;
  if (!root) return new Response(null, { status: /^[a-z-]+\.json$/.test(name) ? 204 : 404, headers: { 'Cache-Control': 'no-store' } });
  return serveLeadershipMedia(request, name, root);
}

export async function HEAD(request: Request, context: Context) { return GET(request, context); }

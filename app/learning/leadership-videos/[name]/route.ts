import { configuredLeadershipRoot, serveLeadershipMedia } from '../../../../lib/content/leadership-media';

export const runtime = 'nodejs';
type Context = { params: Promise<{ name: string }> };

export async function GET(request: Request, { params }: Context) {
  const root = configuredLeadershipRoot(process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  if (!root) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return serveLeadershipMedia(request, (await params).name, root);
}

export async function HEAD(request: Request, context: Context) { return GET(request, context); }

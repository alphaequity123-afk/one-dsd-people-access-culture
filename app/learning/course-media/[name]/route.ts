import { configuredCourseMediaRoot, serveCourseMediaAsset } from '../../../../lib/content/course-media';

export const runtime = 'nodejs';
type Context = { params: Promise<{ name: string }> };

export async function GET(request: Request, { params }: Context) {
  const root = configuredCourseMediaRoot(process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  if (!root) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return serveCourseMediaAsset(request, (await params).name, root);
}

export async function HEAD(request: Request, context: Context) { return GET(request, context); }

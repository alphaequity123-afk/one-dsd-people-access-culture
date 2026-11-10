import type { NextRequest } from 'next/server';
import { ownerFromRequest } from '../../../../../lib/auth/request';
import { isSameOriginMutation } from '../../../../../lib/auth/mutation';
import { configuredCourseMediaRoot, ingestCourseMedia, initializeCourseMedia } from '../../../../../lib/content/course-media';

export const runtime = 'nodejs';
type Context = { params: Promise<{ name: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const headers = { 'Cache-Control': 'no-store' };
  const root = configuredCourseMediaRoot(process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  if (process.env.PAC_GEFFEN_UPLOAD_ENABLED !== 'true' || !root) return new Response(null, { status: 404, headers });
  if (!(await ownerFromRequest(request))) return new Response(null, { status: 401, headers });
  if (!isSameOriginMutation(request)) return new Response(null, { status: 403, headers });
  const { name } = await params;
  if (name === 'initialize') return initializeCourseMedia(root, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  return ingestCourseMedia(request, name, root);
}

import type { NextRequest } from 'next/server';
import { configuredCourseMediaRoot, mediaForPage, publishedCourseMedia } from '../../../lib/content/course-media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The published media for one page. Answers from published manifests only; records nothing about the request. */
export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get('page') ?? '';
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' };
  if (!/^\/[A-Za-z0-9/_.\-]{0,200}$/.test(page)) return new Response(JSON.stringify({ items: [] }), { headers });
  const root = configuredCourseMediaRoot(process.env.PAC_GEFFEN_PUBLIC_MEDIA_ROOT, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  const items = mediaForPage(await publishedCourseMedia(root), page);
  return new Response(JSON.stringify({ items }), { headers });
}

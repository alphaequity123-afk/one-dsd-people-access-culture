import type { NextRequest } from 'next/server';
import { ownerFromRequest } from '../../../../../../lib/auth/request';
import { isSameOriginMutation } from '../../../../../../lib/auth/mutation';
import { ingestGeffen, initializeGeffen } from '../../../../../../lib/content/geffen-ingest';
import { readAloudMediaRoot } from '../../../../../../lib/storage/public-media-store';
export const runtime = 'nodejs';
type Context = { params: Promise<{ kind: string; name: string }> };
export async function POST(request: NextRequest, { params }: Context) {
  const headers = { 'Cache-Control': 'no-store' };
  const root = readAloudMediaRoot();
  if (process.env.PAC_GEFFEN_UPLOAD_ENABLED !== 'true' || !root) return new Response(null, { status: 404, headers });
  if (!(await ownerFromRequest(request))) return new Response(null, { status: 401, headers });
  if (!isSameOriginMutation(request)) return new Response(null, { status: 403, headers });
  const { kind, name } = await params;
  if (kind === 'initialize' && name === 'volume') return initializeGeffen(root, process.env.RAILWAY_VOLUME_MOUNT_PATH);
  return ingestGeffen(request, kind, name, root);
}

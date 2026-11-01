import { serveGeffenIndex } from '@/lib/content/geffen-volume';
export const runtime = 'nodejs';
type Context = { params: Promise<{ name: string }> };
export async function GET(request: Request, { params }: Context) { return serveGeffenIndex(request, (await params).name); }
export async function HEAD(request: Request, context: Context) { return GET(request, context); }

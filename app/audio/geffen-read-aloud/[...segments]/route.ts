import { serveGeffenAudio } from '@/lib/content/geffen-volume';
export const runtime = 'nodejs';
type Context = { params: Promise<{ segments: string[] }> };
export async function GET(request: Request, { params }: Context) { return serveGeffenAudio(request, (await params).segments); }
export async function HEAD(request: Request, context: Context) { return GET(request, context); }

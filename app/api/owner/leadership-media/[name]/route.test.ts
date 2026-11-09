// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { GET } from '../../../../learning/leadership-videos/[name]/route';

vi.mock('../../../../../lib/auth/request', () => ({ ownerFromRequest: async (request: NextRequest) => request.headers.get('x-test-owner') === 'yes' }));

const url = 'https://example.test/api/owner/leadership-media/initialize';
const request = (owner: boolean, origin = 'https://example.test') => new NextRequest(url, { method: 'POST', headers: { Origin: origin, ...(owner ? { 'x-test-owner': 'yes' } : {}) } });
const context = { params: Promise.resolve({ name: 'initialize' }) };
let mount: string;

beforeEach(async () => {
  mount = await mkdtemp(path.join(os.tmpdir(), 'leadership-auth-test-'));
  await mkdir(path.join(mount, 'geffen-public'));
  vi.stubEnv('PAC_PUBLIC_ORIGIN', 'https://example.test');
  vi.stubEnv('PAC_GEFFEN_PUBLIC_MEDIA_ROOT', path.join(mount, 'geffen-public'));
  vi.stubEnv('RAILWAY_VOLUME_MOUNT_PATH', mount);
  vi.stubEnv('PAC_GEFFEN_UPLOAD_ENABLED', 'true');
});
afterEach(async () => { vi.unstubAllEnvs(); await rm(mount, { recursive: true, force: true }); });

describe('leadership media route authentication', () => {
  it('rejects unauthenticated and cross-origin writes before initializing', async () => {
    expect((await POST(request(false), context)).status).toBe(401);
    expect((await POST(request(true, 'https://other.test'), context)).status).toBe(403);
    expect((await POST(request(true), context)).status).toBe(204);
  });

  it('fails closed if the publisher is disabled or the public root is misconfigured', async () => {
    vi.stubEnv('PAC_GEFFEN_UPLOAD_ENABLED', 'false');
    expect((await POST(request(true), context)).status).toBe(404);
    vi.stubEnv('PAC_GEFFEN_UPLOAD_ENABLED', 'true');
    vi.stubEnv('PAC_GEFFEN_PUBLIC_MEDIA_ROOT', mount);
    expect((await POST(request(true), context)).status).toBe(404);
    const publicResponse = await GET(new Request('https://example.test'), { params: Promise.resolve({ name: 'servant.json' }) });
    // No media is served: the lesson sees "nothing published" (204, empty body).
    expect(publicResponse.status).toBe(204);
    expect(await publicResponse.text()).toBe('');
  });

  it('publishes and serves a complete style over isolated loopback HTTP', async () => {
    // Real HTTP and the actual route functions; owner identity is synthetic.
    // Production owner-session behavior is exercised separately by auth tests.
    const server = createServer(async (incoming, outgoing) => {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
        const pathname = new URL(incoming.url ?? '/', 'http://localhost').pathname;
        const name = decodeURIComponent(pathname.split('/').at(-1) ?? '');
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('server unavailable');
        const origin = `http://127.0.0.1:${address.port}`;
        const method = incoming.method ?? 'GET';
        const headers = new Headers();
        for (const [key, value] of Object.entries(incoming.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(',') : value);
        const bytes = Buffer.concat(chunks);
        const req = new NextRequest(origin + pathname, { method, headers, ...(bytes.length ? { body: bytes } : {}) });
        const params = { params: Promise.resolve({ name }) };
        const response = pathname.startsWith('/api/owner/') ? await POST(req, params) : await GET(req, params);
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(Buffer.from(await response.arrayBuffer()));
      } catch { outgoing.writeHead(500); outgoing.end(); }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('server unavailable');
      const origin = `http://127.0.0.1:${address.port}`;
      vi.stubEnv('PAC_PUBLIC_ORIGIN', origin);
      const asset = (s: Buffer, ext: string) => ({ bytes: s, name: createHash('sha256').update(s).digest('hex') + ext });
      const video = asset(Buffer.from([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0]), '.mp4');
      const captions = asset(Buffer.from('WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nExample\n'), '.vtt');
      const transcript = asset(Buffer.from('Example transcript\n'), '.txt');
      const upload = (name: string, body: BodyInit, owner = true) => fetch(`${origin}/api/owner/leadership-media/${name}`, { method: 'POST', headers: { Origin: origin, ...(owner ? { 'x-test-owner': 'yes' } : {}) }, body });
      expect((await upload('initialize', '', false)).status).toBe(401);
      expect((await upload('initialize', '')).status).toBe(204);
      const manifest = { format: 'leadership-video-v1', style: 'servant', video: video.name, captions: captions.name, transcript: transcript.name };
      expect((await upload('servant.json', JSON.stringify(manifest))).status).toBe(409);
      for (const item of [video, captions, transcript]) expect((await upload(item.name, new Uint8Array(item.bytes))).status).toBe(204);
      expect((await upload('servant.json', JSON.stringify(manifest))).status).toBe(204);
      const visible = await fetch(`${origin}/learning/leadership-videos/servant.json`);
      const published = await visible.json();
      expect(visible.status).toBe(200); expect(published.style).toBe('servant');
      const excerpt = await fetch(origin + published.video, { headers: { Range: 'bytes=4-7' } });
      expect(excerpt.status).toBe(206); expect(Buffer.from(await excerpt.arrayBuffer()).toString()).toBe('ftyp');
      expect((await fetch(origin + published.captions)).headers.get('content-type')).toContain('text/vtt');
      expect(await (await fetch(origin + published.transcript)).text()).toBe('Example transcript\n');
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});

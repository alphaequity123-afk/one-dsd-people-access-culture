import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const base = process.argv[2];
if (!base || !/^https:\/\/one-dsd-people-access-culture-production\.up\.railway\.app\/?$|^http:\/\/127\.0\.0\.1:\d+\/?$/.test(base)) throw Error('Use the separate One DSD app or its local preview.');
const registry = fs.readFileSync(path.join(root, 'lib/program/review-resources.ts'), 'utf8');
const assets = [...new Set([...registry.matchAll(/(?:href|file): "(\/library\/[^\"]+)"/g)].map(match => match[1]))];
const instructionGuides = new Set(['guide-one-dsd-policy-review', 'guide-one-dsd-policy-facilitation', 'guide-one-dsd-hcbs-review', 'guide-one-dsd-hcbs-companion', 'guide-one-dsd-hcbs-walkthrough']);
const ids = [...registry.matchAll(/id: "([^"]+)"/g)].map(match => match[1]).filter(id => !instructionGuides.has(id));
const routes = ['/', '/equity-review', '/equity-review/general', '/equity-review/hcbs', '/one-dsd/planning', '/one-dsd/planning/report', '/equity-policy', '/toolkit-studio', '/one-dsd/evidence', '/program/resources', '/program/progress', ...ids.map(id => '/library/' + id)];
const checks = [];
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function read(urlPath) {
  const response = await fetch(new URL(urlPath, base), { signal: AbortSignal.timeout(60000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { response, bytes, text: bytes.toString('utf8') };
}
for (let start = 0; start < assets.length; start += 4) {
  await Promise.all(assets.slice(start, start + 4).map(async asset => {
    const { response, bytes } = await read(asset);
    const expected = digest(fs.readFileSync(path.join(root, 'public', asset)));
    const actual = digest(bytes);
    checks.push({ path: asset, status: response.status, matchedSource: expected === actual, sha256: actual });
    if (response.status !== 200 || actual !== expected) throw Error(`Asset failed: ${asset} (${response.status})`);
    if (asset.endsWith('_Tool.html') || asset.endsWith('_Dashboard.html')) {
      if (response.headers.get('x-frame-options') !== 'SAMEORIGIN' || !response.headers.get('content-security-policy')?.includes("frame-ancestors 'self'")) throw Error('Workspace cannot load within the app: ' + asset);
    }
  }));
}
for (let start = 0; start < routes.length; start += 4) {
  await Promise.all(routes.slice(start, start + 4).map(async route => {
    const { response, text } = await read(route);
    const valid = response.status === 200 && !/This page could not be found|Application error: a server-side exception/.test(text);
    checks.push({ path: route, status: response.status, valid });
    if (!valid) throw Error(`Page failed: ${route} (${response.status})`);
    if (route === '/equity-review' && !text.includes('Staff anywhere in DHS')) throw Error('DHS-wide guidance missing.');
    if (route === '/' && !text.includes('/equity-review')) throw Error('Home review link missing.');
    if (route === '/one-dsd/planning' && !text.includes('Equity and Inclusion Operations Consultant')) throw Error('Program leadership missing.');
  }));
}
for (const route of ['/equity-review/not-a-tool', '/equity-review/toString']) {
  const { response } = await read(route);
  checks.push({ path: route, status: response.status, expected: 404 });
  if (response.status !== 404) throw Error('Unknown review must return 404: ' + route);
}
const receipt = { checkedAt: new Date().toISOString(), base, requests: checks.length, passed: true, checks };
fs.mkdirSync(path.join(root, 'evidence/equity-review-integration-20261005'), { recursive: true });
const filename = base.startsWith('https') ? 'live-http.json' : 'local-http.json';
fs.writeFileSync(path.join(root, 'evidence/equity-review-integration-20261005', filename), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ passed: true, requests: checks.length, assets: assets.length, pages: routes.length, base }));

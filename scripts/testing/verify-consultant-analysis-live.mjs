import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const base = process.argv[2];
if (!/^https:\/\/one-dsd-people-access-culture-production\.up\.railway\.app\/?$|^http:\/\/127\.0\.0\.1:\d+\/?$/.test(base ?? '')) throw Error('Use the separate One DSD app or local preview.');
const checks = [];
async function check(route, init, validate) {
  const response = await fetch(new URL(route, base), { ...init, signal: AbortSignal.timeout(60000) });
  const body = await response.text();
  const valid = validate(response, body);
  checks.push({ route, method: init?.method ?? 'GET', status: response.status, valid });
  if (!valid) throw Error('Consultant integration check failed: ' + route);
}
await check('/equity-review', undefined, (response, body) => response.status === 200 && body.includes('/consultant/analysis') && !body.includes('Guides for individual and team use') && !body.includes('DSD_Equity_Policy_Analysis_Tool_User_Guide.html'));
await check('/consultant/analysis', undefined, (response, body) => response.status === 200 && body.includes('Workspace access key') && !body.includes('From evidence to action'));
await check('/api/consultant/analysis', undefined, response => response.status === 401 && response.headers.get('cache-control')?.includes('no-store'));
await check('/api/consultant/analysis', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: new URL(base).origin }, body: '{}' }, response => response.status === 401);
await check('/api/consultant/analysis', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://unrelated.example' }, body: '{}' }, response => response.status === 401);
await check('/api/consultant/analysis/upload', { method: 'POST', headers: { Origin: new URL(base).origin }, body: 'not-a-file' }, response => response.status === 401 && response.headers.get('cache-control')?.includes('no-store'));
await check('/learn/equity-toolkit/goals', undefined, (response, body) => response.status === 200 && body.includes('Eliminate Disparities') && body.includes('Communication and Accessibility'));
const receipt = { checkedAt: new Date().toISOString(), base, passed: true, authenticatedGenerationVerified: false, checks };
const directory = path.join(root, 'evidence/consultant-analysis-20261005');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, base.startsWith('https') ? 'live-http.json' : 'local-http.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ passed: true, requests: checks.length, authenticatedGenerationVerified: false }));

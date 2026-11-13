import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { parseDocument } from 'htmlparser2';
import { findAll, textContent, removeElement } from 'domutils';
import { normalizeUrl } from './source-reading-format.mjs';

// Availability verification is independent of full-text import eligibility.
// This audit never grants republication permission or treats a bot block as a missing page.
const root = '.data/source-coverage-completion';
const receiptDir = path.join(root, 'external-receipts');
fs.mkdirSync(receiptDir, { recursive: true });
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const inventory = read('.data/full-refactor/sources/inventory.json');
const pending = read('.data/full-refactor/sources/review.json').needsReview;
const unavailable = read('data/source-readings/unavailable.json');
const inventoryByUrl = new Map(inventory.map(entry => [normalizeUrl(entry.url), entry]));
const candidates = new Map(pending.map(entry => [normalizeUrl(entry.url), entry]));
for (const url of unavailable) if (!candidates.has(normalizeUrl(url))) candidates.set(normalizeUrl(url), inventoryByUrl.get(normalizeUrl(url)) || { url, title: new URL(url).hostname });
const extraPath = process.argv.find(arg => arg.startsWith('--extra='))?.slice(8);
if (extraPath) for (const entry of read(extraPath)) {
  const url = normalizeUrl(typeof entry === 'string' ? entry : entry.url);
  if (url && !inventoryByUrl.has(url)) candidates.set(url, { ...entry, url });
}
const max = Number(process.argv.find(arg => arg.startsWith('--limit='))?.slice(8) || 0);
const force = process.argv.includes('--refresh');
const retry = process.argv.includes('--retry');
const onlyPending = process.argv.includes('--retry-unresolved');
const retryTransient = process.argv.includes('--retry-transient');
const reportOnly = process.argv.includes('--report-only');
const digest = url => createHash('sha256').update(url).digest('hex').slice(0, 20);
const fileFor = url => path.join(receiptDir, digest(url) + '.json');
const entries = [...candidates.values()].filter(entry => {
  if (reportOnly) return false;
  // Open Library explicitly asks clients not to scrape hundreds of work pages.
  // A batch search API request and a browser request both timed out in this review.
  if (new URL(entry.url).hostname === 'openlibrary.org') return false;
  const file = fileFor(entry.url);
  if (!fs.existsSync(file)) return true;
  if (force) return true;
  if (retryTransient) return ['network-unresolved', 'request-limited', 'temporary-server-error'].includes(read(file).classification);
  if (!onlyPending) return false;
  return !['available-content', 'available-download', 'available-data', 'confirmed-missing'].includes(read(file).classification);
}).slice(0, max || undefined);
const hostChecks = new Map();
function publicIp(ip) { return !(/^(?:0|10|127)\.|^169\.254\.|^192\.168\.|^172\.(?:1[6-9]|2\d|3[01])\.|^(?:22[4-9]|23\d|24\d|25[0-5])\.|^::|^f[cd]|^fe[89ab]/i.test(ip)); }
async function verifyPublicUrl(raw) {
  const url = new URL(raw);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port || !url.hostname.includes('.') || isIP(url.hostname)) throw new Error('Non-public destination');
  if (!hostChecks.has(url.hostname)) hostChecks.set(url.hostname, lookup(url.hostname, { all: true }).then(rows => rows.length > 0 && rows.every(row => publicIp(row.address))));
  if (!await hostChecks.get(url.hostname)) throw new Error('Non-public address');
  return url;
}
function htmlEvidence(html) {
  const document = parseDocument(html);
  const nodes = findAll(node => node.type === 'tag', document.children);
  const title = textContent(nodes.find(node => node.name === 'title') || { children: [] }).replace(/\s+/g, ' ').trim();
  for (const node of nodes.filter(node => ['script', 'style', 'nav', 'header', 'footer', 'noscript', 'template'].includes(node.name))) removeElement(node);
  const main = nodes.find(node => node.name === 'main' || node.attribs?.role === 'main');
  const text = textContent(main || document).replace(/\s+/g, ' ').trim();
  const heading = textContent(nodes.find(node => node.name === 'h1') || { children: [] }).replace(/\s+/g, ' ').trim();
  const challenge = /access denied|just a moment|attention required|robot or human|captcha|verify you are human|checking your browser|security check|request rejected|enable javascript and cookies/i.test(title + ' ' + heading) || (text.length < 2500 && /verify you are human|enable javascript and cookies|access denied|request rejected|checking your browser|please enable javascript to (?:view|access|continue)/i.test(text));
  const missing = !challenge && (/^(?:404(?:\b|\s)|page not found|not found|file not found|error 404)/i.test(title + ' ' + heading) || (text.length < 3000 && /the page (?:you|that you).*?(?:can't|could not|not).*?found|requested (?:url|page) (?:was )?not found|page (?:has been moved or |could )?not (?:be )?found/i.test(text)));
  return { title, heading, textLength: text.length, challenge, missing, excerpt: text.slice(0, 350) };
}
async function probe(raw, timeoutMs = 14000) {
  let url = raw;
  const redirects = [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hop = 0; hop < 8; hop++) {
      await verifyPublicUrl(url);
      const response = await fetch(url, { redirect: 'manual', signal: controller.signal, headers: { 'user-agent': 'OneDSD-ResourceAudit/1.0 (public resource availability verification)', accept: 'text/html,application/pdf,application/json,*/*;q=0.8' } });
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        const next = new URL(response.headers.get('location'), url).href;
        redirects.push({ from: url, to: next, status: response.status });
        await response.body?.cancel(); url = next; continue;
      }
      const contentType = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
      const disposition = response.headers.get('content-disposition');
      const evidence = { checkedAt: new Date().toISOString(), status: response.status, destination: url, redirects, contentType, contentDisposition: disposition, contentLength: response.headers.get('content-length') };
      if (!response.ok) {
        await response.body?.cancel();
        return { ...evidence, classification: [404, 410].includes(response.status) ? 'missing-response' : response.status === 429 ? 'request-limited' : [401, 402, 403, 405, 511].includes(response.status) ? 'access-restricted-or-bot-blocked' : 'temporary-server-error' };
      }
      const reader = response.body.getReader();
      const chunks = []; let bytesRead = 0; let truncated = false;
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        chunks.push(value); bytesRead += value.length;
        if (bytesRead >= 3 * 1024 * 1024) { truncated = true; await reader.cancel(); break; }
      }
      const bytes = Buffer.concat(chunks);
      const header = bytes.subarray(0, 12).toString('latin1');
      const compoundDocument = bytes.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1';
      const isDownload = header.startsWith('%PDF-') || header.startsWith('PK\x03\x04') || compoundDocument;
      if (isDownload && bytes.length > 10) return { ...evidence, bytesRead, truncated, classification: 'available-download', signature: header.startsWith('%PDF-') ? 'PDF' : header.startsWith('PK') ? 'ZIP container' : 'OLE compound document' };
      const text = bytes.toString('utf8');
      if ((/json|csv|xml|markdown/.test(contentType) || /\.csv(?:\?|$)/i.test(url)) && !/<html[\s>]/i.test(text.slice(0, 200))) {
        let valid = text.trim().length > 2;
        if (/json/.test(contentType) && !truncated) { try { const data = JSON.parse(text); valid = data !== null && !(typeof data === 'object' && Object.keys(data).length === 1 && Object.hasOwn(data, 'error')); } catch { valid = false; } }
        return { ...evidence, bytesRead, truncated, classification: valid ? 'available-data' : 'empty-or-error-response' };
      }
      if (/html|text\/plain/.test(contentType) || /<!doctype html|<html[\s>]/i.test(text.slice(0, 200))) {
        const html = htmlEvidence(text);
        const from = new URL(raw), to = new URL(url);
        const homeRedirect = redirects.length > 0 && from.pathname.replace(/\/$/, '') && !to.pathname.replace(/\/$/, '');
        return { ...evidence, bytesRead, truncated, ...html, classification: html.challenge ? 'publisher-challenge' : html.missing ? 'soft-missing-response' : homeRedirect ? 'redirected-to-home-review' : html.textLength >= 120 ? 'available-content' : 'browser-rendering-required' };
      }
      return { ...evidence, bytesRead, truncated, classification: bytes.length ? 'available-other-format' : 'empty-or-error-response' };
    }
    return { checkedAt: new Date().toISOString(), destination: url, redirects, classification: 'redirect-loop' };
  } catch (error) {
    return { checkedAt: new Date().toISOString(), destination: url, redirects, classification: 'network-unresolved', reason: error.message, code: error.cause?.code || error.code };
  } finally { clearTimeout(timer); }
}
const queues = new Map();
for (const entry of entries) { const host = new URL(entry.url).hostname; if (!queues.has(host)) queues.set(host, []); queues.get(host).push(entry); }
const hosts = [...queues.keys()];
const active = new Map(); let done = 0; let hostCursor = 0;
function next() {
  for (let attempt = 0; attempt < hosts.length; attempt++) {
    const host = hosts[hostCursor++ % hosts.length];
    if (queues.get(host).length && (active.get(host) || 0) < 2) { active.set(host, (active.get(host) || 0) + 1); return { host, entry: queues.get(host).shift() }; }
  }
}
async function worker() {
  for (;;) {
    const item = next();
    if (!item) { if (!hosts.some(host => queues.get(host).length)) return; await new Promise(resolve => setTimeout(resolve, 150)); continue; }
    const { host, entry } = item;
    const file = fileFor(entry.url);
    const prior = fs.existsSync(file) ? read(file) : null;
    const result = await probe(entry.url, retry ? 25000 : 14000);
    let confirmation;
    if (['missing-response', 'soft-missing-response'].includes(result.classification)) {
      confirmation = await probe(entry.url, 18000);
      if (result.classification === confirmation.classification) result.classification = 'confirmed-missing';
    }
    const record = { id: entry.id || digest(entry.url), url: entry.url, catalogTitle: entry.title || entry.titles?.join('; '), title: entry.title, originalImportReason: entry.reason, from: entry.from || entry.pages, ...result, ...(confirmation ? { confirmation } : {}), ...(prior ? { previousCheck: { checkedAt: prior.checkedAt, classification: prior.classification, status: prior.status, reason: prior.reason } } : {}) };
    fs.writeFileSync(file, JSON.stringify(record));
    active.set(host, active.get(host) - 1); done++;
    if (done % 50 === 0 || done === entries.length) console.log(JSON.stringify({ checked: done, scheduled: entries.length, classification: result.classification }));
  }
}
await Promise.all(Array.from({ length: 16 }, worker));
const browserPath = path.join(root, 'browser-verification.json');
const browserChecks = new Map((fs.existsSync(browserPath) ? read(browserPath) : []).map(row => [normalizeUrl(row.url), row]));
const previousLedgerPath = path.join(root, 'external-availability.json');
const previousLedger = new Map((fs.existsSync(previousLedgerPath) ? read(previousLedgerPath).records : []).map(row => [normalizeUrl(row.url), row]));
const ledger = inventory.map(entry => {
  const file = fileFor(entry.url);
  const browser = browserChecks.get(normalizeUrl(entry.url));
  if (browser) return { id: entry.id, catalogTitle: entry.title, from: entry.from, ...(fs.existsSync(file) ? { httpEvidence: read(file) } : {}), ...browser };
  if (fs.existsSync(file)) return { catalogTitle: entry.title, ...read(file) };
  if (previousLedger.has(normalizeUrl(entry.url))) return previousLedger.get(normalizeUrl(entry.url));
  if (new URL(entry.url).hostname === 'openlibrary.org') return { ...entry, classification: 'publisher-access-unverified', checkedAt: '2026-11-13', evidence: 'Individual page not re-requested after publisher human-verification responses. The official batch search API and a browser test of OL1870578W timed out. Open Library API policy discourages HTML scraping and hundreds of single-book requests.', policyUrl: 'https://openlibrary.org/developers/api', checkedIndividually: false };
  const oldFile = path.join('.data/full-refactor/sources', entry.id + '.json');
  if (!fs.existsSync(oldFile)) return { ...entry, classification: 'not-checked' };
  const old = read(oldFile);
  return { id: entry.id, url: entry.url, title: entry.title, from: entry.from, checkedAt: old.checkedAt, destination: old.original, classification: old.status === 'reading' ? 'available-content' : old.status === 'document' ? 'available-download' : 'needs-availability-check', evidence: 'existing same-day source receipt', textLength: old.textLength, bytesRead: old.bytes, contentSha256: old.sha256, originalImportReason: old.reason };
});
for (const entry of candidates.values()) if (!inventoryByUrl.has(normalizeUrl(entry.url)) && fs.existsSync(fileFor(entry.url))) ledger.push(read(fileFor(entry.url)));
const counts = {};
for (const row of ledger) counts[row.classification] = (counts[row.classification] || 0) + 1;
fs.writeFileSync(path.join(root, 'external-availability.json'), JSON.stringify({ checkedAt: new Date().toISOString(), total: ledger.length, counts, records: ledger }, null, 2));
console.log(JSON.stringify({ total: ledger.length, counts }));

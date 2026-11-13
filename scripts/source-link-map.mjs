import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {normalizeUrl} from './source-reading-format.mjs';

export function writeSourceLinkMap() {
  const readings=JSON.parse(fs.readFileSync('data/source-readings/manifest.json','utf8'));
  const unavailable=JSON.parse(fs.readFileSync('data/source-readings/unavailable.json','utf8'));
  const redirects=Object.fromEntries(JSON.parse(fs.readFileSync('data/source-readings/source-redirects.json','utf8')).map(entry=>[normalizeUrl(entry.from),entry.to]));
  const links=Object.fromEntries(readings.flatMap(entry=>[entry.url,entry.original].map(url=>[normalizeUrl(url),`/source-reading/${entry.id}`])).filter(([url])=>url));
  const anchors=Object.fromEntries(readings.map(entry=>[`/source-reading/${entry.id}`,entry.anchors||{}]));
  fs.writeFileSync('public/source-link-map.json',JSON.stringify({links,anchors,redirects,unavailable:unavailable.map(normalizeUrl).filter(Boolean)})+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)writeSourceLinkMap();

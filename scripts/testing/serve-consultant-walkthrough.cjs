const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve('output/consultant-walkthrough');
const names = new Set(fs.readdirSync(root).filter(name => /\.(html|docx|json|zip)$/.test(name)));
http.createServer((request, response) => {
  const name = new URL(request.url, 'http://localhost').pathname.slice(1) || 'walkthrough.html';
  if (!['GET', 'HEAD'].includes(request.method) || !names.has(name)) { response.writeHead(404); response.end(); return; }
  const type = name.endsWith('.html') ? 'text/html; charset=utf-8' : name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : name.endsWith('.json') ? 'application/json' : 'application/zip';
  const headers = { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (!name.endsWith('.html')) headers['Content-Disposition'] = `attachment; filename="${name}"`;
  response.writeHead(200, headers);
  if (request.method === 'HEAD') response.end(); else fs.createReadStream(path.join(root, name)).pipe(response);
}).listen(8797, '127.0.0.1', () => console.log('Walkthrough ready at http://127.0.0.1:8797/'));

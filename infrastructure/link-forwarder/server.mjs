import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const destination = 'https://one-people-access-culture.up.railway.app';
export function redirectUrl(requestUrl) {
  const incoming = new URL(requestUrl || '/', 'https://request.invalid');
  const target = new URL(destination);
  target.pathname = incoming.pathname;
  target.search = incoming.search;
  return target.href;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('OK');
      return;
    }
    response.writeHead(307, { location: redirectUrl(request.url), 'cache-control': 'no-store' });
    response.end();
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.listen(Number(process.env.PORT || 8080), '0.0.0.0');
}

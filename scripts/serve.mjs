import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { handleRequest } from '../api/consultation.js';
const root = resolve(process.argv[2] || '.');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/consultation') {
      const chunks = []; let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 8192) { response.writeHead(413).end('Request too large'); return; }
        chunks.push(chunk);
      }
      const body = ['GET', 'HEAD'].includes(request.method) ? undefined : Buffer.concat(chunks);
      const result = await handleRequest(new Request(`http://localhost${pathname}`, { method: request.method, headers: request.headers, body }));
      response.writeHead(result.status, Object.fromEntries(result.headers)).end(await result.text());
      return;
    }
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root + sep) || !mime[extname(file)]) { response.writeHead(404).end('Not found'); return; }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)], 'Cache-Control': 'no-store' }).end(content);
  } catch { response.writeHead(404).end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('DineAgain preview: http://127.0.0.1:4173'));

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PORT = 4173;
const ROOT = path.resolve(import.meta.dirname, 'fixtures');

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname === '/' ? '/form.html' : url.pathname;

  try {
    // 只允许访问 fixtures 目录内的文件
    const filePath = path.join(ROOT, path.normalize(pathname));
    if (!filePath.startsWith(`${ROOT}${path.sep}`)) {
      throw new Error('非法路径');
    }

    const content = await readFile(filePath);
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(content);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`e2e fixture server: http://127.0.0.1:${PORT}/form.html`);
});

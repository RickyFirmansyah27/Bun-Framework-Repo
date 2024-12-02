import { createServer } from 'http';
import { request } from 'undici';

// Import framework servers (sudah berjalan pada port masing-masing)
import '../framework/express'; // Port 8001
import '../framework/hono';    // Port 8002
import '../framework/elysia';  // Port 8003
import '../framework/fastify'; // Port 8004
import '../framework/koa';     // Port 8005

console.log('All servers are running...');

// Map dari server lain ke port-nya
const targetPorts: Record<string, string> = {
  '/express': 'http://localhost:8001',
  '/hono': 'http://localhost:8002',
  '/elysia': 'http://localhost:8003',
  '/fastify': 'http://localhost:8004',
  '/koa': 'http://localhost:8005',
};

// Membuat proxy server menggunakan undici
const proxyServer = createServer(async (req, res) => {
  // Menyaring path yang cocok dengan target
  const target = Object.keys(targetPorts).find(path => req.url?.startsWith(path)) as keyof typeof targetPorts | undefined;

  if (target) {
    const targetUrl = targetPorts[target];
    const newPath = req.url?.replace(target, '') || '/';

    const options = {
      method: req.method,
      headers: req.headers,
    };

    // Hanya mengirim body jika metode adalah POST, PUT, PATCH, dll.
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.body = req;
    }

    try {
      // Membuat permintaan ke server target
      const proxyResponse = await request(`${targetUrl}${newPath}`, options);

      // Menyalin status kode dan header dari respons target ke respons proxy
      res.writeHead(proxyResponse.statusCode, proxyResponse.headers);
      // Menyalin body dari respons target ke respons proxy
      for await (const chunk of proxyResponse.body) {
        res.write(chunk);
      }
      res.end();
    } catch (err) {
      console.error('Proxy error:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Something went wrong.');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Route not found.');
  }
});

// Menjalankan proxy server
proxyServer.listen(8000, () => {
  console.log('Proxy server is running on port 8000');
});

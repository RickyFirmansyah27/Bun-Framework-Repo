import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Middleware CORS
app.use('*', cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));

// Daftar base URL dari layanan
const serviceMap = {
  express: 'https://bun-express-typescripts.vercel.app/api/express/',
  hono: 'https://bun-hono-typescripts.vercel.app/api/hono/',
  elysia: 'https://bun-elysia-typescripts.vercel.app/api/elysia/',
  fastify: 'https://bun-fastify-typescripts.vercel.app/api/fastify/',
  koa: 'https://bun-koa-typescripts.vercel.app/api/koa/',
};

// Fetch dengan timeout
const fetchWithTimeout = async (url, options, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Handler proxy dinamis
const proxyHandler = async (c, method) => {
  try {
    const [_, service, ...dynamicPathParts] = c.req.path.split('/');
    const targetBaseUrl = serviceMap[service];

    if (!targetBaseUrl) {
      return c.json({ error: `Service "${service}" not found` }, 404);
    }

    const dynamicPath = dynamicPathParts.join('/');
    const targetUrl = `${targetBaseUrl}${dynamicPath}`;

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (method === 'POST') {
      options.body = JSON.stringify(await c.req.json());
    }

    const response = await fetchWithTimeout(targetUrl, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return c.json(
      { error: 'Failed to fetch from service', details: error.message },
      500
    );
  }
};

// Rute GET dinamis
app.get('/*', (c) => proxyHandler(c, 'GET'));

// Rute POST dinamis
app.post('/*', (c) => proxyHandler(c, 'POST'));

export default app;

import { Logger } from "./helper";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";

const serviceMap: Record<string, string> = {
  auth: 'https://auth-service-production-shared.up.railway.app/api/auth/',
  express: 'https://bun-express-typescripts.vercel.app/api/express/',
  hono: 'https://bun-hono-typescripts.vercel.app/api/hono/',
  elysia: 'https://bun-elysia-typescripts.vercel.app/api/elysia/',
  fastify: 'https://bun-fastify-typescripts.vercel.app/api/fastify/',
  koa: 'https://bun-koa-typescripts.vercel.app/api/koa/',
};

const getBearerToken = async (req: IncomingMessage): Promise<string | null> => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  return token || null;
};

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 5000): Promise<Response> => {
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

const logRequestAndResponse = (req: IncomingMessage, res: ServerResponse, start: [number, number]): void => {
  const duration = process.hrtime(start);
  const durationInMs = duration[0] * 1000 + duration[1] / 1e6;
  Logger.info(`Request | Method: ${req.method} | Headers: ${JSON.stringify(req.headers)} | URL: ${req.url}`);
  Logger.info(`Response | Method: ${req.method} | URL: ${req.url} | Status: ${res.statusCode} | Duration: ${durationInMs.toFixed(2)} ms`);
};

const proxyHandler = async (req: IncomingMessage, res: ServerResponse, method: string): Promise<void> => {
  const start = process.hrtime();

  try {
    const url = parse(req.url!, true);
    const [, service, ...dynamicPathParts] = url.pathname!.split('/');
    const targetBaseUrl = serviceMap[service];

    if (!targetBaseUrl) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Unauthorized Access` }));
      logRequestAndResponse(req, res, start);
      return;
    }

    let token: string | null = null;
    if (service !== 'auth') {
      token = await getBearerToken(req);
      if (!token) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Unauthorized Access' }));
        logRequestAndResponse(req, res, start);
        return;
      }
    }

    const dynamicPath = dynamicPathParts.join('/');
    const targetUrl = `${targetBaseUrl}${dynamicPath}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    };

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });

      req.on('end', async () => {
        options.body = body;
        const response = await fetchWithTimeout(targetUrl, options);
        if (!response.ok) {
          throw new Error(`Serice unreachable`);
        }

        const data = await response.json();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));

        logRequestAndResponse(req, res, start);
      });
      return;
    }

    const response = await fetchWithTimeout(targetUrl, options);
    if (!response.ok) {
      throw new Error(`Serice unreachable`);
    }

    const data = await response.json();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));

    logRequestAndResponse(req, res, start);

  } catch (error) {
    console.error('Proxy error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Service Unreachable', details: error.message }));
    logRequestAndResponse(req, res, start);
  }
};

// Create an HTTP server to listen on port 8000
const server = createServer((req, res) => {
  const method = req.method!;
  if (method === 'GET' || method === 'POST' || method === 'PUT' || method === 'PATCH') {
    proxyHandler(req, res, method);
  } else {
    res.statusCode = 405;
    res.end('Method Not Allowed');
  }
});

// Set server to listen on port 8000
server.listen(8000, () => {
  console.log('Server running at http://localhost:8000');
});


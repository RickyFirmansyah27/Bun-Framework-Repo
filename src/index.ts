import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { Logger } from './helper';

const SERVICE_MAP: Record<string, string> = {
  auth: 'https://auth-service-production-shared.up.railway.app/api/auth/',
  express: 'https://bun-express-typescripts.vercel.app/api/express/',
  hono: 'https://bun-hono-typescripts.vercel.app/api/hono/',
  elysia: 'https://bun-elysia-typescripts.vercel.app/api/elysia/',
  fastify: 'https://bun-fastify-typescripts.vercel.app/api/fastify/',
  koa: 'https://bun-koa-typescripts.vercel.app/api/koa/',
};

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH'] as const;
type AllowedMethod = typeof ALLOWED_METHODS[number];

const extractBearerToken = (req: IncomingMessage): string | null => {
  const authHeader = req.headers['authorization'];
  return authHeader ? authHeader.replace('Bearer ', '').trim() : null;
};

const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout = 5000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const logRequestDetails = (
  req: IncomingMessage, 
  res: ServerResponse, 
  start: [number, number]
): void => {
  const duration = process.hrtime(start);
  const durationInMs = duration[0] * 1000 + duration[1] / 1e6;
  
  Logger.info(`Request | Method: ${req.method} | URL: ${req.url}`);
  Logger.info(`Response | Status: ${res.statusCode} | Duration: ${durationInMs.toFixed(2)} ms`);
};

const handleProxyRequest = async (
  req: IncomingMessage, 
  res: ServerResponse, 
  method: AllowedMethod
): Promise<void> => {
  const start: [number, number] = process.hrtime();

  try {
  
    const url = parse(req.url || '', true);
    const pathname = url.pathname || '';
    const [, service, ...pathParts] = pathname.split('/');
    
    const targetBaseUrl = SERVICE_MAP[service];
    if (!targetBaseUrl) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: false, statusCode: 403, message: 'Unauthorized Access' }));
      logRequestDetails(req, res, start);
      return;
    }

  
    let token: string | null = null;
    if (service !== 'auth') {
      token = extractBearerToken(req);
      if (!token) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: false, statusCode: 403, message: 'Unauthorized Access' }));
        logRequestDetails(req, res, start);
        return;
      }
    }

  
    const dynamicPath = pathParts.join('/');
    const targetUrl = `${targetBaseUrl}${dynamicPath}`;

  
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    };

  
    const handleRequestWithBody = async (): Promise<string> => {
      return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => { resolve(body); });
      });
    };

  
    const processRequest = async () => {
    
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = await handleRequestWithBody();
      }

      const response = await fetchWithTimeout(targetUrl, options);
    
      if (!response.ok) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: false, statusCode: 403, message: 'Unauthorized Access' }));
        return;
      }

      const data = await response.json();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };

  
    await processRequest();
    logRequestDetails(req, res, start);

  } catch (error) {
    Logger.error('Proxy error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      error: 'Proxy error', 
      details: error instanceof Error ? error.message : String(error) 
    }));
    logRequestDetails(req, res, start);
  }
};

const server = createServer((req, res) => {
  const method = req.method as AllowedMethod;
  
  if (ALLOWED_METHODS.includes(method)) {
    handleProxyRequest(req, res, method);
  } else {
    res.statusCode = 405;
    res.end('Method Not Allowed');
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  Logger.info(`Server running at http://localhost:${PORT}`);
});

const serviceMap: Record<string, string> = {
  auth: 'https://auth-service-production-shared.up.railway.app/api/auth/',
  express: 'https://bun-express-typescripts.vercel.app/api/express/',
  hono: 'https://bun-hono-typescripts.vercel.app/api/hono/',
  elysia: 'https://bun-elysia-typescripts.vercel.app/api/elysia/',
  fastify: 'https://bun-fastify-typescripts.vercel.app/api/fastify/',
  koa: 'https://bun-koa-typescripts.vercel.app/api/koa/',
};

// Fetch dengan timeout
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

// Logger function to log request and response
const logRequestAndResponse = (req: Request, res: Response, start: [number, number]): void => {
  const duration = process.hrtime(start);
  const durationInMs = duration[0] * 1000 + duration[1] / 1e6;

  // Log request
  console.log(`Request | Method: ${req.method} | Headers: ${JSON.stringify(req.headers)} | URL: ${req.url}`);

  // Log response (status and duration)
  console.log(`Response | Method: ${req.method} | URL: ${req.url} | Status: ${res.status} | Duration: ${durationInMs.toFixed(2)} ms`);
};

// Fungsi handler untuk proxy dinamis
const proxyHandler = async (req: Request, method: string): Promise<Response> => {
  const start = process.hrtime(); // Start timer for logging
  let res: Response;

  try {
    const url = new URL(req.url);
    const [, service, ...dynamicPathParts] = url.pathname.split('/');
    const targetBaseUrl = serviceMap[service];

    if (!targetBaseUrl) {
      res = new Response(JSON.stringify({ error: `Service "${service}" not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
      logRequestAndResponse(req, res, start);
      return res;
    }

    const dynamicPath = dynamicPathParts.join('/');
    const targetUrl = `${targetBaseUrl}${dynamicPath}`;

    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const body = await req.json();
      options.body = JSON.stringify(body);
    }

    const response = await fetchWithTimeout(targetUrl, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });

    logRequestAndResponse(req, res, start);
    return res;
  } catch (error) {
    console.error('Proxy error:', error);
    res = new Response(
      JSON.stringify({ error: 'Service Unreachable', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
    logRequestAndResponse(req, res, start);
    return res;
  }
};

// Bun server setup
export default {
  port: 8000, // Ganti dengan port yang diinginkan
  fetch: async (req: Request): Promise<Response> => {
    const method = req.method;

    if (method === 'GET' || method === 'POST') {
      return proxyHandler(req, method);
    }

    return new Response('Method not allowed', { status: 405 });
  },
};

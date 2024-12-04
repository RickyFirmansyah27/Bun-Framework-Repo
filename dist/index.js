// @bun
// src/index.ts
var serviceMap = {
  express: "https://bun-express-typescripts.vercel.app/api/express/",
  hono: "https://bun-hono-typescripts.vercel.app/api/hono/",
  elysia: "https://bun-elysia-typescripts.vercel.app/api/elysia/",
  fastify: "https://bun-fastify-typescripts.vercel.app/api/fastify/",
  koa: "https://bun-koa-typescripts.vercel.app/api/koa/"
};
var fetchWithTimeout = async (url, options, timeout = 5000) => {
  const controller = new AbortController;
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
var proxyHandler = async (req, method) => {
  try {
    const url = new URL(req.url);
    const [, service, ...dynamicPathParts] = url.pathname.split("/");
    const targetBaseUrl = serviceMap[service];
    if (!targetBaseUrl) {
      return new Response(JSON.stringify({ error: `Service "${service}" not found` }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const dynamicPath = dynamicPathParts.join("/");
    const targetUrl = `${targetBaseUrl}${dynamicPath}`;
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (method === "POST") {
      const body = await req.json();
      options.body = JSON.stringify(body);
    }
    const response = await fetchWithTimeout(targetUrl, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch from service", details: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
var src_default = {
  port: 8000,
  fetch: async (req) => {
    const method = req.method;
    if (method === "GET" || method === "POST") {
      return proxyHandler(req, method);
    }
    return new Response("Method not allowed", { status: 405 });
  }
};
export {
  src_default as default
};

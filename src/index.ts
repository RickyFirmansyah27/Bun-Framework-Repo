import '../framework/express';  // Akan otomatis memanggil listen di dalam express.ts
import '../framework/hono';     // Akan otomatis memanggil listen di dalam hono.ts
import '../framework/elysia';   // Akan otomatis memanggil listen di dalam elysia.ts
import '../framework/fastify';  // Akan otomatis memanggil listen di dalam fastify.ts
import '../framework/koa';      // Akan otomatis memanggil listen di dalam koa.ts

console.log('All servers are running...');

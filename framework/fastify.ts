import Fastify from "fastify";

const fastify = Fastify();
const port = 8004;

// Register all routes
fastify.get('/hello', (request, reply) => {
  reply.send({ 
    message: 'Selamat datang di Fastify API', 
    status: 'online' 
  });
});

fastify.get('/hono/data', async (c) => {
  const response = await fetch('https://bun-express-typescript.vercel.app/express/user');
  const data = await response.json();
  return data;
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: port, 
      host: '0.0.0.0'
    });
    console.info(`[Fastify-Service] Server is running on port ${port}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Error starting server: Message: ${error.message} | Stack: ${error.stack}`
      );
    } else {
      console.error(`Error starting server: ${String(error)}`);
    }
    process.exit(1);
  }
};

start();
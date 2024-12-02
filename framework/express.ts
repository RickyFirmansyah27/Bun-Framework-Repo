import express, { Express } from 'express';

const app: Express = express();
const port = 8001;

// Middleware
app.get('/', (request, reply) => {
    reply.send({ 
      message: 'Selamat datang di Express API', 
      status: 'online' 
    });
  });

app.listen(port, async (): Promise<void> => {
  try {
      console.info(`[Express-Service] Server is running on port ${port}`);
  } catch (error) {
      if (error instanceof Error) {
          console.error(
              `Error starting server: Message: ${error.message} | Stack: ${error.stack}`
          );
      } else {
          console.error(`Error starting server: ${String(error)}`);
      }
  }
});


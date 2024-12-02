import Koa, { Context } from 'koa';

const app = new Koa();
const port = 8005;

app.use(async (ctx: Context) => {
  if (ctx.method === 'GET' && ctx.path === '/hello') {
    ctx.body = {
      message: 'Selamat datang di Koa API',
      status: 'online'
    };
  }
});

app.listen(port, async (): Promise<void> => {
    try {
        console.info(`[Koa-Service] Server is running on port ${port}`);
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

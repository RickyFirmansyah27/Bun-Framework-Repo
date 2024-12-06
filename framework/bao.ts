import Bao, { Context, IHandler } from 'baojs';

const app = new Bao();

export const routes = [
  {
    path: '/bao',
    method: 'GET',
    handler: async (ctx: Context): Promise<Context> => {
      ctx.sendJson({ message: 'Welcome to Bao.js' });
      return ctx;
    },
  },
];

routes.forEach((route) => {
  app.get(route.path, route.handler);
});

// Jalankan server
app.listen({ port: 8100 });

import { Context } from "baojs";
import { Logger } from "./logger";

interface Route {
    path: string;
    handler: (ctx: Context) => Promise<void>;
  }

declare const routes: Route[];

export default async function serverlessHandler(ctx: Context) {
    try {
      const route = routes.find((route) => route.path === ctx.req.url);
  
      if (!route || !route.handler) {
        ctx.sendPrettyJson({
          statusCode: 404,
          error: 'Not Found',
          message: 'Route not found',
        });
        return;
      }
  
      await route.handler(ctx);
    } catch (error) {
      Logger.error(`Error handling request: ${error.message}`);
      ctx.res?.status(500); // Internal Server Error
      ctx.sendJson({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
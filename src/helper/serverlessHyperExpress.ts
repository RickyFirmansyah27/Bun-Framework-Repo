// serverlessHandler.ts
import { BaseResponse } from "./base-response";
import { Logger } from "./logger";

interface Route {
  path: string;
  handler: (req: Request, res: Response) => Promise<void>;
}

// Assuming `routes` is defined somewhere in your code.
declare const routes: Route[];


export default async function serverlessHandler(req: Request, res: Response): Promise<void> {
  try {
    const route = routes.find((route) => route.path === req.url);

    if (!route || !route.handler) {
      BaseResponse(res, 'Route not found', 'notFound');
      return;
    }

    await route.handler(req, res);
  } catch (error: unknown) {
    if (error instanceof Error) {
      Logger.error(`Error handling request: ${error.message}`);
    } else {
      Logger.error('An unknown error occurred while handling the request');
    }
    BaseResponse(res, 'Internal Server Error', 'internalServerError');
  }
}

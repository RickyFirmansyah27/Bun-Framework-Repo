import { Logger } from './logger';

export const httpLogger = async (req: Request, res: Response, next: Function): Promise<void> => {
    const start = process.hrtime();

    // Log the incoming request
    Logger.http({
        message: `Request | Method: ${req.method} | Headers: ${JSON.stringify(req.headers)} | URL: ${req.url}`
    });

    // Use Bun's response object to track when the response is finished
    const originalEnd = res.end;
    res.end = (...args: any[]): void => {
        const duration = process.hrtime(start);
        const durationInMs = duration[0] * 1000 + duration[1] / 1e6;

        // Log the outgoing response
        Logger.http({
            message: `Response | Method: ${req.method} | URL: ${req.url} | Status: ${res.status} | Duration: ${durationInMs.toFixed(2)} ms`
        });

        originalEnd.apply(res, args);
    };

    // Proceed with the next middleware or handler
    next();
};

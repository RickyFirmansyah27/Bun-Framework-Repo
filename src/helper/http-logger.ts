import { Logger } from './logger';

export const httpLogger = async (req: Request, res: Response, next: Function) => {
    const start = process.hrtime();

    Logger.http({
        message: `Request | Method: ${req.method} | Headers: ${JSON.stringify(req.headers)} | URL: ${req.url}`
    });

    // Using Bun's response object to track when the response is finished
    const originalEnd = res.end;
    res.end = (...args: any[]) => {
        const duration = process.hrtime(start);
        const durationInMs = duration[0] * 1000 + duration[1] / 1e6;

        Logger.http({
            message: `Response | Method: ${req.method} | URL: ${req.url} | Status: ${res.statusCode} | Duration: ${durationInMs.toFixed(2)} ms`
        });

        originalEnd.apply(res, args);
    };

    next();
};
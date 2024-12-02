import { createServer, IncomingMessage, ServerResponse } from 'http';

export const convertToRequest = async (req: IncomingMessage): Promise<Request> => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const method = req.method!;
  const headers = new Headers(req.headers as Record<string, string>);

  const options: RequestInit = { method, headers };

  // Read the request body if necessary (for POST, PUT, PATCH)
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    options.body = await new Promise<string>((resolve, reject) => {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });
      req.on('end', () => {
        resolve(data);  // Resolve with the body as string
      });
      req.on('error', err => {
        reject(err);  // Reject if there’s an error in reading the body
      });
    });
  }

  return new Request(url.toString(), options);
};

export const serverless = (app: any) => createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Await the Promise to get the actual Request object
      const request = await convertToRequest(req);
  
      const response = await app.fetch(request);
  
      // Send the response to the client
      res.statusCode = response.status;
      res.statusMessage = response.statusText;
      response.headers.forEach((value: string | number | readonly string[], name: string) => {
        res.setHeader(name, value);
      });
  
      const body = await response.text();
      res.end(body);
    } catch (err) {
      // Handle any error that occurs
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

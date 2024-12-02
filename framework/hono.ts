import { Hono } from 'hono';
import { serverless } from '../src/helper';


// Buat instance aplikasi Hono
const app = new Hono();
const port = 8002;
// Definisikan rute
app.get('/hello', (c) => c.text('Selamat datang di Hono API'));

const server = serverless(app);

server.listen(port, () => {
  console.log(`[Hono-Service] Server is running on port ${port}`);
});

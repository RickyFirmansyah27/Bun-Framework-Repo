import { Elysia } from 'elysia';
import { serverless } from '../src/helper';

// Buat instance aplikasi Elysia
const app = new Elysia();
const port = 8003

// Definisikan rute
app.get('/hello', (req) => {
  return 'Selamat datang di Elysia API';
});

const server = serverless(app);

// Menjalankan server pada port 3000
server.listen(port, () => {
  console.log(`[Elysia-Service] Server is running on port ${port}`);
});

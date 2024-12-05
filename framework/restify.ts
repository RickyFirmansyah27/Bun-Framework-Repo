import restify from 'restify';

// Create the server
const server = restify.createServer();

// Define the GET route
server.get('/hello', (req, res, next) => {
  res.send({ message: 'Hello, world!' });
  next();
});

// Start the server on port 8100
server.listen(8100, () => {
  console.log('Server is running at http://localhost:8100');
});

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Wrap the Express app in a raw HTTP server, so both normal HTTP requests
// (REST API) and WebSocket connections can share the same port.
const httpServer = http.createServer(app);

// Attach Socket.io to that same HTTP server.
const io = new Server(httpServer, {
  cors: {
    origin: '*', // fine for local dev; tighten this before deploying
  },
});

// Make `io` reachable from inside Express routes (e.g. expenses.js),
// so a route handler can broadcast an event after it changes data.
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`EvenUp API + WebSocket server listening on http://localhost:${PORT}`);
});
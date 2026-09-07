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

  // Client tells the server which group they want live updates for.
  // Room name is just "group:<id>" — Socket.io handles routing internally.
  socket.on('join_group', (groupId) => {
    const room = `group:${groupId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined ${room}`);
  });

  socket.on('leave_group', (groupId) => {
    const room = `group:${groupId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`EvenUp API + WebSocket server listening on http://localhost:${PORT}`);
});
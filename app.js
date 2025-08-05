const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3000;

// In-memory state
const players = {}; // Store players { socketId: { name: 'PlayerName' } }
let buzzerActive = false;
let buzzQueue = []; // An ordered list of players who buzzed [{ id, name }]

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Player view
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'player.html'));
});

// Host view
app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'host.html'));
});

// Socket.IO connection logic
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Send the current state to the new client
  socket.emit('update-player-list', players);

  // When a player joins with a name
  socket.on('player-join', (data) => {
    players[socket.id] = {
      name: data.name
    };
    console.log(`Player ${data.name} joined with ID ${socket.id}`);
    // Broadcast the updated player list to everyone
    io.emit('update-player-list', players);
  });

  // When host starts the next question
  socket.on('start-question', () => {
    if (buzzerActive) {
      console.log('Attempted to start question while one is already active.');
      return;
    }
    console.log('Host started a new question. Arming buzzers for 5 seconds.');
    buzzerActive = true;
    buzzQueue = [];
    io.emit('arm-buzzers');
    // Also notify host to clear its display
    io.emit('update-buzz-queue', buzzQueue);

    setTimeout(() => {
      console.log('5 seconds are up. Disarming buzzers.');
      buzzerActive = false;
      // Let clients know the buzzing window has closed
      io.emit('disarm-buzzers');
    }, 5000);
  });

  // When a player buzzes in
  socket.on('buzz', () => {
    if (buzzerActive && players[socket.id] && !buzzQueue.find(p => p.id === socket.id)) {
      const playerData = { id: socket.id, name: players[socket.id].name };
      buzzQueue.push(playerData);
      console.log(`Player ${playerData.name} buzzed in. Queue:`, buzzQueue.map(p => p.name));
      io.emit('update-buzz-queue', buzzQueue);
    }
  });

  // When host resets the buzzers
  socket.on('reset-buzzers', () => {
    console.log('Host initiated "Get Ready" state.');
    buzzerActive = false;
    buzzQueue = [];
    io.emit('get-ready'); // Signal all clients to enter the ready state
    io.emit('update-buzz-queue', buzzQueue);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    if (players[socket.id]) {
      delete players[socket.id];
      io.emit('update-player-list', players);
      // Also remove from buzz queue if they were in it
      buzzQueue = buzzQueue.filter(p => p.id !== socket.id);
      io.emit('update-buzz-queue', buzzQueue);
    }
  });
});

server.listen(port, () => {
  console.log(`Quiz app listening at http://localhost:${port}`);
});

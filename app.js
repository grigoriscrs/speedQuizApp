const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3000;

// In-memory state
const players = {}; // { socketId: { name: 'PlayerName' } }
let scores = {};    // { socketId: points }
let nameScores = {}; // { playerName: score }
let buzzerActive = false;
let buzzQueue = [];
let currentAnsweringIndex = -1;
let questionValue = 1; // Points for current question

// Helper: send next player in buzzQueue their turn
function sendNextToAnswer() {
  if (buzzQueue.length > 0 && currentAnsweringIndex < buzzQueue.length) {
    const player = buzzQueue[currentAnsweringIndex];
    io.to(player.id).emit('your-turn-to-answer');
    io.emit('host-status', `${player.name}'s turn to answer.`);
  } else {
    io.emit('get-ready');
    currentAnsweringIndex = -1;
    buzzQueue = [];
    questionValue = 1;
    io.emit('update-buzz-queue', buzzQueue);
  }
}

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
    // Restore score by name if exists
    let previousScore = nameScores[data.name] || 0;

    // Remove any previous player with this name (cleanup)
    for (const id in players) {
      if (players[id].name === data.name) {
        delete players[id];
        delete scores[id];
        break;
      }
    }

    players[socket.id] = { name: data.name };
    scores[socket.id] = previousScore;
    nameScores[data.name] = previousScore; // Ensure mapping is up to date

    console.log(`Player ${data.name} joined with ID ${socket.id} (restored score: ${previousScore})`);
    io.emit('update-player-list', players);
    io.emit('update-scores', scores, players);
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
    currentAnsweringIndex = -1;
    questionValue = 1;
    io.emit('arm-buzzers');
    io.emit('update-buzz-queue', buzzQueue);

    setTimeout(() => {
      console.log('5 seconds are up. Disarming buzzers.');
      buzzerActive = false;
      // Let clients know the buzzing window has closed
      io.emit('disarm-buzzers');
      // After buzzing is over, start answer phase if anyone buzzed
      if (buzzQueue.length > 0) {
        currentAnsweringIndex = 0;
        sendNextToAnswer();
      }
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

  // When a player submits an answer
  socket.on('submit-answer', ({ answer }) => {
    // Forward answer to host for review
    if (currentAnsweringIndex >= 0 && buzzQueue[currentAnsweringIndex]) {
      const player = buzzQueue[currentAnsweringIndex];
      io.emit('player-answer', { playerId: player.id, playerName: player.name, answer });
    }
  });

  // Host accepts answer
  socket.on('host-accept', () => {
    if (currentAnsweringIndex >= 0 && buzzQueue[currentAnsweringIndex]) {
      const player = buzzQueue[currentAnsweringIndex];
      scores[player.id] = (scores[player.id] || 0) + questionValue;
      nameScores[player.name] = scores[player.id]; // <-- update persistent score
      console.log(`Player ${player.name} (${player.id}) awarded ${questionValue} point(s). Total: ${scores[player.id]}`);
      io.emit('log-points', { playerName: player.name, points: questionValue, total: scores[player.id] });
      io.emit('update-scores', scores, players);
    }
    io.emit('get-ready');
    currentAnsweringIndex = -1;
    buzzQueue = [];
    questionValue = 1;
    io.emit('update-buzz-queue', buzzQueue);
  });

  // Host rejects answer
  socket.on('host-reject', () => {
    questionValue += 1;
    currentAnsweringIndex++;
    if (currentAnsweringIndex < buzzQueue.length) {
      sendNextToAnswer();
    } else {
      io.emit('get-ready');
      currentAnsweringIndex = -1;
      buzzQueue = [];
      questionValue = 1;
      io.emit('update-buzz-queue', buzzQueue);
    }
  });

  // When host resets the buzzers
  socket.on('reset-buzzers', () => {
    console.log('Host initiated "Get Ready" state.');
    buzzerActive = false;
    buzzQueue = [];
    questionValue = 1;
    io.emit('get-ready'); // Signal all clients to enter the ready state
    io.emit('reset-buzzers');
    io.emit('update-buzz-queue', buzzQueue);
  });

  // When a player disconnects
  socket.on('disconnect', () => {
    if (players[socket.id]) {
      // Save score by name before deleting
      const name = players[socket.id].name;
      if (scores[socket.id] !== undefined) {
        nameScores[name] = scores[socket.id];
      }
      delete players[socket.id];
      delete scores[socket.id];
      io.emit('update-player-list', players);
      io.emit('update-scores', scores, players);
      buzzQueue = buzzQueue.filter(p => p.id !== socket.id);
      io.emit('update-buzz-queue', buzzQueue);
    }
  });
});

server.listen(port, () => {
  console.log(`Quiz app listening at http://localhost:${port}`);
});

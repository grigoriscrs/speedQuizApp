const socket = io();

// Get DOM elements
const playersList = document.getElementById('players-list');
const buzzOrderList = document.getElementById('buzz-order');
const statusMessage = document.getElementById('status-message');
const getReadyButton = document.getElementById('get-ready-button');
const nextQuestionButton = document.getElementById('next-question-button');
const resetButton = document.getElementById('reset-button');
const scoresList = document.getElementById('scores-list');

const answerReview = document.getElementById('answer-review');
const answerText = document.getElementById('answer-text');
const acceptAnswer = document.getElementById('accept-answer');
const rejectAnswer = document.getElementById('reject-answer');
let reviewingPlayerId = null;

console.log('Host script loaded. Ready to manage the quiz!');

socket.on('update-player-list', (players) => {
    playersList.innerHTML = ''; // Clear the list
    for (const id in players) {
        const player = players[id];
        const li = document.createElement('li');
        li.textContent = player.name;
        playersList.appendChild(li);
    }
});

// getReadyButton.addEventListener('click', () => {
//     console.log('Host: Sending "get-ready" to server.');
//     socket.emit('get-ready');
// });

nextQuestionButton.addEventListener('click', () => {
    console.log('Host: Sending "start-question" to server.');
    socket.emit('start-question');
});

resetButton.addEventListener('click', () => {
    console.log('Host: Sending "reset-buzzers" to server.');
    nextQuestionButton.disabled = false;
    statusMessage.textContent = 'Ready for next question.';
    statusMessage.style.color = '#333';
    socket.emit('reset-buzzers');
});

socket.on('update-buzz-queue', (buzzQueue) => {
    console.log('Host: Received updated buzz queue:', buzzQueue);
    if (buzzQueue.length > 0) {
        statusMessage.textContent = 'Buzzers have been hit!';
        statusMessage.style.color = 'blue';
    }
    buzzOrderList.innerHTML = ''; // Clear the list
    buzzQueue.forEach((player, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${player.name}`;
        buzzOrderList.appendChild(li);
    });
});

socket.on('arm-buzzers', () => {
    console.log('Host: Buzzers are now active.');
    nextQuestionButton.disabled = true;
    statusMessage.textContent = 'Buzzers are LIVE for 5 seconds!';
    statusMessage.style.color = 'green';
});

socket.on('disarm-buzzers', () => {
    console.log('Host: Buzzers are now inactive.');
    nextQuestionButton.disabled = false;
    // Only update status if no one buzzed in
    if (buzzOrderList.children.length === 0) {
        statusMessage.textContent = 'Time is up! No one buzzed in.';
        statusMessage.style.color = 'orange';
    }
});

socket.on('player-answer', ({ playerId, playerName, answer }) => {
    answerReview.style.display = 'block';
    answerText.textContent = `${playerName}: ${answer || '[No answer submitted]'}`;
    reviewingPlayerId = playerId;
});

acceptAnswer.addEventListener('click', () => {
    answerReview.style.display = 'none';
    socket.emit('host-accept', { playerId: reviewingPlayerId });
    reviewingPlayerId = null;
});

rejectAnswer.addEventListener('click', () => {
    answerReview.style.display = 'none';
    socket.emit('host-reject', { playerId: reviewingPlayerId });
    reviewingPlayerId = null;
});

// Listen for score updates and render them
socket.on('update-scores', (scores, players) => {
    scoresList.innerHTML = '';
    for (const id in players) {
        const li = document.createElement('li');
        li.textContent = `${players[id].name}: ${scores[id] || 0}`;
        scoresList.appendChild(li);
    }
});

// Log when a player gets points
socket.on('log-points', ({ playerName, points, total }) => {
    console.log(`Player ${playerName} awarded ${points} point(s). Total: ${total}`);
});
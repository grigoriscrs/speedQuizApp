const socket = io();

// Get DOM elements
const joinContainer = document.querySelector('.join-container');
const nameEntry = document.getElementById('name-entry');
const nameInput = document.getElementById('name-input');
const joinButton = document.getElementById('join-button');
const buzzButton = document.getElementById('buzz-button');
const playerGreeting = document.getElementById('player-greeting');
const infoTimer = document.getElementById('info-timer');
const answerContainer = document.getElementById('answer-container');
const answerInput = document.getElementById('answer-input');
const submitAnswerButton = document.getElementById('submit-answer-button');
const playerScore = document.getElementById('player-score');

let countdownInterval;
let answerTimeout;
let mySocketId = null;
let myName = null;

// Get your socket ID on connect
socket.on('connect', () => {
    mySocketId = socket.id;
});

socket.on('your-turn-to-answer', () => {
    console.log('It is your turn to answer!');
    buzzButton.style.display = 'none';
    answerContainer.style.display = 'block';
    answerInput.value = '';
    answerInput.focus();

    clearTimeout(answerTimeout);
    clearInterval(countdownInterval);

    let timeLeft = 10;
    infoTimer.textContent = timeLeft;
    infoTimer.style.display = 'block';

    countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            infoTimer.textContent = timeLeft;
        } else {
            infoTimer.textContent = "Time is up!";
            clearInterval(countdownInterval);
        }
    }, 1000);

    answerTimeout = setTimeout(() => {
        const answer = answerInput.value.trim();
        console.log('Auto-submitting answer:', answer);
        socket.emit('submit-answer', { answer });
        answerContainer.style.display = 'none';
        clearInterval(countdownInterval);
        infoTimer.textContent = 'Waiting...';
        infoTimer.style.display = 'block';
    }, 10000); // 10 seconds to answer
});

// When joining, save your name
joinButton.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name) {
        myName = name;
        socket.emit('player-join', { name });
        joinContainer.style.display = 'none';
        playerGreeting.textContent = `Hi, ${name}!`;
        playerGreeting.style.display = 'block';
        playerScore.style.display = 'block';
        buzzButton.style.display = 'flex';
        buzzButton.disabled = true;
        infoTimer.textContent = 'Get Ready...';
        infoTimer.style.display = 'block';
    }
});

// Listen for score updates and update your score
socket.on('update-scores', (scores, players) => {
    // Try to find your score by socket ID first, then by name if needed
    let score = 0;
    if (mySocketId && scores[mySocketId] !== undefined) {
        score = scores[mySocketId];
    } else if (myName) {
        // Fallback: find by name (in case of reconnect)
        for (const id in players) {
            if (players[id].name === myName && scores[id] !== undefined) {
                score = scores[id];
                break;
            }
        }
    }
    playerScore.textContent = `Score: ${score}`;
    playerScore.style.display = 'block';
});

submitAnswerButton.addEventListener('click', () => {
    const answer = answerInput.value.trim();
    if (answer) {
        console.log(`Submitting answer: ${answer}`);
        socket.emit('submit-answer', { answer });
        answerInput.value = '';
        answerContainer.style.display = 'none';
        clearTimeout(answerTimeout);
        clearInterval(countdownInterval);
        infoTimer.textContent = 'Waiting...';
        infoTimer.style.display = 'block';
    } else {
        console.log('Answer input is empty. Please type your answer.');
    }
});

buzzButton.addEventListener('click', () => {
    console.log('BUZZ! Sending buzz to server.');
    socket.emit('buzz');
    // Stop the countdown and hide it once the player has buzzed
    clearInterval(countdownInterval);
    infoTimer.style.display = 'none';
    buzzButton.disabled = true; // Prevent multiple buzzes
});

socket.on('arm-buzzers', () => {
    console.log('Host armed the buzzers! You can buzz in now.');
    buzzButton.disabled = false;

    // Clear "Get Ready" text before starting countdown
    infoTimer.textContent = '';

    // --- Start Countdown ---
    let timeLeft = 5;
    infoTimer.textContent = timeLeft;
    infoTimer.style.display = 'block';

    // Clear any previous interval to be safe
    clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            infoTimer.textContent = timeLeft;
        } else {
            // When the timer hits 0, show a message
            infoTimer.textContent = "Time's Up!";
            clearInterval(countdownInterval);
        }
    }, 1000);
});

socket.on('disarm-buzzers', () => {
    console.log('Time is up! Buzzers are now inactive.');
    buzzButton.disabled = true;
});

socket.on('get-ready', () => {
    console.log('Host initiated "Get Ready" state. Waiting for question.');
    buzzButton.disabled = true;
    buzzButton.style.display = 'flex'; // Ensure buzzer is visible
    clearInterval(countdownInterval);
    infoTimer.textContent = 'Get Ready...';
    infoTimer.style.display = 'block';
});

socket.on('reset-buzzers', () => {
    answerContainer.style.display = 'none';
    clearTimeout(answerTimeout);
    clearInterval(countdownInterval);
    infoTimer.textContent = 'Waiting...';
    infoTimer.style.display = 'block';
});

// Optional: If you want to show "Waiting..." when not your turn, you can add a custom event from the server
// For now, after submitting or reset, "Waiting..." will be shown as requested
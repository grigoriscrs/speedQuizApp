const socket = io();

// Get DOM elements
const container = document.querySelector('.container');
const nameEntry = document.getElementById('name-entry');
const nameInput = document.getElementById('name-input');
const joinButton = document.getElementById('join-button');
const buzzButton = document.getElementById('buzz-button');
const playerGreeting = document.getElementById('player-greeting');
const infoTimer = document.getElementById('info-timer');
let countdownInterval;


joinButton.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name) {
        socket.emit('player-join', { name });

        container.style.display = 'none'; // Hide the whole join form

        playerGreeting.textContent = `Hi, ${name}!`;
        playerGreeting.style.display = 'block';
        // Enter a waiting state immediately upon joining
        buzzButton.style.display = 'flex';
        buzzButton.disabled = true;
        infoTimer.textContent = 'Get Ready...';
        infoTimer.style.display = 'block';
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
            countdownTimer.textContent = "Time's Up!";
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
    // Clean up previous countdown and show the ready message
    clearInterval(countdownInterval);
    infoTimer.textContent = 'Get Ready...';
    infoTimer.style.display = 'block';
});
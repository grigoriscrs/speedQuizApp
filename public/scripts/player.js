const socket = io();

// Get DOM elements
const joinContainer = document.querySelector('.text-entry'); // join form container
const nameInput = document.getElementById('name-input');
const joinButton = document.getElementById('join-button');
const buzzButton = document.getElementById('buzz-button');
const playerGreeting = document.getElementById('player-greeting');
const infoTimer = document.getElementById('info-timer');
const answerContainer = document.getElementById('answer-container');
const answerInput = document.getElementById('answer-input');
const submitAnswerButton = document.getElementById('submit-answer-button');
const playerScore = document.getElementById('player-score');
buzzButton.addEventListener('mousedown', () => buzzButton.classList.add('active'));
buzzButton.addEventListener('mouseup', () => buzzButton.classList.remove('active'));
buzzButton.addEventListener('mouseleave', () => buzzButton.classList.remove('active'));
buzzButton.addEventListener('touchstart', () => buzzButton.classList.add('active'));
buzzButton.addEventListener('touchend', () => buzzButton.classList.remove('active'));
buzzButton.addEventListener('touchcancel', () => buzzButton.classList.remove('active'));

let countdownInterval;
let answerTimeout;
let mySocketId = null;
let myName = null;

// Get your socket ID on connect
socket.on('connect', () => {
    mySocketId = socket.id;
});


if (buzzButton) {
    // Add the active class on touch start
    buzzButton.addEventListener('touchstart', function() {
        buzzButton.classList.add('is-active');
    }, { passive: true }); // Use passive: true for better performance

    // Remove the active class on touch end
    buzzButton.addEventListener('touchend', function() {
        buzzButton.classList.remove('is-active');
    }, { passive: true });

    // A fallback for desktop and other pointer devices
    buzzButton.addEventListener('mousedown', function() {
        buzzButton.classList.add('is-active');
    });

    buzzButton.addEventListener('mouseup', function() {
        buzzButton.classList.remove('is-active');
    });
}

socket.on('your-turn-to-answer', () => {
    buzzButton.style.display = 'none';
    answerContainer.style.display = '';
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
    let score = 0;
    if (mySocketId && scores[mySocketId] !== undefined) {
        score = scores[mySocketId];
    } else if (myName) {
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
        socket.emit('submit-answer', { answer });
        answerInput.value = '';
        answerContainer.style.display = 'none';
        clearTimeout(answerTimeout);
        clearInterval(countdownInterval);
        infoTimer.textContent = 'Waiting...';
        infoTimer.style.display = 'block';
    }
});

buzzButton.addEventListener('click', () => {
    socket.emit('buzz');
    clearInterval(countdownInterval);
    infoTimer.style.display = 'none';
    buzzButton.disabled = true;
});

socket.on('arm-buzzers', () => {
    buzzButton.disabled = false;
    infoTimer.textContent = '';
    let timeLeft = 5;
    infoTimer.textContent = timeLeft;
    infoTimer.style.display = 'block';
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            infoTimer.textContent = timeLeft;
        } else {
            infoTimer.textContent = "Time's Up!";
            clearInterval(countdownInterval);
        }
    }, 1000);
});

socket.on('disarm-buzzers', () => {
    buzzButton.disabled = true;
});

socket.on('get-ready', () => {
    buzzButton.disabled = true;
    buzzButton.style.display = 'flex';
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
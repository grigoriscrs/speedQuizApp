# Speed Quiz App

Welcome to **Speed Quiz App** – a real-time, fast-paced quiz game for groups!  
Players join from their own devices, buzz in to answer questions, and compete for the highest score. The host controls the flow, reviews answers, and awards points. Perfect for classrooms, parties, or remote team-building!

---

## 🚀 Features

- **Real-time Multiplayer:** Players join instantly from their phones or computers.
- **Buzz-In System:** Only the fastest get to answer first!
- **Dynamic Scoring:** Each wrong answer increases the question's value.
- **Live Scoreboard:** Scores update instantly for both host and players.
- **Session Recovery:** Players who refresh or reconnect with the same name keep their score.
- **Mobile-First Design:** Optimized for phones and tablets, but works great on desktop too.
- **Host Controls:** Start questions, review answers, and reset buzzers with a click.

---

## 🖥️ How It Works

1. **Host** opens the Host View and starts a quiz session.
2. **Players** join via the Player View, enter their name, and wait for the host to start.
3. When a question starts, players race to buzz in.
4. The host reviews answers, awards points, and controls the next round.
5. Scores are tracked and displayed live for everyone.

---

## 🛠️ Technology Stack

- **Node.js & Express:** Backend server for routing and static file serving.
- **Socket.IO:** Real-time, bidirectional communication between host and players.
- **HTML5 & CSS3:** Responsive, mobile-friendly UI for both host and players.
- **Vanilla JavaScript:** All client-side logic, no frameworks required.
- **In-Memory State:** Fast, session-based storage for players and scores (no database needed).

---

## 📦 Getting Started

1. **Clone this repo:**  
   `git clone https://github.com/yourusername/speedQuizApp.git`
2. **Install dependencies:**  
   `npm install`
3. **Start the server:**  
   `node app.js`
4. **Open in browser:**  
   - Host: [http://localhost:3000/host](http://localhost:3000/host)
   - Player: [http://localhost:3000/](http://localhost:3000/)

---

## ✨ Customization

- Edit logic, add themes, or tweak the scoring system in the code!
- All styles are in `/public/css/`, and logic is in `/public/scripts/`.

---

## 📝 License

MIT License.  
Feel free to use, modify, and share!
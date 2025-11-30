# The One Protocol

> **"Wake up, Neo..."**

**The One Protocol** is an immersive, browser-based terminal simulator that gamifies the plot of *The Matrix*. It combines retro aesthetics, real-time procedural animation, and cloud persistence to determine if you have what it takes to be The One.

---

## 🔗 Try It Out

### [📂 View Code](https://StephenXdD/your-username/the-one-protocol)

---

## 🛠 Built With

* ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
* ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
* ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
* ![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
* **Tone.js** (Audio Synthesis)
* **Web Speech API** (Text-to-Speech)
* **HTML5 Canvas** (Digital Rain)

---

## 📖 Project Story

### Inspiration
Our project was born from a love for the seminal 1999 sci-fi classic, *The Matrix*. We wanted to answer a simple question: **What if you could sit at that terminal?**

We were inspired by the aesthetic of late 90s cyberpunk—the glowing green CRT monitors, the cascading digital rain, and the command-line interfaces that defined the era's view of "hacking." Instead of just watching Neo make the choice, we wanted to build a simulation where **the user** has to make the choice.

### What it does
It guides the user through 8 distinct stages of the movie storyline via a command-line interface:
1.  **Visual Simulation:** Renders procedurally generated "Digital Rain" (HTML5 Canvas) and mimics a retro CRT monitor with CSS scanlines and flicker.
2.  **Audio Immersion:** Utilizes the **Web Speech API** for robotic Text-to-Speech and **Tone.js** for dynamic sci-fi synth sounds on every keystroke.
3.  **Cloud Persistence:** Integrates with **Firebase Firestore** to log "Mission Reports," creating a permanent record of every user's success or failure.

### How we built it
We made a conscious decision to stick to **Vanilla JavaScript** to maintain raw control over the DOM and performance, avoiding the overhead of heavy frameworks for what is essentially a high-performance visual and audio demo.
* **Core Logic:** A JavaScript state-machine tracks `currentStage` and parses user commands (e.g., `RED`, `DODGE`).
* **The Digital Rain:** A custom algorithm calculates the velocity and position of text streams in real-time. We implemented the "White Leader" effect, where the first character in a stream glows white before fading to green.
* **Audio System:** We used **Tone.js** to synthesize sounds directly in the browser instead of loading static MP3 files.

### Challenges we ran into
* **Synchronization:** Originally, if a user typed `RESET` while a message was still printing, the two messages would merge into garbled text. We implemented a robust `clearTimeout` system to kill active typing loops before starting new ones.
* **Audio Sync:** Browsers handle Text-to-Speech at different rates. We had to fine-tune the typing speed (roughly 75ms) to align with the SpeechSynthesis rate (1.25x) so the robotic voice wouldn't finish seconds before the text was readable.

---

## 💻 Local Installation

To run this project locally on your machine:

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/the-one-protocol.git](https://github.com/your-username/the-one-protocol.git)
    cd the-one-protocol
    ```

2.  **Open `index.html`**
    * Simply double-click `index.html` to open it in your browser.
    * *Note: For the best experience (and to avoid CORS issues with some browsers), usage of the "Live Server" extension in VS Code is recommended.*

3.  **Configure Firebase**
    * Open `index.html` in your code editor.
    * Locate the `<script type="module">` section.
    * Replace the `firebaseConfig` placeholder code with your own Firebase project keys:
    ```javascript
    // Replace the placeholder config with your actual details:
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    ```

---

## 🎮 Controls

* **Type commands** into the input field (e.g., `RED`, `BLUE`, `JUMP`).
* **Press Enter** to submit.
* **Type `RESET`** at any time to restart the simulation.

---

*“I can only show you the door. You're the one that has to walk through it.”*

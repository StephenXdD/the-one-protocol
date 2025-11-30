// =================================================================
// PART 1: AUDIO, PERSISTENCE, AND GAME LOGIC
// =================================================================

// Universal Responses for when the user is off-script
const defaultResponses = [
    "There is a difference between knowing the path and walking the path.",
    "Do not try to bend the spoon, that's impossible.",
    "The Matrix has you.",
    "She's waiting for you.",
];

// Get references to the key DOM elements
const userInput = document.getElementById('user-input');
const outputArea = document.getElementById('output-area');
const promptSpan = document.querySelector('.prompt');

// GLOBAL VARIABLES
let currentStage = 0; 
let typingTimeout = null; 

// --- TONE.JS AUDIO SETUP ---
let synth = null;
let winSynth = null;
let failSynth = null;
let isAudioInitialized = false;

function initializeAudio() {
    if (isAudioInitialized) return;

    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    
    if (typeof Tone !== 'undefined') {
        synth = new Tone.MembraneSynth({
            pitchDecay: 0.01,
            envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.05 }
        }).toDestination();
        
        winSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 1 }
        }).toDestination();

        failSynth = new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.5 }
        }).toDestination();
    }
    
    isAudioInitialized = true;
}

// --- TEXT-TO-SPEECH (TTS) FUNCTION ---
function speakText(text) {
    if (!('speechSynthesis' in window)) return;

    const cleanText = text
        .replace(/<br>/g, '. ') 
        .replace(/<[^>]*>/g, '') 
        .replace(/\*/g, '')
        .replace(/>/g, ''); 

    window.speechSynthesis.cancel(); 

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.name.includes("Google US English")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.pitch = 0.6; 
    utterance.rate = 0.9; 
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
}

// --- FIREBASE PERSISTENCE LOGIC ---
async function saveMissionLog(status, detail) {
    if (!window.db || !window.userId || !window.appId) return;
    
    const maxRetries = 3;
    let delay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const logRef = window.db.collection(`artifacts/${window.appId}/users/${window.userId}/mission_log`);
            await logRef.add({
                status: status,
                detail: detail,
                timestamp: new Date().toISOString(),
                stage: currentStage
            });
            return; 
        } catch (e) {
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
            }
        }
    }
}

// Function to reset the game state
function resetGame() {
    currentStage = 1; 
    promptSpan.textContent = `// STAGE ${currentStage} // COMMAND >`;
    const introMessage = "System Online. Operator, a critical anomaly has been detected: THOMAS ANDERSON. Morpheus is initiating contact. Follow instructions to guide him out. Type **'ACCEPT'** to begin.";
    
    typeMessage(outputArea, introMessage, introMessage);
    userInput.value = ''; 
    userInput.focus();
}

// Function to simulate typing out the message (Typewriter Effect)
function typeMessage(element, displayMessage, audioText = null, callback = () => {}) {
    initializeAudio(); 
    
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }

    if (audioText) {
        speakText(audioText);
    }

    let i = 0;
    element.innerHTML = ''; 

    function typeChar() {
        if (i < displayMessage.length) {
            const char = displayMessage.charAt(i);
            
            if (char !== ' ' && synth) {
                 try {
                    synth.triggerAttackRelease(Tone.Midi(40 + Math.random() * 5).toNote(), "32n", Tone.now(), 0.5); 
                 } catch(e) {}
            }
            
            if (char === '\n') {
                element.innerHTML += '<br>';
            } else if (char === '*' && displayMessage.substring(i, i + 2) === '**') {
                element.innerHTML += '<strong>';
                i++;
            } else if (char === '*' && displayMessage.substring(i, i + 2) === '**/') {
                element.innerHTML += '</strong>';
                i++;
            } else {
                element.innerHTML += char;
            }

            i++;
            typingTimeout = setTimeout(typeChar, 75); 
        } else {
            typingTimeout = null; 
            callback();
        }
    }
    typeChar();
}

// Main function to advance the story based on user input
async function processGameLogic(query) {
    let response = "";
    const normalizedQuery = query.trim().toUpperCase();
    
    if (normalizedQuery === 'RESET') {
        resetGame();
        return; 
    }

    // --- STORYLINE LOGIC ---
    if (currentStage === 1) {
        // STAGE 1: PILLS
        if (normalizedQuery === 'ACCEPT') {
            response = "Morpheus: 'This is your last chance. After this, there is no turning back.'\n\n**DILEMMA:** Neo must choose between the red pill (TRUTH) or the blue pill (IGNORANCE).\n\nType **'RED'** to show him the truth, or **'BLUE'** to terminate the connection.";
            currentStage = 2;
        } else {
            response = "Command not recognized. We must guide him, Operator. Type **'ACCEPT'** to give him the choice.";
        }

    } else if (currentStage === 2) {
        // STAGE 2: JUMP PROGRAM
        if (normalizedQuery === 'RED') {
            response = "Morpheus: 'Welcome to the real world.'\n\n**SCENARIO:** Neo is in the Construct. He must learn to break the rules of the simulation. Morpheus tells him to jump across buildings.\n\n**CHALLENGE:** Instruct Neo to make the leap. Type **'JUMP'** to attempt the impossible, or **'HESITATE'** to fail the test.";
            currentStage = 3;
        } else if (normalizedQuery === 'BLUE') {
            response = "Session terminated. Anderson returns to his sleep. Morpheus leaves. The chance is lost.\n\n[Mission Failure: Chose Ignorance]\n\nType **'RESET'** to start a new contact attempt.";
            if(failSynth) failSynth.triggerAttackRelease("4n");
            await saveMissionLog("FAILURE", "Chose Ignorance (Blue Pill).");
            currentStage = 0;
        } else {
            response = "Invalid choice. The path is simple: **'RED'** or **'BLUE'**.";
        }

    } else if (currentStage === 3) {
        // STAGE 3: ORACLE / MORPHEUS CAPTURE
        if (normalizedQuery === 'JUMP') {
            response = "Success! (But he still fell).\n\n**SCENARIO:** Neo visits the Oracle. Agents ambush the team. Morpheus fights Smith to save Neo and is captured. He is being held in a military skyscraper.\n\n**COMMAND:** Neo and Trinity need guns. Lots of guns. Type **'RESCUE'** to storm the lobby.";
            currentStage = 4;
        } else if (normalizedQuery === 'HESITATE') {
            response = "Neo fails the jump. Doubt is the enemy. Morpheus is disappointed.\n\nType **'RESET'** to return to the last checkpoint (Stage 2).";
        } else {
            response = "Action not recognized. Instruct him to **'JUMP'** or **'HESITATE'**.";
        }

    } else if (currentStage === 4) {
        // STAGE 4: THE LOBBY (Existing)
        if (normalizedQuery === 'RESCUE') {
            response = "**SCENARIO:** The Lobby Shootout. Neo and Trinity clear the ground floor. They reach the roof, but an Agent is waiting. He fires at Neo.\n\n**CHALLENGE:** Neo moves like them. Type **'DODGE'** to evade the bullets.";
            currentStage = 5;
        } else {
             response = "We must save Morpheus. Type **'RESCUE'** to begin the assault.";
        }

    } else if (currentStage === 5) {
        // --- NEW SCENARIO: STAGE 5 (HELICOPTER / MINIGUN) ---
        if (normalizedQuery === 'DODGE') {
            response = "Bullets evaded. Trinity pilots the B-212 helicopter. Neo takes the minigun.\n\n**SCENARIO:** Morpheus is in the interrogation room. Agents are firing back. The helicopter is unstable.\n\n**CHALLENGE:** Break the glass to save Morpheus. Type **'FIRE'** to unleash the minigun.";
            currentStage = 6;
        } else {
            response = "You must act fast. Type **'DODGE'**.";
        }

    } else if (currentStage === 6) {
        // STAGE 6: SUBWAY FIGHT (Formerly Stage 5)
        if (normalizedQuery === 'FIRE') {
            response = "Glass shattered! Morpheus leaps onto the helicopter landing gear. They drop Neo at the subway station.\n\n**SCENARIO:** Agent Smith blocks the exit. The train is coming.\n\n**CLIMAX:** Neo stops running. He turns to face Smith. Type **'FIGHT'** to begin the duel.";
            currentStage = 7;
        } else {
            response = "Use the minigun. Type **'FIRE'**.";
        }

    } else if (currentStage === 7) {
        // --- NEW SCENARIO: STAGE 7 (RESURRECTION / SENTINELS) ---
        if (normalizedQuery === 'FIGHT') {
            response = "Neo defeats Smith, but Sentinels attack the ship in the real world. Neo runs to Room 303... and is shot by Smith. HE IS DEAD.\n\n**CRISIS:** Trinity speaks to his body: 'The Oracle told me I would fall in love, and that man would be The One.'\n\n**COMMAND:** Neo must wake up. Type **'BELIEVE'** to return.";
            currentStage = 8;
        } else {
            response = "He must fight. Type **'FIGHT'**.";
        }

    } else if (currentStage === 8) {
        // STAGE 8: VICTORY (Formerly Stage 6)
        if (normalizedQuery === 'BELIEVE') {
            response = "**SYSTEM ALERT:** ANOMALY CONFIRMED. CODE REINTEGRATION COMPLETE.\n\nNeo rises. He stops the bullets. He destroys Smith. The Sentinels are disabled.\n\n**YOU ARE THE ONE.**\n\nType **'FINISH'** to log this simulation.";
            currentStage = 9;
        } else {
            response = "Trinity needs him. Type **'BELIEVE'**.";
        }

    } else if (currentStage === 9) {
        if (normalizedQuery === 'FINISH') {
            response = "SIMULATION LOGGED. CONNECTION TERMINATED.\n\nType **'RESET'** to start a new simulation.";
            if(winSynth) winSynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "1n");
            await saveMissionLog("SUCCESS", "Matrix Override Complete.");
        } else {
             response = "Victory confirmed. Type **'FINISH'**.";
        }
    
    } else {
        response = "System Offline. Enter **'RESET'** to initiate new simulation.";
    }
    
    promptSpan.textContent = `// STAGE ${currentStage} // COMMAND >`;

    if (response === "" || (currentStage > 0 && currentStage < 9 && defaultResponses.some(r => r.toUpperCase().includes(normalizedQuery)))) {
         const randomIndex = Math.floor(Math.random() * defaultResponses.length);
         response = defaultResponses[randomIndex] + "\n\n(Follow the stage commands to advance the story.)";
    }

    const finalDisplayMessage = `> ${query}\n\n${response}`; 
    typeMessage(outputArea, finalDisplayMessage, response);
}

function handleInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        const question = userInput.value.trim();
        
        if (question.length > 0) {
            processGameLogic(question);
            userInput.value = '';
        } else {
            typeMessage(outputArea, "> Command required. Type 'RESET' to begin.", "Command required. Type RESET to begin.");
        }
    }
}

// =================================================================
// PART 2: THE MATRIX DIGITAL RAIN ANIMATION
// =================================================================

const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');

const katakana = "アァカサタナハマヤラワガザダバパイィキシチニヒミリヰギジヂビピウゥクズツヌフムユルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨロヲゴゾドボポ";
const numbers = "0123456789";
const characters = katakana + numbers;
const fontSize = 16;
let columns; 
const drops = []; 

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = canvas.width / fontSize;
    const oldLength = drops.length;
    drops.length = columns;

    for(let i = 0; i < columns; i++) {
        if (i >= oldLength || !drops[i] || typeof drops[i].y === 'undefined') {
            drops[i] = {
                y: Math.random() * canvas.height / fontSize,
                speed: Math.random() * 2 + 0.5 
            }; 
        }
    }
}

function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + 'px monospace';

    for(let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        if(!drop) continue;

        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        const x = i * fontSize;
        const y = drop.y * fontSize;

        if (drop.y * fontSize < 50) { 
             ctx.fillStyle = '#FFFFFF'; // Bright White
        } else {
             ctx.fillStyle = '#00FF41'; // Matrix Green
        }
        
        ctx.fillText(text, x, y);

        if(y > canvas.height && Math.random() > 0.975) {
            drop.y = 0;
            drop.speed = Math.random() * 2 + 0.5; 
        }

        drop.y += drop.speed;
    }

    requestAnimationFrame(draw);
}

window.onload = () => {
    initCanvas();
    draw();
    resetGame(); 
};

window.addEventListener('resize', initCanvas);
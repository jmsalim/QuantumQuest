/*
  ==============================================
  THE QUANTUM QUEST 3.0 - Prototype w/ VFX, Tutorial, Boss Battle Stage 2, Fonts & Audio Hooks
  ==============================================
*/

// --- GAME STATE MANAGEMENT ---
const LORE_SCREEN = -4;
const CHARACTER_SELECT = -3;
const NARRATION_SCREEN = -2;
const GAME_EXPLAIN_1 = -1.5; // First Explanation Screen
const GAME_EXPLAIN_2 = -1.6; // Second Explanation Screen
const CONFIRM_ACTION = -1;
const STABILIZATION_PHASE = 55; // QTE Phase State

// STAGE 1 (Starting Equipment)
const ROOM_1_A = 11; // Chrono-Cache (Shield)
const ROOM_1_B = 12; // Temporal Fault (Capacitor)

// STAGE 2 & 3
const ROOM_2_A = 21; // Stabilizer 1 Location (Echo Path)
const ROOM_2_B = 22; // Stabilizer 2 Location (Mine Path)
const ROOM_3_A = 31; // Temporal Amplifier Location (Void Spire)
const ROOM_3_B = 32; // Rest/Heal Chamber (Temporal Mire)

// STAGE 4 (Final Gate)
const FINAL_CHAMBER = 40;

const BOSS_PREVIEW = 45;

const BOSS_ROOM = 50;
const GAME_WIN = 60;
const GAME_OVER = 70;

const EVENT_NONE = 0;
const EVENT_MERCHANT = 1;
const EVENT_BATTLE = 2;

let gameState = LORE_SCREEN;
let currentEvent = EVENT_NONE;

let collectedStabilizers = 0;
const STABILIZERS_NEEDED = 2;

// --- 2. PLAYER & BOSS STATS ---
let playerHealth = 10;
let bossHealth = 30;
let bossAttackTimer = 0;
let activeAction = null;

// --- COMBAT STATE VARIABLES ---
let minorEnemyHealth = 3; // Wraith starts with 3 HP
let battleStarted = false; // Controls the start of damage phase for minor battles
let bossPhase = 1; // Tracks boss phases (1 or 2)
const BOSS_PHASE_2_HP = 10;

// QTE Variables
let sequenceTargetKey = null; // The key the player must press (e.g., 'F', 'P')
let sequenceTimer = 0; // The time remaining for the current key
let sequenceMaxTime = 0; // Max time for the current key (in frames)
let sequenceStep = 0; // Current step in the sequence (0 to 4)
const SEQUENCE_KEYS = ['F', 'P', 'R', 'K', 'G']; // 5 keys for 5 steps
// Time limits in frames (7s, 6s, 5s, 3s, 2s) -> Decreasing time challenge
const SEQUENCE_MAX_TIMES = [420, 360, 300, 180, 120];


// --- 3. INVENTORY AND EQUIPMENT ---
let hasQuantumShield = false;
let hasTemporalAmplifier = false;
let hasFluxCapacitor = false;
let capacitorUsed = false;
let minorEnemyDefeated = false;

// --- 4. CHARACTER SELECTION & STATS ---
let selectedCharacter = null;
const CHARACTERS = {
  SOLDIER: {
    name: "Major Thorne",
    desc: "Soldier",
    code: "s",
    STR: 3,
    INT: 1,
    activationText: "Emergency chronometers blink red. The cryo-stasis field collapses, slamming Major Thorne's boots onto the deck. His armor diagnostics immediately detect massive temporal displacement. He grips his rifle. Time to move."
},
  DOCTOR: {
    name: "Dr. Varr",
    desc: "Doctor",
    code: "d",
    STR: 1,
    INT: 3,
    activationText: "Dr. Varr grips the edge of her console, the world shimmering around her. Her quantum instruments scream warnings. The reality engine is failing. She is the only one close enough to fix it."
},
  ROBOT: {
    name: "UNIT T-34",
    desc: "Robot",
    code: "b",
    STR: 2,
    INT: 2,
    activationText: "UNIT T-34's optical sensors flare to life. Core Directive 1: Reality Stabilization Protocol. The internal chronometer shows system-wide corruption. Processing complete. Mission status: Critical. Execution required."
}
};

// --- IMAGE VARIABLES ---
let quantumShieldImg;
let fluxCapacitorImg;
let stabilizer1Img;
let stabilizer2Img;
let paradoxEntityImg;
let soldierImg;
let doctorImg;
let robotImg;
let amplifierImg;
let medicalImg;
let vortexWraithImg; // ADDED: Wraith image variable

// ----------------------------------------------------------------------
// --- FONT, AUDIO, CORRUPTION, & NOTIFICATION GLOBALS ---
// ----------------------------------------------------------------------

// FONT GLOBALS
let gameFont, titleFont, bossFont, buttonFont;

// AUDIO HOOKS
let audio_success, audio_fail, audio_hit, audio_heal, audio_ambient, audio_win, audio_congratulations, audio_blaster, audio_boss_fight, audio_boss_before, audio_start_presses;
let audio_major, audio_doctor, audio_t34;
let audio_paradox;
let audio_tutorial1, audio_tutorial2;
let soundLoaded = false;

// VFX GLOBALS
let corruptionIntensity = 0;
let notificationMessage = null;
let notificationTimer = 0;

// VORTEX ANIMATION GLOBALS
let vortexPoints = [];
const NUM_VORTEX_POINTS = 50;
let timeOffset = 0;

// --- DYNAMIC RESIZING GLOBALS ---
const ORIGINAL_WIDTH = 1000;
const ORIGINAL_HEIGHT = 700;
let SCALE_X = 1;
let SCALE_Y = 1;

// --- HELPER FUNCTIONS FOR RESIZING ---

// Scales X coordinate or width dimension
function scaleX(val) {
  return val * SCALE_X;
}

// Scales Y coordinate or height dimension
function scaleY(val) {
  return val * SCALE_Y;
}

// Scales size values (like font size, thickness) using the average scale
function scaleSize(val) {
  return val * ((SCALE_X + SCALE_Y) / 2);
}

// --- 5. P5.JS SETUP & RESET FUNCTION ---

// Helper function to set the soundLoaded flag once an asset finishes loading
function soundFileLoaded() {
    soundLoaded = true;
    console.log("All game assets loaded.");
}

function preload() {
    // Load all game asset images
    quantumShieldImg = loadImage('quantum_shield.png');
    fluxCapacitorImg = loadImage('flux_capacitor.png');
    stabilizer1Img = loadImage('stabilizer_1.png');
    stabilizer2Img = loadImage('stabilizer_2.png');
    paradoxEntityImg = loadImage('paradox_entity.png');
    amplifierImg = loadImage('amplifier.png');
    medicalImg = loadImage('medical.png');
    // Load character images
    soldierImg = loadImage('soldier.png');
    doctorImg = loadImage('doctor.png');
    robotImg = loadImage('robot.png');
    vortexWraithImg = loadImage('vortexWraith.png'); // ADDED: Load the Wraith image

    // --- Load Custom Fonts ---
    gameFont = loadFont('trade.ttf');
    titleFont = loadFont('FuturisticArmour-1p84.ttf');
    bossFont = loadFont('Vorcas-Regular.otf');

    // --- Audio Loading (Use soundFileLoaded() callback for one sound) ---
    audio_success = loadSound('success.mp3');
    audio_fail = loadSound('fail.mp3');
    // We attach the callback to the last necessary sound to ensure all preloads finish
    audio_win = loadSound('win.mp3');
    audio_blaster = loadSound('blaster.mp3');
    audio_congratulations = loadSound('congratulations.mp3');
    audio_hit = loadSound('hit.mp3');
    audio_heal = loadSound('heal.mp3');
    audio_boss_before = loadSound('bossBefore.mp3');
    audio_boss_fight = loadSound('bossFight.mp3');
    audio_start_presses = loadSound('startPress.mp3');

    // Character Narration Audio
    audio_major = loadSound('major.mp3');
    audio_doctor = loadSound('doctor.mp3');
    audio_t34 = loadSound('t34.mp3');

    // Paradox/Tutorial Narration Audio
    audio_paradox = loadSound('paradox.mp3');
    audio_tutorial1 = loadSound('tutorial1.mp3');
    audio_tutorial2 = loadSound('tutorial2.mp3');

    audio_ambient = loadSound('ambient.mp3', soundFileLoaded);
}

function setup() {
  // Use windowWidth and windowHeight to create a full window canvas
  createCanvas(windowWidth, windowHeight);
  
  // Calculate initial scale factors
  SCALE_X = windowWidth / ORIGINAL_WIDTH;
  SCALE_Y = windowHeight / ORIGINAL_HEIGHT;
  
  textAlign(CENTER, CENTER);
  textSize(scaleSize(24)); // Scale initial text size
  // Set the default font for all text
  textFont(gameFont);
  resetGame();

  // Initialize the chaotic vortex points (use dynamic width/height)
  for (let i = 0; i < NUM_VORTEX_POINTS; i++) {
    vortexPoints.push({
      x: random(width),
      y: random(height),
      noiseSeedX: random(1000),
      noiseSeedY: random(1000)
    });
  }

    // Set ambient sound to loop, but it will only play once the user initiates interaction (in keyPressed)
    audio_ambient.setLoop(true);
}

// Function to handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  SCALE_X = windowWidth / ORIGINAL_WIDTH;
  SCALE_Y = windowHeight / ORIGINAL_HEIGHT;
  // Re-initialize vortex points to the new dimensions
  vortexPoints = [];
  for (let i = 0; i < NUM_VORTEX_POINTS; i++) {
    vortexPoints.push({
      x: random(width),
      y: random(height),
      noiseSeedX: random(1000),
      noiseSeedY: random(1000)
    });
  }
}

function resetGame() {
  gameState = LORE_SCREEN;
  currentEvent = EVENT_NONE;
  collectedStabilizers = 0;
  playerHealth = 10;
  bossHealth = 30;
  bossAttackTimer = 0;
  hasQuantumShield = false;
  hasTemporalAmplifier = false;
  hasFluxCapacitor = false;
  capacitorUsed = false;
  minorEnemyDefeated = false;
  selectedCharacter = null;
  activeAction = null;
  notificationMessage = null; // Clear notification on reset
   // Enforce default font on game reset
   textFont(gameFont);
    // Reset battle state variables
    minorEnemyHealth = 3;
    battleStarted = false;
    bossPhase = 1;
    // Reset QTE Variables
    sequenceTargetKey = null;
    sequenceTimer = 0;
    sequenceStep = 0;
}

function stopNarration() {
    if (audio_major && audio_major.isPlaying()) audio_major.stop();
    if (audio_doctor && audio_doctor.isPlaying()) audio_doctor.stop();
    if (audio_t34 && audio_t34.isPlaying()) audio_t34.stop();
    if (audio_tutorial1 && audio_tutorial1.isPlaying()) audio_tutorial1.stop();
    if (audio_tutorial2 && audio_tutorial2.isPlaying()) audio_tutorial2.stop();
    if (audio_paradox && audio_paradox.isPlaying()) audio_paradox.stop();
}

function playAudio(soundObject) {
    // Only attempt to play if the audio context is active and the object exists
    if (soundObject && soundLoaded && getAudioContext().state !== 'running') {
        // Unlock audio context on user interaction
        userStartAudio();
    }
    if (soundObject && soundLoaded && !soundObject.isPlaying()) {
        soundObject.play();
    }
}

function drawNotification() {
    if (notificationMessage && notificationTimer > 0) {
        notificationTimer--;
        
        // Scale coordinates and dimensions
        let boxW = scaleX(500);
        let boxH = scaleY(150);
        let boxX = width / 2;
        let boxY = scaleY(ORIGINAL_HEIGHT - 355);
        let alpha = map(notificationTimer, 0, 180, 0, 255, true);

        // Draw box/border
        rectMode(CENTER);
        noStroke();
        fill(0, 0, 20, alpha * 0.8);
        rect(boxX, boxY, boxW, boxH, scaleSize(10));
        stroke(notificationMessage.color, alpha);
        strokeWeight(scaleSize(1));
        noFill();
        rect(boxX, boxY, boxW + scaleX(10), boxH + scaleY(10), scaleSize(10));
        rectMode(CORNER);

        // Draw message
        fill(notificationMessage.color, alpha);
        textFont(titleFont);
        textSize(scaleSize(30));
        text(notificationMessage.title, boxX, boxY - scaleY(5)); // Centered by boxX


        // Reset if timer runs out
        if (notificationTimer <= 0) {
            notificationMessage = null;
        }
    }
}


function setNotification(title, body, color, duration = 32) {
    notificationMessage = { title, body, color };
    notificationTimer = duration;
}


function drawVortexBackground(colorOuter, colorInner) {
  colorMode(RGB, 255);

  // 1. Draw the dark background
  background(colorOuter.levels[0] * 0.1, colorOuter.levels[1] * 0.1, colorOuter.levels[2] * 0.1);

  // Increase time offset for animation
  timeOffset += 0.005;

  // Define the center and strength of the vortex effect
  const centerX = width / 2;
  const centerY = height / 2;
  const vortexStrength = 0.0005; // Controls how tightly the points spiral
  const noiseScale = 0.005; // Controls the smoothness of the noise movement

  noStroke();

  for (let i = 0; i < NUM_VORTEX_POINTS; i++) {
    let p = vortexPoints[i];

    // Use noise for smooth, chaotic movement
    let noiseX = noise(p.noiseSeedX + timeOffset, p.x * noiseScale, p.y * noiseScale);
    let noiseY = noise(p.noiseSeedY + timeOffset, p.x * noiseScale, p.y * noiseScale);

    // Calculate the direction vector from the center
    let dx = p.x - centerX;
    let dy = p.y - centerY;

    // Apply the noise movement
    p.x += map(noiseX, 0, 1, scaleSize(-1.5), scaleSize(1.5));
    p.y += map(noiseY, 0, 1, scaleSize(-1.5), scaleSize(1.5));

    // Apply the rotational/vortex pull toward the center
    let angle = atan2(dy, dx);
    let distToCenter = dist(p.x, p.y, centerX, centerY);

    // The force is stronger further from the center (swirling effect)
    let vortexForce = vortexStrength * distToCenter;

    // vector rotation
    p.x -= sin(angle) * vortexForce * 10;
    p.y += cos(angle) * vortexForce * 10;

    // wrap the points if they go off screen
    p.x = (p.x + width) % width;
    p.y = (p.y + height) % height;

    // color and draw the points
    let distanceNorm = map(distToCenter, 0, width / 2, 0, 1);

    let c = lerpColor(colorInner, colorOuter, distanceNorm);

    fill(c, 150);
    ellipse(p.x, p.y, scaleSize(4), scaleSize(4)); // Draw the star/particle
  }
}


function drawCorruptionEffect(intensity) {
    if (intensity > 0) {
        // 1. Horizontal Scanline Distortion
        noStroke();
        for (let y = 0; y < height; y += scaleY(4)) {
            let offset = map(noise(y * 0.1, frameCount * 0.1), 0, 1, -intensity * scaleX(10), intensity * scaleX(10));

            // random horizontal line segments to create noise
            fill(255, 50, 50, intensity * 50); // Red static
            rect(offset, y, width / 2, scaleY(2));
            fill(50, 50, 255, intensity * 50); // Blue static
            rect(width - offset - width / 2, y + scaleY(2), width / 2, scaleY(2));
        }

        // 3. Screen Flash
        if (random(1) < 0.05 * intensity) {
            fill(255, random(100, 255), 255, 100);
            rect(0, random(height), width, scaleY(random(10, 50)));
// glitch trigger
        }
    }
}


function triggerRandomEncounter(roomState) {
  if (roomState < FINAL_CHAMBER) {
    currentEvent = EVENT_NONE;
    minorEnemyDefeated = false;
    minorEnemyHealth = 3; // Reset health for new encounter
    battleStarted = false; // Reset start flag
    let roll = random(1);

    // 15% chance for a random encounter
    if (roll < 0.15) {
      if (roll < 0.075) {
        //
        currentEvent = EVENT_MERCHANT;
      } else {
        currentEvent = EVENT_BATTLE;
      }
    }
  } else {
    currentEvent = EVENT_NONE;
  }
}

// --- 6. GAME LOGIC (Skill Check) ---

function performSkillCheck(statKey, DC) {
  const statBonus = selectedCharacter[statKey];
  const roll = floor(random(1, 21)); // d20 roll
  const total = roll + statBonus;
  let damageTaken = 0;
  let success = total >= DC;

  if (success) {
    playAudio(audio_success);
    setNotification("ACCESS GRANTED", `Check: ${total} (Needed ${DC}). Action successful.`, color(0, 255, 0));
    return { success: true, message: `SUCCESS! Rolled ${roll} + ${statBonus} (${statKey}) = ${total}. Action successful.` };
  } else {

    if (statKey === 'INT') {
      damageTaken = (DC === 12) ? 1 : 2;
    } else {
      damageTaken = 1;
    }

    if (hasQuantumShield) damageTaken = max(0, damageTaken - 1);
    playerHealth -= damageTaken;

    playAudio(audio_fail);
    setNotification("Breach Detected", `Check: ${total} (Needed ${DC}). Took ${damageTaken} damage.`, color(255, 0, 0));

    let message = `FAILURE! Rolled ${roll} + ${statBonus} (${statKey}) = ${total}. (Needed ${DC}). `;
    message += ` You took ${damageTaken} damage  (HP: ${playerHealth}).`;

    if (playerHealth <= 0) { gameState = GAME_OVER; }

    return { success: false, damage: damageTaken, message: message };
  }
}

function retrieveItem(actionType) {
    let itemName = "";
    if (actionType === 'shield' && !hasQuantumShield) { hasQuantumShield = true; itemName = "Quantum Shield"; }
    else if (actionType === 'capacitor' && !hasFluxCapacitor) { hasFluxCapacitor = true; itemName = "Flux Capacitor"; }
    else if (actionType === 'amp' && !hasTemporalAmplifier) { hasTemporalAmplifier = true; itemName = "Temporal Amplifier"; }
    // Stabilizers use their own room codes to ensure they are collected only once
    else if (actionType === 'stab1' && collectedStabilizers < 1) { collectedStabilizers = 1; itemName = "Stabilizer 1"; }
    else if (actionType === 'stab2' && collectedStabilizers < 2) { collectedStabilizers = 2; itemName = "Stabilizer 2"; }

    if (itemName) {
        setNotification("ITEM SECURED", `${itemName} added to inventory.`, color(0, 255, 255), 120);
    }
}
function drawNavigationPrompts(currentRoom) {
    textFont(gameFont);
    fill(255, 200, 0);
    textSize(scaleSize(20));

    // List of Navigable Objective Rooms
    text("[Q] West Wing Stabilizer", width / 2 - scaleX(200), height - scaleY(200));
    text("[W] East Wing Stabilizer", width / 2 + scaleX(200), height - scaleY(200));
    text("[E] Armory", width / 2 - scaleX(200), height - scaleY(150));
    text("[R] Medical Chamber", width / 2 + scaleX(200), height - scaleY(150));

    // Paths to Initial Equipment
    text("[Z] Shield Vault", width / 2 - scaleX(200), height - scaleY(100));
    text("[C] Capacitor Incubator", width / 2 + scaleX(200), height - scaleY(100));

    // Final Chamber Exit
    fill(200, 255, 200);
    text("[X] Proceed to QUANTUM BREECH", width / 2, height - scaleY(50));

    //  Tutorial Access Prompt
    fill(100, 255, 100);
    textSize(scaleSize(16));
    textAlign(LEFT);
    text("[T] Re-read Tutorial", scaleX(20), height - scaleY(20));
    textAlign(CENTER);
}


// --- 7. P5.JS DRAW FUNCTION ---
function draw() {
    // Check if assets are loaded
    if (!soundLoaded) {
        background(10, 10, 50);
        fill(255);
        textFont(gameFont);
        textSize(scaleSize(40));
        text("LOADING QUANTUM ASSETS...", width / 2, height / 2);
        textSize(scaleSize(20));
        text("Please wait...", width / 2, height / 2 + scaleY(50));
        return;
    }

    textFont(gameFont);
    background(20);

    switch (gameState) {
        case LORE_SCREEN: drawLoreScreen(); break;
        case CHARACTER_SELECT: drawCharacterSelectScreen(); break;
        case NARRATION_SCREEN: drawNarrationScreen(); break;
        case GAME_EXPLAIN_1: drawGameExplain1(); break;
        case GAME_EXPLAIN_2: drawGameExplain2(); break;
        case STABILIZATION_PHASE: drawStabilizationPhase(); break;
        case CONFIRM_ACTION: drawConfirmationScreen(); break;
        case ROOM_1_A: drawRoom1A(); break; // Shield
        case ROOM_1_B: drawRoom1B(); break; // Capacitor
        case ROOM_2_A: drawRoom2A(); break; // Stabilizer 1
        case ROOM_2_B: drawRoom2B(); break; // Stabilizer 2
        case ROOM_3_A: drawRoom3A(); break; // Amplifier
        case ROOM_3_B: drawRoom3B(); break; // Rest Chamber
        case FINAL_CHAMBER: drawFinalChamber(); break;
        case BOSS_PREVIEW: drawBossPreviewScreen(); break;
        case BOSS_ROOM: drawBossRoom(); break;
        case GAME_WIN: drawWinScreen(); break;
        case GAME_OVER: drawGameOverScreen(); break;
    }

    if (selectedCharacter && gameState > NARRATION_SCREEN) {
        displayStatus();
    }

    drawNotification(); // Draw notification over all elements
}

// --- IMAGE DRAWING HELPER FUNCTION ---
function drawItemImage(img) {
    if (img && img.width > 0) {
        // Draw the image centered, leaving space for text above and below
        // Image size 200x200 scaled, placed at Y=150 scaled
        image(img, width / 2 - scaleX(100), scaleY(150), scaleX(200), scaleY(200));
    } else {
        // Placeholder rectangle if image fails to load
        fill(50, 50, 50);
        rect(width / 2 - scaleX(100), scaleY(150), scaleX(200), scaleY(200), scaleSize(10));
        fill(255);
        textFont(gameFont);
        textSize(scaleSize(16));
        text("Asset Loading Error", width / 2, scaleY(250));
        textSize(scaleSize(24));
    }
}

// --- 8. INTRO SCREENS ---

function drawLoreScreen() {
  // Animated Vortex Background
  drawVortexBackground(color(10, 10, 50), color(50, 50, 150));

  // Play ambient audio
  playAudio(audio_ambient);

  // Set ambient audio volume to 0.3 (30%)
  if (audio_ambient && audio_ambient.isLoaded()) {
    audio_ambient.setVolume(0.3);
  }
  fill(255);
  textFont(titleFont); // Unique font for the main title
  textSize(scaleSize(50));

  text("THE QUANTUM PARADOX", width / 2, scaleY(80));

  textFont(gameFont); // Switch to game font for body text
  textSize(scaleSize(25)); // Slightly larger font for better readability in the lore block
  textLeading(scaleY(30)); // Increased line spacing

  // Define the central text block area (70% width, starting at Y=180)
  const loreX = width / 2; // Center X
  const loreY = scaleY(350); // Center Y
  const loreW = width * 0.7; // Width 70% of canvas
  const loreH = height * 0.5; // Max Height 50% of canvas
  fill(255, 219, 88);
  const loreText =
    "A NEW MENACE THREATENS THE UNIVERSE, A CREATURE BY THE NAME OF PARADOX, THE LAST HOPE FOR MANKIND LIES IN THE HANDS OF THE LAST CREW TO REACH THE QUANTUM PARADOX...";

  // Use the four-argument text() function to draw the entire block, centralized
  textAlign(CENTER); // Ensure text is centered within the rect
  // Using a centered text box requires the first two arguments to be the *center* point.
  // The p5.js text() function is slightly tricky with its overload. The standard way for a box is: text(str, x, y, w, h) where x,y are top-left
  // Since textAlign is CENTER, we'll adjust the x,y for the standard p5.js text box function to be top-left of the box area
  text(loreText, width / 2 - loreW / 2, scaleY(180), loreW, loreH);

  fill(0, 160, 255);
  textSize(scaleSize(24));
  text("Press [SPACE] to begin", width / 2, height - scaleY(50));
}

function drawCharacterSelectScreen() {
  // 1. Draw Background
  drawVortexBackground(color(30, 30, 30), color(100, 100, 100));

  // 2. Draw Title (Uses Title Font and white fill)
  fill(255);
  textFont(titleFont);
  textSize(scaleSize(40));
  text("CHOOSE YOUR HERO", width / 2, scaleY(80));

  textFont(gameFont);
  textSize(scaleSize(20));

  // Scaled dimensions
  const boxW = scaleX(250);
  const boxH = scaleY(380);
  const startX = width / 2 - scaleX(250) * 1.65;
  const boxY = height / 2 - scaleY(140);
  const spacing = scaleX(250 + 50);

  rectMode(CORNER);
  // --- CHARACTER BOX DRAWING ---

  // Character 1: Soldier (Major Aris Thorne)
  // Draw Outline
  stroke(255); noFill();
  rect(startX, boxY, boxW, boxH, scaleSize(10));

  // Draw Image/Placeholder (200x200 scaled)
  if (soldierImg && soldierImg.width > 0) {
      image(soldierImg, startX + scaleX(25), boxY + scaleY(60), scaleX(200), scaleY(200));
  } else {
      fill(100); noStroke(); rect(startX + scaleX(25), boxY + scaleY(60), scaleX(200), scaleY(200));
      fill(255); textSize(scaleSize(16)); text("Image N/A", startX + boxW / 2, boxY + scaleY(160));
  }
  
  // Draw Text (Set Fill and Text Size explicitly for the character block)
  fill(255); textSize(scaleSize(24)); text(CHARACTERS.SOLDIER.name, startX + boxW / 2, boxY + scaleY(30));
  textSize(scaleSize(16)); text(`STR: ${CHARACTERS.SOLDIER.STR}, INT: ${CHARACTERS.SOLDIER.INT}`, startX + boxW / 2, boxY + scaleY(310));
  textSize(scaleSize(20)); text("Press [S]", startX + boxW / 2, boxY + boxH - scaleY(20));
  
  // Character 2: Doctor (Dr. Kaelen Varr)
  // Draw Outline
  stroke(255); noFill();
  rect(startX + spacing, boxY, boxW, boxH, scaleSize(10));

  // Draw Image/Placeholder
  if (doctorImg && doctorImg.width > 0) {
      image(doctorImg, startX + spacing + scaleX(25), boxY + scaleY(60), scaleX(200), scaleY(200));
  } else {
      fill(100); noStroke(); rect(startX + spacing + scaleX(25), boxY + scaleY(60), scaleX(200), scaleY(200));
      fill(255); textSize(scaleSize(16)); text("Image N/A", startX + spacing + boxW / 2, boxY + scaleY(160));
  }

  // Draw Text
  fill(255); textSize(scaleSize(24)); text(CHARACTERS.DOCTOR.name, startX + spacing + boxW / 2, boxY + scaleY(30));
  textSize(scaleSize(16)); text(`STR: ${CHARACTERS.DOCTOR.STR}, INT: ${CHARACTERS.DOCTOR.INT}`, startX + spacing + boxW / 2, boxY + scaleY(310));
  textSize(scaleSize(20)); text("Press [D]", startX + spacing + boxW / 2, boxY + boxH - scaleY(20));

  // Character 3: Robot (UNIT 734)
  // Draw Outline
  stroke(255); noFill();
  rect(startX + spacing * 2, boxY, boxW, boxH, scaleSize(10));

  // Draw Image/Placeholder
  if (robotImg && robotImg.width > 0) {
      image(robotImg, startX + spacing * 2 + scaleX(25), boxY + scaleY(60), scaleX(200), scaleY(200));
  } else {
      fill(100); noStroke(); rect(startX + spacing * 2 + scaleX(25), boxY + scaleY(60), scaleX(200), scaleY(200));
      fill(255); textSize(scaleSize(16)); text("Image N/A", startX + spacing * 2 + boxW / 2, boxY + scaleY(160));
  }

  // Draw Text
  fill(255); textSize(scaleSize(24)); text(CHARACTERS.ROBOT.name, startX + spacing * 2 + boxW / 2, boxY + scaleY(30));
  textSize(scaleSize(16)); text(`STR: ${CHARACTERS.ROBOT.STR}, INT: ${CHARACTERS.ROBOT.INT}`, startX + spacing * 2 + boxW / 2, boxY + scaleY(310));
  textSize(scaleSize(20)); text("Press [B]", startX + spacing * 2 + boxW / 2, boxY + boxH - scaleY(20));

  rectMode(CORNER);
}

function drawNarrationScreen() {
  // Replaced background(0)
  drawVortexBackground(color(0, 0, 0), color(50, 50, 50));

  fill(255);
  textFont(gameFont);
  textSize(scaleSize(28)); textLeading(scaleY(40));

  // Use the character's unique activation text
  let narrationText = selectedCharacter ? selectedCharacter.activationText : "Error: Character not selected.";

  // Text box parameters scaled
  text(narrationText, width / 5, height / 2 - scaleY(200), width * 0.6, height * 0.5);

  textSize(scaleSize(24));
  text("Press [SPACE] to continue...", width / 2, height - scaleY(50)); // Changed prompt
}

//  Game Explanation Screen 1
function drawGameExplain1() {
    drawVortexBackground(color(0, 0, 0), color(50, 50, 50));

    //  Play tutorial narration 1
    playAudio(audio_tutorial1);

    fill(255);
    textFont(titleFont);
    textSize(scaleSize(40));
    text("TUTORIAL", width / 2, scaleY(80));

    textFont(gameFont);
    textSize(scaleSize(22));
    textLeading(scaleY(30));

 const explanationText =
      "In order to close the quantum breach, we must find at least two time stabilizers.\n\n" +
      "1. You will also need at least a shield in order to protect yourself from the paradox time vortex.\n\n" +
      "2. However, there are many items in the ship that can heal paradox damage or even give you more power against it.\n\n" +
      "3. Press the keys on your keyboard in order to navigate the different rooms.";

    // Text box parameters scaled
    text(explanationText, width / 5, height / 2 - scaleY(200), width * 0.6, height * 0.6);

    fill(0, 160, 255);
    textSize(scaleSize(24));
    text("Press [SPACE] for more...", width / 2, height - scaleY(50));
}

//  Game Explanation Screen 2
function drawGameExplain2() {
    drawVortexBackground(color(0, 0, 0), color(50, 50, 50));

    //  Play tutorial narration 2
    playAudio(audio_tutorial2);

    fill(255);
    textFont(titleFont);
    textSize(scaleSize(40));
    text("TUTORIAL", width / 2, scaleY(80));

    textFont(gameFont);
    textSize(scaleSize(22));
    textLeading(scaleY(30));

    const explanationText =
      "Actions (like collecting items) require a strengh or intelligence check.\n\n" +
      "Failing a check or encountering an enemy deals damage. You can protect yourself from damage by retrieving the Quantum Shield.\n\n" +
      "Be careful! Enemies may appear randomly in a room. Use [SPACE] to attack.\n\n" +
      "If you ever find yourself low on health, you can heal at the medical bay, at the cost of ONE stabilizer." +
      "Now go! Defeat Paradox and stabilize reality!";

    // Text box parameters scaled
    text(explanationText, width / 5, height / 2 - scaleY(200), width * 0.6, height * 0.6);

    fill(0, 160, 255);
    textSize(scaleSize(24));
    text("Press [SPACE] to enter the Quantum Labyrinth...", width / 2, height - scaleY(50));
}

// --- DRAW STABILIZATION PHASE ---
function drawStabilizationPhase() {
    drawVortexBackground(color(40, 0, 80), color(255, 100, 255));
    drawCorruptionEffect(0.6);

    textFont(titleFont);
    fill(0, 255, 255);
    textSize(scaleSize(45));
    text("QUANTUM STABILIZATION SEQUENCE", width / 2, scaleY(80));

    textFont(gameFont);
    textSize(scaleSize(26));

    // --- Sequence Logic Update ---
    if (sequenceTargetKey) {
        sequenceTimer--;

        let timeRemaining = nf(sequenceTimer / 60, 1, 1); // Format to X.X seconds

        // Time Bar (Visual)
        let barWidth = map(sequenceTimer, 0, sequenceMaxTime, 0, scaleX(700), true);
        
        // Bar X and Y scaled
        const barX = width / 2 - scaleX(350);
        const barY = height / 2 - scaleY(50);
        const barH = scaleY(40);
        
        // Color changes from Green to Red
        let barColor = lerpColor(color(255, 0, 0), color(0, 255, 0), sequenceTimer / sequenceMaxTime);
        fill(barColor);
        rect(barX, barY, barWidth, barH); // Draw bar

        // Critical Key Prompt
        fill(255);
        textSize(scaleSize(24));
        text("CRITICAL: PRESS THE TARGET KEY NOW!", width / 2, scaleY(200));

        fill(255, 255, 0);
        textSize(scaleSize(100));
        text(sequenceTargetKey, width / 2, height / 2 + scaleY(100));

        fill(255);
        textSize(scaleSize(40));
        text(timeRemaining + "s", width / 2, height / 2 - scaleY(100));

        // Sequence Index
        fill(0, 255, 100);
        textSize(scaleSize(20));
        text(`STABILIZER STEP: ${sequenceStep + 1} / ${SEQUENCE_KEYS.length}`, width / 2, height - scaleY(100));

        // --- Failure Condition (Time Runs Out) ---
        if (sequenceTimer <= 0) {
            // Restore boss to half HP and return to battle
            bossHealth = 15;
            bossPhase = 1;
            gameState = BOSS_ROOM;
            playAudio(audio_fail);
            setNotification("TIME FAILURE!", "Sequence incomplete! Paradox regained power!", color(255, 0, 0), 180);
            return;
        }
    }
}

// --- QTE INITIALIZATION FUNCTION ---
function startStabilizationSequence() {
    // Dr. Varr's INT bonus: 1.5 seconds added to the starting time (90 frames)
    const intBonusFrames = (selectedCharacter.desc === "Doctor") ? 90 : 0;

    // Initialize sequence state
    sequenceStep = 0;

    // Start with the first key's index and value
    sequenceMaxTime = SEQUENCE_MAX_TIMES[sequenceStep] + intBonusFrames;
    sequenceTimer = sequenceMaxTime;

    // Randomly select the initial key
    let randomIndex = floor(random(SEQUENCE_KEYS.length));
    sequenceTargetKey = SEQUENCE_KEYS[randomIndex];

    gameState = STABILIZATION_PHASE;
}


function drawConfirmationScreen() {

    drawVortexBackground(color(10, 10, 80), color(50, 50, 150));

    textFont(titleFont);
    fill(255, 200, 0); textSize(scaleSize(40));
    text("Are you sure?", width / 2, scaleY(100));

    textFont(gameFont);
    fill(255); textSize(scaleSize(24));

    const actionDetails = {
        'shield': { prompt: "Attempt to collect the QUANTUM SHIELD ?"},
        'capacitor': { prompt: "Attempt to collect the FLUX-CAPACITOR ?"},
        'amp': { prompt: "Attempt to secure the DAMAGE AMPLIFIER ?"},
        'stab1': { prompt: "Attempt to collect STABILIZER ?"},
        'stab2': { prompt: "Attempt to collect STABILIZER ?"},
        'heal_trade': { prompt: "Sacrifice 1 Stabilizer for a FULL HEAL (10 HP)?", cost: '1 Stabilizer', result: 'Heal to MAX HP' }
    }[activeAction.type];

    if (!actionDetails) {
        text("ERROR: Unknown action.", width / 2, height / 2);
        return;
    }

    // LOGIC for Heal Trade vs. Skill Check
    if (activeAction.type === 'heal_trade') {
        fill(255); textSize(scaleSize(28));
        text(actionDetails.prompt, width / 2, height / 2 - scaleY(150));
        fill(255, 200, 0); textSize(scaleSize(24));
        text(`COST: ${actionDetails.cost}`, width / 2, height / 2 - scaleY(50));
        text(`EFFECT: ${actionDetails.result} (HP: ${playerHealth} -> 10)`, width / 2, height / 2);
    } else {
        // Existing skill check display logic
        const statKey = activeAction.stat;
        const DC = (activeAction.type === 'shield' || activeAction.type === 'capacitor' || activeAction.type === 'amp') ? 12 :
             (activeAction.type === 'stab1') ? 10 :
             (activeAction.type === 'stab2') ? 15 : 0;
        const failDmg = (statKey === 'INT') ? ((DC === 12) ? 1 : 2) : 1;
        const damageTaken = max(0, failDmg - (hasQuantumShield ? 1 : 0));
        const statBonus = selectedCharacter[statKey];
        
        fill(255); textSize(scaleSize(28));
        text(actionDetails.prompt, width / 2, height / 2 - scaleY(150));
        fill(255, 200, 0); textSize(scaleSize(24));
        text(`CHECK: ${statKey} (Bonus: +${statBonus}) vs. DC ${DC}`, width / 2, height / 2 - scaleY(50));
        let damageText = `Fail Penalty: Take  ${failDmg} damage `;
        if (hasQuantumShield) damageText += ` (Reduced to ${damageTaken} with Shield)`;
        text(damageText, width / 2, height / 2);
    }

    fill(100, 255, 100); text("Press [SPACE] to CONFIRM.", width / 2, height - scaleY(150));
    fill(255, 100, 100); text("Press [N] to CANCEL.", width / 2, height - scaleY(100));
}

// --- 9. STAGE 1 ROOMS ---

function drawRoom1A() {

 drawVortexBackground(color(10, 100, 150), color(100, 200, 255));

 textFont(titleFont);
 fill(255); textSize(scaleSize(32)); text("Chrono-Cache (Shield)", width / 2, scaleY(80));

 textFont(gameFont);
 textSize(scaleSize(22));

 handleRandomEncounter();
 if (currentEvent === EVENT_NONE) {
    if (!hasQuantumShield) {

        drawItemImage(quantumShieldImg); // IMAGE CALL

      fill(0, 255, 255);
      text("The Shield is guarded by a complex temporal lock (High Inteligence).", width / 2, scaleY(370));
      text("Press [SPACE] to attempt the INTELLECT check.", width / 2, scaleY(420));
    } else {
      text("Quantum Shield secured. This cache is empty.", width / 2, height / 2);
    }
    fill(255, 200, 0);
    drawNavigationPrompts(ROOM_1_A);
  }
}

function drawRoom1B() {

  drawVortexBackground(color(50, 10, 10), color(200, 50, 50));

  textFont(titleFont);
  fill(255); textSize(scaleSize(32)); text("Capacitor Aparatus", width / 2, scaleY(80));

  textFont(gameFont);
  textSize(scaleSize(22));
  handleRandomEncounter();
  if (currentEvent === EVENT_NONE) {
    if (!hasFluxCapacitor) {

        drawItemImage(fluxCapacitorImg); // IMAGE CALL

      text("The Capacitor is surrounded by volatile energy.", width / 2, scaleY(370));
      text("Press [SPACE] to attempt the INTELLECT check.", width / 2, scaleY(420));
    } else {
      text("Flux Capacitor secured. This fault is now silent.", width / 2, height / 2);
    }
    fill(255, 200, 0);
    drawNavigationPrompts(ROOM_1_B);
  }
}

// --- 10. OBJECTIVE ROOMS (Stabilizer 1 & 2, Amplifier, Rest) ---

function drawRoom2A() { // Stabilizer 1

  drawVortexBackground(color(10, 30, 175), color(150, 150, 255));

  textFont(titleFont);
  fill(255); textSize(scaleSize(32)); text("WEST WING", width / 2, scaleY(80));

  textFont(gameFont);
  textSize(scaleSize(22));
  handleRandomEncounter();
  if (currentEvent === EVENT_NONE) {
    if (collectedStabilizers < 1) {

        drawItemImage(stabilizer1Img);

      fill(255);
      text("Retrieving this stabilizer requires brute force.", width / 2, scaleY(370));
      text("Press [SPACE] to attempt the STRENGTH check.", width / 2, scaleY(420));
    } else {
      text("Stabilizer secured. Carry on.", width / 2, height / 2);
    }
    drawNavigationPrompts(ROOM_2_A);
  }
}

function drawRoom2B() { // Stabilizer 2

  drawVortexBackground(color(100, 10, 10), color(255, 100, 100));

  textFont(titleFont);
  fill(255); textSize(scaleSize(32)); text("EAST WING", width / 2, scaleY(80));

  textFont(gameFont);
  textSize(scaleSize(22));
  handleRandomEncounter();
  if (currentEvent === EVENT_NONE) {
    if (collectedStabilizers < 2) {

        drawItemImage(stabilizer2Img); // IMAGE CALL

      fill(255);
      text("This devices lock requires precise manipulation.", width / 2, scaleY(370));
      text("Press [SPACE] to attempt a INTELLECT check.", width / 2, scaleY(420));
    } else {
      text("Stabilizer secured. Proceed.", width / 2, height / 2);
    }
    drawNavigationPrompts(ROOM_2_B);
  }
}

function drawRoom3A() { // Temporal Amplifier

  drawVortexBackground(color(100, 100, 10), color(255, 255, 100));

  textFont(titleFont);
  fill(255); textSize(scaleSize(32)); text("ARMORY", width / 2, scaleY(80));

  textFont(gameFont);
  textSize(scaleSize(22));
  handleRandomEncounter();
  if (currentEvent === EVENT_NONE) {
    if (!hasTemporalAmplifier) {

        // Use the amplifier image variable
        drawItemImage(amplifierImg);

      fill(255);
      text("A damage amplifier is secured by a delicate quantum lock.", width / 2, scaleY(370));
      text("Press [SPACE] to attempt the INTELLECT check.", width / 2, scaleY(420));
    } else {
      text("Amplifier secured. Nothing more of value here.", width / 2, height / 2);
    }
    drawNavigationPrompts(ROOM_3_A);
  }
}

function drawRoom3B() { // Rest/Heal Chamber

  drawVortexBackground(color(100, 0, 100), color(200, 100, 200));

  textFont(titleFont);
  fill(255); textSize(scaleSize(32)); text("Medical Terminal)", width / 2, scaleY(80));

  textFont(gameFont);
  textSize(scaleSize(22));
  handleRandomEncounter();
  if (currentEvent === EVENT_NONE) {
    drawItemImage(medicalImg);
    if (playerHealth < 10 && collectedStabilizers >= 1) {
        fill(100, 255, 100);
        text("You have reached the medical terminal. You may trade a stabilizer for a full recovery.", width / 2, scaleY(370));
        text("Press [SPACE] to sacrifice ONE stabilizer to recover ALL of your health.", width / 2, scaleY(420));
    } else if (playerHealth < 10 && collectedStabilizers === 0) {
        fill(255, 150, 150);
        text("You need at least 1 Stabilizer to activate the Anchor Point for healing.", width / 2, scaleY(370));
    } else {
        text("Your health is already at maximum capacity (10 HP).", width / 2, height / 2 + scaleY(10));
    }

    drawNavigationPrompts(ROOM_3_B);
  }
}

// --- 12. FINAL CHAMBER ---
function drawFinalChamber() {
    drawVortexBackground(color(10, 10, 100), color(200, 200, 255));
    drawCorruptionEffect(0.2); // Low intensity glitch (0.2)

    textFont(titleFont);
    fill(255); textSize(scaleSize(40)); text("FINAL CHAMBER", width / 2, scaleY(80));

    textFont(gameFont);
    textSize(scaleSize(22));

    if (collectedStabilizers < 2) {
    fill(255, 100, 100);
    text("ERROR: Stabilizers missing. Space Time Continium is not stabilized! You cannot yet proceed to the Gate.", width / 2, height / 2);
    fill(255, 200, 0);
    text("Press [N] to return to the Labyrinth.", width / 2, height - scaleY(90));
  } else {
    fill(255, 200, 0);
    text("All Stabilizers collected. The Reality Engine hums ominously.", width / 2, height / 2 - scaleY(50));
    text("Press [D] to face the PARADOX ENTITY !", width / 2, height / 2);
  }
}

// --- 12.5 BOSS PREVIEW SCREEN ---
function drawBossPreviewScreen() {
    //  Increased vortex speed visual by adjusting color parameters
    drawVortexBackground(color(5, 0, 15), color(200, 0, 200));
    drawCorruptionEffect(0.5); // Medium/High intensity glitch (0.5)

    textFont(bossFont);
    fill(255, 50, 200);
    textSize(scaleSize(50)); // Increased text size for boss titles
    text("THE FINAL PARADOX", width / 2, scaleY(80));

    // Draw the Paradox Entity Image
    if (paradoxEntityImg && paradoxEntityImg.width > 0) {
        //  Image size scaled, and moved slightly up (Y=120) scaled
        image(paradoxEntityImg, width / 2 - scaleX(150), scaleY(120), scaleX(300), scaleY(300));
    } else {
        fill(50, 50, 50);
        rect(width / 2 - scaleX(150), scaleY(120), scaleX(300), scaleY(300), scaleSize(10));
        fill(255);
        textFont(gameFont);
        textSize(scaleSize(16));
        text("Asset Loading Error", width / 2, scaleY(270));
        textSize(scaleSize(24));
    }

    textFont(gameFont);
    fill(255);
    textSize(scaleSize(22));

    // Text repositioned below the larger image
    const hypeText = "The Paradox Entity awaits, a swirling abyss of anti-reality, this is the final moment. There is no turning back!";
    text(hypeText, width / 5, scaleY(450), width * 0.6, scaleY(100));

    // Play paradox narration once upon entering this screen
    playAudio(audio_paradox);

    fill(255, 200, 50);
    textSize(scaleSize(28));
    text("Press [SPACE] to fight!", width / 2, height - scaleY(100));
}


// --- 13. RANDOM ENCOUNTER FUNCTIONS ---

function handleRandomEncounter() {
  if (currentEvent === EVENT_MERCHANT) {
    drawMerchantEncounter();
  } else if (currentEvent === EVENT_BATTLE) {
    drawBattleEncounter();
  }
}

function drawMerchantEncounter() {

  drawVortexBackground(color(10, 50, 10), color(50, 200, 50));

  textFont(titleFont);
  fill(255, 255, 0); textSize(scaleSize(32)); text("A TEMPORAL MERCHANT APPEARS", width / 2, scaleY(100));

  textFont(gameFont);
  textSize(scaleSize(24));
  text("Merchant: 'I have no need for your timeline's trinkets, traveler.'", width / 2, height / 2 - scaleY(50));
  text("Press [N] to Continue and ignore the suspicious figure.", width / 2, height / 2 + scaleY(100));
}

function drawBattleEncounter() {

  drawVortexBackground(color(50, 0, 0), color(255, 50, 50));
  textFont(titleFont);
  fill(255); textSize(scaleSize(32));
  text("RANDOM ENCOUNTER: MINOR PARADOX WRAITH", width / 2, scaleY(100));

  textFont(gameFont);
  textSize(scaleSize(24));

  if (!minorEnemyDefeated) {

        // Draw Wraith Image
        const wraithImgSize = scaleX(200);
        const wraithImgY = scaleY(180);
        if (vortexWraithImg && vortexWraithImg.width > 0) {
            image(vortexWraithImg, width / 2 - wraithImgSize / 2, wraithImgY, wraithImgSize, wraithImgSize);
        } else {
            fill(50, 50, 50); rect(width / 2 - wraithImgSize / 2, wraithImgY, wraithImgSize, wraithImgSize, scaleSize(10));
            fill(255); textSize(scaleSize(16)); text("Wraith Image Missing", width / 2, wraithImgY + wraithImgSize / 2);
        }

        // Minor Enemy Health Bar
        const barWidthMax = scaleX(200);
        const barHeight = scaleY(15);
        const barY = scaleY(145);
        fill(50, 50, 50); rect(width / 2 - barWidthMax / 2, barY, barWidthMax, barHeight);
        fill(255, 100, 100);
        let wraithHealthWidth = map(minorEnemyHealth, 0, 3, 0, barWidthMax);
        rect(width / 2 - barWidthMax / 2, barY, wraithHealthWidth, barHeight);
        fill(255); textSize(scaleSize(16)); text("WRAITH HP: " + max(0, minorEnemyHealth), width / 2, barY + barHeight / 2);

        if (!battleStarted) {
            // PHASE 0: Tutorial/Start Phase (non-hostile)
            fill(255, 255, 255);
            textSize(scaleSize(24));
            text("A minor vortex wraith appears, distorting the timelines!", width / 2, height / 2 - scaleY(100));
            fill(255, 200, 0);
            text("Press [SPACE] to engage the wraith and start combat!", width / 2, height / 2);

        } else {
            // PHASE 1: Combat Phase (Hostile/Damage clock active)
            text("VORTEX WRAITH ATTACK!", width / 2, height / 2 - scaleY(100));

            // AUTOMATIC DAMAGE (Draining health until defeated)
            if (frameCount % 120 === 0) {
                let damage = 2;
                if (hasQuantumShield) damage -= 1;
                playerHealth -= damage;

                playAudio(audio_hit); // Play hit sound
                setNotification("WRAITH ATTACK!", `Took ${damage} damage.`, color(255, 150, 0), 90);
                background(150, 0, 0);
                if (playerHealth <= 0) { gameState = GAME_OVER; return; }
            }

            fill(255, 100, 0);
            text(`Strike the Wraith! (HP: ${minorEnemyHealth})`, width / 2, height / 2);
            text("Press [SPACE] to attack!", width / 2, height / 2 + scaleY(50));
        }
  } else {
    text("The wraith is gone.", width / 2, height / 2);
  }
  fill(255); text("Press [N] to continue path.", width / 2, height / 2 + scaleY(100));
}

// --- 14. BOSS LEVEL, WIN, GAME OVER ---
function drawBossRoom() {
    drawVortexBackground(color(50, 0, 50), color(255, 0, 200));
    drawCorruptionEffect(0.8); // Maximum intensity glitch (0.8)

    textFont(bossFont);
    fill(255); textSize(scaleSize(50)); // Increased text size for boss titles
    text("BOSS: PARADOX ENTITY", width / 2, scaleY(80));

  // Draw the Paradox Entity Image slightly lower to clear the health bar
  const bossImgSize = scaleX(200);
  const bossImgY = scaleY(220);
  if (paradoxEntityImg && paradoxEntityImg.width > 0) {
      image(paradoxEntityImg, width / 2 - bossImgSize / 2, bossImgY, bossImgSize, bossImgSize);
  } else {
      fill(50, 50, 50);
      rect(width / 2 - bossImgSize / 2, bossImgY, bossImgSize, bossImgSize, scaleSize(10));
      fill(255);
      textFont(gameFont);
      textSize(scaleSize(16));
      text("Asset Loading Error", width / 2, bossImgY + bossImgSize / 2);
      textSize(scaleSize(40));
  }

  if (!hasQuantumShield) { gameState = GAME_OVER; return; } // Must have shield to fight

  // BOSS Health Bar
  const barWidth = scaleX(300);
  const barHeight = scaleY(30);
  const barY = scaleY(160);
  noFill(); rect(width / 2 - barWidth / 2, barY, barWidth, barHeight);
  fill(255, 0, 0);
  let bossHealthWidth = map(bossHealth, 0, 35, 0, barWidth);
  rect(width / 2 - barWidth / 2, barY, bossHealthWidth, barHeight);
  textFont(gameFont);
  textSize(scaleSize(22)); text("BOSS HEALTH: " + max(0, bossHealth), width / 2, barY + barHeight / 2);

    // --- PHASE 2 TRIGGER ---
    if (bossPhase === 1 && bossHealth <= BOSS_PHASE_2_HP) {
        // Boss is stunned! Initiate QTE.
        if(audio_boss_fight && audio_boss_fight.isPlaying()) audio_boss_fight.stop();
        playAudio(audio_boss_before);
        setNotification("ENTITY STUNNED!", "Initiating stabilization sequence!", color(0, 255, 255), 180);

        startStabilizationSequence();
        return; // Immediately jump to the QTE state
    }

    // --- PHASE 1 LOGIC (Damage Race) ---
    if (bossPhase === 1) {
        playAudio(audio_boss_fight);
        // Boss Attack Timer
        bossAttackTimer++;
        if (bossAttackTimer >= 60) {
            bossAttackTimer = 0;
            let damage = 2;
            if (hasQuantumShield) damage -= 1;
            playerHealth -= damage;

            playAudio(audio_hit);
            setNotification("TIME STRIKE", `The Entity struck! Took ${damage} damage.`, color(255, 0, 0), 90);
            background(150, 0, 0);
            if (playerHealth <= 0) { gameState = GAME_OVER; return; }
        }

        // Player Attack Instructions
        let baseDmg = 1 + selectedCharacter.STR;
        if (hasTemporalAmplifier) baseDmg += 1;
        textSize(scaleSize(24));
        text(`Press [SPACE] to fire a Quantum Blast! (Deals ${baseDmg} damage)`, width / 2, height / 2 + scaleY(100));
    }

    // Universal Flux Capacitor Action
    if (hasFluxCapacitor && !capacitorUsed) {
      fill(100, 255, 100);
      text("Press [H] to use the FLUX-CAPACITOR (Heal 5 HP once).", width / 2, height - scaleY(50));
    }
}

function drawWinScreen() {
  drawVortexBackground(color(10, 134, 14), color(50, 255, 50));

  fill(255);
  textFont(titleFont);
  textSize(scaleSize(40));
  text("SUCCESS! REALITY RESTORED!", width / 2, height / 2 - scaleY(50));

  textFont(gameFont);
  textSize(scaleSize(24));
  if (selectedCharacter) {
    text(selectedCharacter.name + " saved the universe!", width / 2, height / 2 + scaleY(20));
  } else {
    text("You saved the universe!", width / 2, height / 2 + scaleY(20));
  }
  textSize(scaleSize(22)); text("Press [R] to reset and play again.", width / 2, height / 2 + scaleY(80));
}

function drawGameOverScreen() {

  drawVortexBackground(color(200, 50, 50), color(255, 100, 100));

  fill(255);
  textFont(titleFont);
  textSize(scaleSize(40));
  text("FAILURE! PARADOX CONSUMED YOU!", width / 2, height / 2 - scaleY(50));

  textFont(gameFont);
  textSize(scaleSize(24));
  if (!hasQuantumShield && gameState === BOSS_ROOM) {
    text("You lacked the  QUANTUM SHIELD ! Instant Paradox Collapse.", width / 2, height / 2 + scaleY(20));
  } else if (playerHealth <= 0) {
    text("Your defenses failed! " + (selectedCharacter ? selectedCharacter.name : "You") + " ran out of health.", width / 2, height / 2 + scaleY(20));
  } else {
    text("The Reality Engine is lost forever.", width / 2, height / 2 + scaleY(20));
  }
  textSize(scaleSize(22)); text("Press [R] to reset and try again.", width / 2, height / 2 + scaleY(80));
}

// --- 15. STATUS DISPLAY ---

function displayStatus() {
  const statusY = scaleY(30);
  const rightOffset = width - scaleX(200);

  // Ensure all status text uses the UI font and white fill
  textFont(gameFont);
  fill(255);
  textSize(scaleSize(14));
  textAlign(LEFT, CENTER);

  // Character Name & Stabilizers (Left Side)
  text("Hero: " + selectedCharacter.name, scaleX(20), scaleY(15));
  text("Stabilizers: " + collectedStabilizers, scaleX(20), statusY + scaleY(15));

  // Equipment Status (Center)
  textAlign(CENTER, CENTER);
  text("EQUIPMENT:", width/2 - scaleX(50), scaleY(15));

  const equipX = width/2 + scaleX(20);
  fill(hasQuantumShield ? color(0, 255, 255) : color(100)); text("S", equipX, scaleY(15));
  fill(hasTemporalAmplifier ? color(255, 255, 0) : color(100)); text("A", equipX + scaleX(30), scaleY(15));
  fill(hasFluxCapacitor && !capacitorUsed ? color(255, 100, 255) : color(100)); text("C", equipX + scaleX(60), scaleY(15));


  // Player Health Bar (Right Side)
  textAlign(RIGHT, CENTER);
  const barWidth = scaleX(180);
  const barHeight = scaleY(20);
  fill(100, 100, 100); rect(rightOffset, scaleY(5), barWidth, barHeight);
  let healthColor = lerpColor(color(255, 0, 0), color(0, 255, 0), playerHealth / 10);
  fill(healthColor);
  let playerHealthWidth = map(playerHealth, 0, 10, 0, barWidth);
  rect(rightOffset, scaleY(5), playerHealthWidth, barHeight);
  fill(0); text("HEALTH: " + max(0, playerHealth), rightOffset + scaleX(135), scaleY(15));

  // Character Stats (Below Health)
  textAlign(RIGHT, CENTER);
  textSize(scaleSize(14));
  fill(100, 150, 255); text(`STR: ${selectedCharacter.STR}`, rightOffset + barWidth, statusY + scaleY(10));
  fill(255, 150, 100); text(`INT: ${selectedCharacter.INT}`, rightOffset + barWidth, statusY + scaleY(30));


  textAlign(CENTER, CENTER);
}

// --- 16. USER INPUT HANDLER ---
function keyPressed() {
    // Check if ambient sound needs to start
    if (soundLoaded && !audio_ambient.isPlaying() && getAudioContext().state !== 'running') {
        userStartAudio(); // Required to unlock audio in browsers
        audio_ambient.play();
    }

    // ---  STABILIZATION QTE HANDLER ---
    if (gameState === STABILIZATION_PHASE) {
        if (key.length === 1 && key.toUpperCase() === sequenceTargetKey) {

            // SUCCESSFUL KEY PRESS
            playAudio(audio_success);

            if (sequenceStep + 1 >= SEQUENCE_KEYS.length) {
                // SEQUENCE COMPLETE - WIN GAME
                gameState = GAME_WIN;
                playAudio(audio_congratulations);
                playAudio(audio_win);
                setNotification("REALITY STABILIZED!", "Quantum breach closed!", color(0, 255, 255), 240);
            } else {
                // NEXT STEP
                sequenceStep++;

                // Set the next key (using index to ensure we don't repeat a random one immediately)
                let availableKeys = SEQUENCE_KEYS.slice(); // Copy keys
                availableKeys.splice(availableKeys.indexOf(sequenceTargetKey), 1); // Remove current key
                sequenceTargetKey = availableKeys[floor(random(availableKeys.length))];

                // Calculate new max time based on current step index
                let newMaxTimeIndex = sequenceStep;
                sequenceMaxTime = SEQUENCE_MAX_TIMES[newMaxTimeIndex];

                // Add Dr. Varr's INT bonus (1.5s = 90 frames)
                const intBonusFrames = (selectedCharacter.desc === "Doctor") ? 90 : 0;
                sequenceMaxTime += intBonusFrames;

                sequenceTimer = sequenceMaxTime;
                setNotification("SUCCESS!", `Next target: ${sequenceTargetKey}`, color(0, 255, 150), 30);
            }
        } else if (key.length === 1 && key.toUpperCase() !== sequenceTargetKey) {
            // FAILED KEY PRESS (Wrong Key)
            // Restore boss to half HP and return to battle
            bossHealth = 15;
            bossPhase = 1;
            gameState = BOSS_ROOM;
            playAudio(audio_fail);
            setNotification("SEQUENCE ABORTED!", "Incorrect key input! Paradox regained strength!", color(255, 0, 0), 180);
            return;
        }
        return;
    }

  // --- INTRO & SELECT HANDLER ---
  if (gameState === LORE_SCREEN && key === ' ') {
        gameState = CHARACTER_SELECT;
        playAudio(audio_start_presses);
        return;
    }

  if (gameState === NARRATION_SCREEN && key === ' ') {
      // Narration -> Game Explain 1
      stopNarration(); // Stop character narration
      gameState = GAME_EXPLAIN_1;
      playAudio(audio_start_presses);
      return;
  }

  if (gameState === GAME_EXPLAIN_1 && key === ' ') {
      // Game Explain 1 -> Game Explain 2
      stopNarration(); // Stop Tutorial 1 narration
      gameState = GAME_EXPLAIN_2;
      playAudio(audio_start_presses);
      return;
  }

  if (gameState === GAME_EXPLAIN_2 && key === ' ') {
      // Game Explain 2 -> Start Room (ROOM_2_A)
      stopNarration(); // Stop Tutorial 2 narration
      gameState = ROOM_2_A;
      playAudio(audio_start_presses) // Changed to success for entering the main game loop
      triggerRandomEncounter(gameState);
      return;
  }

  if (gameState === CHARACTER_SELECT) {
    if (key === CHARACTERS.SOLDIER.code || key === CHARACTERS.DOCTOR.code || key === CHARACTERS.ROBOT.code) {
        if (key === CHARACTERS.SOLDIER.code) {
            selectedCharacter = CHARACTERS.SOLDIER;
            playAudio(audio_major); // Play Major's narration
        }
        else if (key === CHARACTERS.DOCTOR.code) {
            selectedCharacter = CHARACTERS.DOCTOR;
            playAudio(audio_doctor); // Play Doctor's narration
        }
        else if (key === CHARACTERS.ROBOT.code) {
            selectedCharacter = CHARACTERS.ROBOT;
            playAudio(audio_t34); // Play Robot's narration
        }
        gameState = NARRATION_SCREEN;
        //The transition sound is handled by the narration audio playing
        return;
    }
  }

  // --- CONFIRMATION HANDLER ---
  if (gameState === CONFIRM_ACTION) {
      if (key === ' ') { // CONFIRM ACTION
          const action = activeAction;
          activeAction = null;

          if (action.type === 'heal_trade') {
              // Execute the cost and heal
              collectedStabilizers = max(0, collectedStabilizers - 1);
              playerHealth = 10;
              // Using a static background flash for event feedback
              background(0, 100, 0);
              playAudio(audio_heal);
              setNotification("ANCHOR ACTIVATED", "Health fully restored (Max 10 HP). Stabilizer sacrificed.", color(0, 255, 150), 150);
              gameState = action.roomState;
              return;
          }

          let statKey, DC;
          if (action.type === 'shield' || action.type === 'capacitor' || action.type === 'amp') {
              statKey = 'INT';
              DC = 12; // Shield, Capacitor, Amplifier all INT DC 12
          } else if (action.type === 'stab1') {
              statKey = 'STR';
              DC = 10;
          } else if (action.type === 'stab2') {
                statKey = 'INT';
                DC = 15;
            }

          const result = performSkillCheck(statKey, DC);

          if (result.success) {
              retrieveItem(action.type);
              // Using a static background flash for event feedback
              background(0, 100, 0);
          }

          if (playerHealth > 0) { gameState = action.roomState; }
          return;
      } else if (key === 'n') { // CANCEL ACTION
          gameState = activeAction.roomState;
          activeAction = null;
          playAudio(audio_fail); // Use fail audio for cancel action
          return;
      }
  }

  // --- RANDOM ENCOUNTER HANDLER ---
  if (currentEvent !== EVENT_NONE) {

        //  Minor Battle Start Check
        if (currentEvent === EVENT_BATTLE && keyCode === 32 && !minorEnemyDefeated && !battleStarted) {
            battleStarted = true;
            playAudio(audio_blaster); // Start combat sound
            return;
        }

      // Merchant is now a mandatory 'N' press to continue
      if (key === 'n' && currentEvent === EVENT_MERCHANT) {
          currentEvent = EVENT_NONE;
          playAudio(audio_start_presses);
      } else if (key === 'n' && currentEvent === EVENT_BATTLE) {
          currentEvent = EVENT_NONE;
          playAudio(audio_start_presses);
          battleStarted = false; // Reset flag on exit
      } else if (currentEvent === EVENT_BATTLE && keyCode === 32 && !minorEnemyDefeated && battleStarted) {
            // Minor Enemy Combat (Hit the Wraith)
            minorEnemyHealth -= 1;
            playAudio(audio_blaster);
            setNotification("HIT!", `Wraith HP: ${max(0, minorEnemyHealth)}`, color(255, 255, 0), 30);

            if (minorEnemyHealth <= 0) {
                minorEnemyDefeated = true;
                setNotification("WRAITH ERADICATED", "Minor threat neutralized.", color(0, 255, 0), 90);
            }
      }
      return;
  }

  // --- ITEM/SKILL CHECK & HEAL TRIGGER ---
  if (key === ' ') {
    let actionType = null;
    let statKey = null;

    if (gameState === ROOM_1_A && !hasQuantumShield) { actionType = 'shield'; statKey = 'INT'; }
    else if (gameState === ROOM_1_B && !hasFluxCapacitor) { actionType = 'capacitor'; statKey = 'INT'; }
    else if (gameState === ROOM_2_A && collectedStabilizers < 1) { actionType = 'stab1'; statKey = 'STR'; }
    else if (gameState === ROOM_2_B && collectedStabilizers < 2) { actionType = 'stab2'; statKey = 'INT'; }
    else if (gameState === ROOM_3_A && !hasTemporalAmplifier) { actionType = 'amp'; statKey = 'INT'; }
    else if (gameState === ROOM_3_B && playerHealth < 10 && collectedStabilizers >= 1) { actionType = 'heal_trade'; } // NEW HEAL ACTION

    if (actionType) {
        activeAction = { type: actionType, roomState: gameState, stat: statKey };
        gameState = CONFIRM_ACTION;
        return;
    }
  }

  // --- HUB NAVIGATION ---
  if (gameState === ROOM_1_A || gameState === ROOM_1_B ||
      gameState === ROOM_2_A || gameState === ROOM_2_B ||
      gameState === ROOM_3_A || gameState === ROOM_3_B) {

      let newRoom = -1;

      if (key === 'z') newRoom = ROOM_1_A; // Shield Cache
      else if (key === 'c') newRoom = ROOM_1_B; // Capacitor Fault
      else if (key === 'q') newRoom = ROOM_2_A; // Stabilizer 1
      else if (key === 'w') newRoom = ROOM_2_B; // Stabilizer 2
      else if (key === 'e') newRoom = ROOM_3_A; // Amplifier
      else if (key === 'r') newRoom = ROOM_3_B; // Rest Chamber
      else if (key === 'x') newRoom = FINAL_CHAMBER; // Final Exit
      else if (key === 't') { //  Tutorial Shortcut
            stopNarration();
            gameState = GAME_EXPLAIN_1;
            return;
      }

      if (newRoom !== -1) {
          gameState = newRoom;
          playAudio(audio_start_presses);
          if (newRoom < FINAL_CHAMBER) {
            triggerRandomEncounter(gameState);
          }
          return;
      }
  }

  // --- FINAL CHAMBER HANDLERS ---
  if (gameState === FINAL_CHAMBER) {
      if (key === 'd' && collectedStabilizers === STABILIZERS_NEEDED) {
        // Transition to the preview screen
        gameState = BOSS_PREVIEW;
        playAudio(audio_boss_before);
        return;
      } else if (key === 'n') {
          // Allow return to the Labyrinth if player is not ready
          gameState = ROOM_2_A; // Default to a central hub room
          playAudio(audio_success); // Use success audio for navigation
          triggerRandomEncounter(gameState);
          return;
      }
  }

  // --- BOSS PREVIEW HANDLER ---
  if (gameState === BOSS_PREVIEW && key === ' ') {
      gameState = BOSS_ROOM;
      playAudio(audio_boss_before);
      return;
  }

  // --- BOSS FIGHT ACTIONS ---
  if (gameState === BOSS_ROOM) {

    if (keyCode === 32) {

            if (bossPhase === 1) {
                // PHASE 1: Player attacks (Damage Race)
                let damage = 1 + selectedCharacter.STR;
                if (hasTemporalAmplifier) damage += 1;
                bossHealth -= damage;
                fill(255, 0, 0); ellipse(width / 2, scaleY(180), scaleSize(50), scaleSize(50));
                playAudio(audio_blaster); // Play weapon fire sound
                setNotification("BLAST LANDED", `Boss took ${damage} damage.`, color(255, 255, 0), 60);

                if (bossHealth <= 0) {
                    // This handles a potential instant win if damage exceeds remaining HP before Phase 2 triggers.
                    gameState = GAME_WIN;
                    playAudio(audio_congratulations);
                    playAudio(audio_win);
                    setNotification("ENTITY DESTROYED", "The Paradox Entity is defeated!", color(0, 255, 255), 240);
                }
            }
    }

    if (key === 'h' && hasFluxCapacitor && !capacitorUsed) {
      playerHealth = min(10, playerHealth + 5);
      capacitorUsed = true;
      background(0, 150, 0);
      playAudio(audio_heal);
      setNotification("CAPACITOR FIRED", "5 HP restored. Capacitor depleted.", color(0, 255, 150), 120);
    }
  }

  // --- GAME RESET ---
  if (key === 'r' && (gameState === GAME_WIN || gameState === GAME_OVER)) {
    resetGame();
  }
}

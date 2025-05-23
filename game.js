// Game canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game canvas size and scale
const baseGameWidth = 1205;
const baseGameHeight = 678;
let lastTimestamp = performance.now();

function resizeCanvas() {
  const container = document.querySelector('.game-container');
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Calculate the scale to fit the canvas while maintaining aspect ratio
  const scaleX = windowWidth / baseGameWidth;
  const scaleY = windowHeight / baseGameHeight;
  const scale = Math.min(scaleX, scaleY);

  // Set canvas size to fit the window while maintaining aspect ratio
  canvas.style.width = `${baseGameWidth * scale}px`;
  canvas.style.height = `${baseGameHeight * scale}px`;

  // Set canvas resolution (in pixels) to maintain crisp rendering
  canvas.width = baseGameWidth;
  canvas.height = baseGameHeight;
}

// Game canvas scroll speed
const scrollSpeedPerSecond = 240; // units per second at baseGameWidth scale

// Score
let score = 0;                    // current points
const SCORE_PER_SECOND = 100;     // points added each second while playing

// Game state
let gameState = 'READY'; // 'READY', 'PLAYING', or 'LOSE'

// Animation variables
let animationTimer = 0;
const animationInterval = 0.25; // Switch legs every 0.25 seconds
let dinoSpriteIndex = 0;

// Jumping variables
let isJumping = false;
const INITIAL_JUMP_VELOCITY = 600;  // pixels per second
let jumpVelocity = INITIAL_JUMP_VELOCITY;  // Current velocity, starts at initial
const gravity = 1000;  // pixels per second per second
let initialY = 0;

// Cactus variables
let cacti = [];
let cactusTimer = 0;  // Time in seconds since last spawn
let nextCactusTime = getRandomCactusTime();  // Time in seconds until next spawn
let isCactusRateHalved = false;

// Define padding values for both objects
const dinoHitboxPadding = { top: 10, bottom: 5, left: 22, right: 14 };
const dinoDuckHitboxPadding = { top: 5, bottom: 2, left: 10, right: 10 }; // For ducking
const cactusHitboxPadding = { top: 5, bottom: 0, left: 12, right: 12 };
const evilDaxHitboxPadding = { top: 10, bottom: 10, left: 20, right: 20 }; // For evil-dax

// Load game assets
const skyImage = new Image();
skyImage.src = 'assets/sky.svg';

const groundImage = new Image();
groundImage.src = 'assets/ground.svg';

const dinoStandingImage = new Image();
dinoStandingImage.src = 'assets/dino-standing.svg';

const dinoLeftLegImage = new Image();
dinoLeftLegImage.src = 'assets/dino-left-leg.svg';

const dinoRightLegImage = new Image();
dinoRightLegImage.src = 'assets/dino-right-leg.svg';

const dinoDeadImage = new Image();
dinoDeadImage.src = 'assets/dino-dead.svg';

const dinoDuckLeftLegImage = new Image();
dinoDuckLeftLegImage.src = 'assets/dino-duck-left-leg.svg';
const dinoDuckRightLegImage = new Image();
dinoDuckRightLegImage.src = 'assets/dino-duck-right-leg.svg';

const cactusImages = [
  { img: new Image(), weight: 1.5 },  // cactus1
  { img: new Image(), weight: 1.5 },  // cactus2
  { img: new Image(), weight: 1 },    // cactus-pair
  { img: new Image(), weight: 1 }     // cactus-trio
];

cactusImages[0].img.src = 'assets/cactus1.svg';
cactusImages[1].img.src = 'assets/cactus2.svg';
cactusImages[2].img.src = 'assets/cactus-pair.svg';
cactusImages[3].img.src = 'assets/cactus-trio.svg';

// Game elements
// Original ground element
const ground = {
  x: 0,
  y: baseGameHeight - 256, // Updated ground height to 256px
  width: baseGameWidth,
  height: 256 // Updated ground height to 256px
};

// Clone ground element
const groundClone = {
  x: baseGameWidth, // Start at the right edge of the canvas
  y: baseGameHeight - 256,
  width: baseGameWidth,
  height: 256
};

// Original sky element
const sky = {
  x: 0,
  y: 0,
  width: baseGameWidth,
  height: 471 // Updated sky height to 471px
};

// Clone sky element
const skyClone = {
  x: baseGameWidth, // Start at the right edge of the canvas
  y: 0,
  width: baseGameWidth,
  height: 471
};

const dino = {
  x: 40, //40px right of left border
  y: baseGameHeight - 287, //287px above bottom border
  width: 88, // Will adjust based on image aspect ratio
  height: 94 // Will adjust based on image aspect ratio
};

// Ducking state
let isDucking = false;

// Dino dimensions
const DINO_DUCK_WIDTH = 118;
const DINO_DUCK_HEIGHT = 56;

// Load evil-dax sprites
const evilDax1Image = new Image();
evilDax1Image.src = 'assets/evil-dax1.svg';
const evilDax2Image = new Image();
evilDax2Image.src = 'assets/evil-dax2.svg';

// Evil-dax variables
let evilDaxes = [];
let nextEvilDaxScore = 1500;
let evilDaxSpawnTimer = 0;
let evilDaxNextSpawnDelay = null;

// Helper function to get a refined bounding box
function getRefinedHitbox(obj, padding, override = {}) {
  const x = (override.x !== undefined ? override.x : obj.x) + padding.left;
  const y = (override.y !== undefined ? override.y : obj.y) + padding.top;
  const width = (override.width !== undefined ? override.width : obj.width) - padding.left - padding.right;
  const height = (override.height !== undefined ? override.height : obj.height) - padding.top - padding.bottom;
  return { x, y, width, height };
}

// Refined collision detection function
function checkRefinedCollision(a, aPadding, b, bPadding) {
  const boxA = getRefinedHitbox(a, aPadding);
  const boxB = getRefinedHitbox(b, bPadding);
  
  return (
    boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y
  );
}

// Event listeners
document.addEventListener('keydown', function(event) {
  // Check if the pressed key is the spacebar, up arrow, or down arrow
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    if (gameState === 'READY') {
      gameState = 'PLAYING';
    } else if (gameState === 'PLAYING' && !isJumping) {
      // Start jump if on the ground
      isJumping = true;
      jumpVelocity = INITIAL_JUMP_VELOCITY;  // Reset to initial velocity
      initialY = dino.y;
    } else if (gameState === 'LOSE') {
      // Reset the game
      resetGame();
    }
  } else if (event.code === 'ArrowDown') {
    if (gameState === 'PLAYING' && !isJumping) {
      isDucking = true;
    }
  }
});

document.addEventListener('keyup', function(event) {
  if (event.code === 'ArrowDown') {
    isDucking = false;
  }
});

// Game initialization
function init() {
  
  // Clear the canvas
  ctx.clearRect(0, 0, baseGameWidth, baseGameHeight);
  
  // Draw background
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, baseGameWidth, baseGameHeight);
  
  // Draw sky - original and clone
  if (skyImage.complete) {
    ctx.drawImage(skyImage, Math.round(sky.x), sky.y, sky.width + 1, sky.height);
    ctx.drawImage(skyImage, Math.round(skyClone.x), skyClone.y, skyClone.width + 1, skyClone.height);    
  }
  
  // Draw ground - original and clone
  if (groundImage.complete) {
    ctx.drawImage(groundImage, Math.round(ground.x), ground.y, ground.width + 1, ground.height);
    ctx.drawImage(groundImage, Math.round(groundClone.x), groundClone.y, groundClone.width + 1, groundClone.height);
  }
  
  // Draw cacti
  drawCacti();
  
  // Draw dino
  if (
    dinoStandingImage.complete &&
    dinoLeftLegImage.complete &&
    dinoRightLegImage.complete &&
    dinoDeadImage.complete &&
    dinoDuckLeftLegImage.complete &&
    dinoDuckRightLegImage.complete
  ) {
    if (gameState === 'LOSE') {
      ctx.drawImage(dinoDeadImage, dino.x, dino.y, dino.width, dino.height);
    } else if (gameState === 'READY' || isJumping) {
      // Use standing dino in READY state or when jumping
      ctx.drawImage(dinoStandingImage, dino.x, dino.y, dino.width, dino.height);
    } else if (isDucking) {
      // Use ducking dino images and alternate for animation
      const currentDuckImage = dinoSpriteIndex === 0 ? dinoDuckLeftLegImage : dinoDuckRightLegImage;
      ctx.drawImage(
        currentDuckImage,
        dino.x,
        dino.y + (dino.height - DINO_DUCK_HEIGHT), // shift down so feet stay on ground
        DINO_DUCK_WIDTH,
        DINO_DUCK_HEIGHT
      );
    } else {
      // Use animated dino in PLAYING state
      const currentDinoImage = dinoSpriteIndex === 0 ? dinoLeftLegImage : dinoRightLegImage;
      ctx.drawImage(currentDinoImage, dino.x, dino.y, dino.width, dino.height);
    }
  }
  
  // Draw score as 7-digit zero-padded number
  ctx.fillStyle = 'yellow';
  ctx.font = 'bold 48px Fira Mono, Consolas, "Courier New"';
  ctx.textAlign = 'right';
  const scoreString = Math.floor(score).toString().padStart(7, '0');
  ctx.fillText(scoreString, baseGameWidth - 100, 60);
  
  // Add text based on game state
  if (gameState === 'READY') {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 45px "Basic Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS SPACE TO START', baseGameWidth / 2, baseGameHeight / 2);
  } else if (gameState === 'LOSE') {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 72px "Basic Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', baseGameWidth / 2, baseGameHeight / 2 - 40);
    
    ctx.font = 'bold 36px "Basic Sans", Arial, sans-serif';
    ctx.fillText('Press space to play again', baseGameWidth / 2, baseGameHeight / 2 + 40);
  }

  // Draw evil-daxes
  evilDaxes.forEach(dax => {
    const img = dax.animationIndex === 0 ? evilDax1Image : evilDax2Image;
    if (img.complete) {
      ctx.drawImage(img, dax.x, dax.y, dax.width, dax.height);
    }
  });
}

// Update game elements
function update(deltaTime) {
  const effectiveSpeed = scrollSpeedPerSecond * deltaTime;
  if (gameState === 'PLAYING') {
    // Accumulate score
    score += SCORE_PER_SECOND * deltaTime;
    // Handle jumping
    if (isJumping) {
      // Apply gravity to velocity
      jumpVelocity -= gravity * deltaTime;
      // Update dino position
      dino.y -= jumpVelocity * deltaTime;
      // Check if dino has returned to the ground
      if (dino.y >= initialY) {
        dino.y = initialY;
        isJumping = false;
      }
    } else if (isDucking) {
      // Animate ducking
      animationTimer += deltaTime;
      if (animationTimer >= animationInterval) {
        animationTimer = 0;
        dinoSpriteIndex = dinoSpriteIndex === 0 ? 1 : 0;
      }
    } else {
      // Animate running
      animationTimer += deltaTime;
      if (animationTimer >= animationInterval) {
        animationTimer = 0;
        dinoSpriteIndex = dinoSpriteIndex === 0 ? 1 : 0;
      }
    }
    
    // Move original ground and sky to the left
    ground.x -= effectiveSpeed;
    sky.x -= effectiveSpeed;
    
    // Move clone ground and sky to the left
    groundClone.x -= effectiveSpeed;
    skyClone.x -= effectiveSpeed;
    
    // Reset positions when elements go off-screen
    if (ground.x <= -baseGameWidth) {
      ground.x = groundClone.x + baseGameWidth;
    }
    
    if (groundClone.x <= -baseGameWidth) {
      groundClone.x = ground.x + baseGameWidth;
    }
    
    if (sky.x <= -baseGameWidth) {
      sky.x = skyClone.x + baseGameWidth;
    }
    
    if (skyClone.x <= -baseGameWidth) {
      skyClone.x = sky.x + baseGameWidth;
    }
    
    // Update cactus timer
    cactusTimer += deltaTime;
    if (cactusTimer >= nextCactusTime) {
      generateCactus();
      cactusTimer = 0;
      nextCactusTime = getRandomCactusTime() * (isCactusRateHalved ? 2 : 1);
    }
    
    // Update cacti positions and check for collision
    updateCacti(deltaTime);

    // Update evil-dax spawn logic
    if (score >= 1500 && Math.floor(score) >= nextEvilDaxScore) {
      if (evilDaxNextSpawnDelay === null) {
        evilDaxNextSpawnDelay = Math.random() * 7 + 3; // 3-10 seconds
        evilDaxSpawnTimer = 0;
      }
      evilDaxSpawnTimer += deltaTime;
      if (evilDaxSpawnTimer >= evilDaxNextSpawnDelay) {
        generateEvilDax();
        nextEvilDaxScore += 1500;
        evilDaxNextSpawnDelay = null;
        evilDaxSpawnTimer = 0;
      }
    }
    // Update evil-dax positions and check for collision
    updateEvilDaxes(deltaTime);

    // Determine if cactus rate should be halved
    isCactusRateHalved = false;
    if (
      (evilDaxNextSpawnDelay !== null && evilDaxNextSpawnDelay - evilDaxSpawnTimer <= 6) ||
      evilDaxes.length > 0
    ) {
      isCactusRateHalved = true;
    }
  }
}

function drawCacti() {
  cacti.forEach(cactus => {
    if (cactus.image.complete) {
      ctx.drawImage(cactus.image, cactus.x, cactus.y, cactus.width, cactus.height);
    }
  });
}

function generateCactus() {
  // Calculate the total weight
  const totalWeight = cactusImages.reduce((sum, img) => sum + img.weight, 0);
  
  // Generate a random value between 0 and the total weight
  let random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  let selectedIndex = 0;
  
  // Select an image based on its weight
  for (let i = 0; i < cactusImages.length; i++) {
    cumulativeWeight += cactusImages[i].weight;
    if (random <= cumulativeWeight) {
      selectedIndex = i;
      break;
    }
  }
  
  const selectedImage = cactusImages[selectedIndex].img;
  
  // Define cactus dimensions (adjust as needed based on images)
  let width, height;
  
  if (selectedIndex === 0 || selectedIndex === 1) {
    width = 50;  // Small cacti
    height = 100;
  } else {
    width = 100; // Large cacti
    height = 100;
  }
  
  // Create a new cactus
  const cactus = {
    x: baseGameWidth,
    y: baseGameHeight - 190 - height,  // Place on the ground
    width,
    height,
    image: selectedImage
  };
  
  cacti.push(cactus);
}

function updateCacti(deltaTime) {
  const effectiveSpeed = scrollSpeedPerSecond * deltaTime;
  for (let i = 0; i < cacti.length; i++) {
    const cactus = cacti[i];
    // Move cactus to the left
    cactus.x -= effectiveSpeed;
    // Collision check
    if (checkAABBCollision(getCurrentDinoHitbox(), getRefinedHitbox(cactus, cactusHitboxPadding))) {
      gameState = 'LOSE';
    }
    // Remove cactus if it's off-screen
    if (cactus.x + cactus.width < 0) {
      cacti.splice(i, 1);
      i--;
    }
  }
}

function getRandomCactusTime() {
  // Return a random time between 1.4 and 3.4 seconds
  return Math.random() * 2 + 1.4;
}

function resetGame() {
  gameState = 'PLAYING';
  cacti = [];
  cactusTimer = 0;
  nextCactusTime = getRandomCactusTime();
  isJumping = false;
  dino.y = initialY = baseGameHeight - 287;
  score = 0;
  // Reset evil-dax variables:
  evilDaxes = [];
  nextEvilDaxScore = 1500;
  evilDaxSpawnTimer = 0;
  evilDaxNextSpawnDelay = null;
}

// Make sure images are loaded before initializing
let assetsLoaded = 0;
const requiredAssets = 11; // Updated to include all images

function checkAllAssetsLoaded() {
  assetsLoaded++;
  if (assetsLoaded >= requiredAssets) {
    init();
  }
}

skyImage.onload = checkAllAssetsLoaded;
groundImage.onload = checkAllAssetsLoaded;
dinoStandingImage.onload = checkAllAssetsLoaded;
dinoLeftLegImage.onload = checkAllAssetsLoaded;
dinoRightLegImage.onload = checkAllAssetsLoaded;
dinoDeadImage.onload = checkAllAssetsLoaded;
dinoDuckLeftLegImage.onload = checkAllAssetsLoaded;
dinoDuckRightLegImage.onload = checkAllAssetsLoaded;
cactusImages[0].img.onload = checkAllAssetsLoaded;
cactusImages[1].img.onload = checkAllAssetsLoaded;
cactusImages[2].img.onload = checkAllAssetsLoaded;
cactusImages[3].img.onload = checkAllAssetsLoaded;
evilDax1Image.onload = checkAllAssetsLoaded;
evilDax2Image.onload = checkAllAssetsLoaded;

// In case images are already cached
if (skyImage.complete) checkAllAssetsLoaded();
if (groundImage.complete) checkAllAssetsLoaded();
if (dinoStandingImage.complete) checkAllAssetsLoaded();
if (dinoLeftLegImage.complete) checkAllAssetsLoaded();
if (dinoRightLegImage.complete) checkAllAssetsLoaded();
if (dinoDeadImage.complete) checkAllAssetsLoaded();
if (dinoDuckLeftLegImage.complete) checkAllAssetsLoaded();
if (dinoDuckRightLegImage.complete) checkAllAssetsLoaded();
if (cactusImages[0].img.complete) checkAllAssetsLoaded();
if (cactusImages[1].img.complete) checkAllAssetsLoaded();
if (cactusImages[2].img.complete) checkAllAssetsLoaded();
if (cactusImages[3].img.complete) checkAllAssetsLoaded();
if (evilDax1Image.complete) checkAllAssetsLoaded();
if (evilDax2Image.complete) checkAllAssetsLoaded();

// Game loop
function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTimestamp) / 1000; // in seconds
  lastTimestamp = timestamp;

  update(deltaTime);  // pass deltaTime to update
  init();             // draw
  requestAnimationFrame(gameLoop);
}

// Resize canvas on load and when window resizes
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Start the game loop
gameLoop();

function generateEvilDax() {
  // Evil-dax dimensions
  const width = 80;
  const height = 84;
  evilDaxes.push({
    x: baseGameWidth,
    y: baseGameHeight - 256 - 80, // 60px above ground
    width,
    height,
    animationIndex: 0,
    animationTimer: 0,
    animationInterval: 0.2 // Flap every 0.2s
  });
}

function updateEvilDaxes(deltaTime) {
  const evilDaxSpeed = scrollSpeedPerSecond * 2 * deltaTime; // double cactus speed
  for (let i = 0; i < evilDaxes.length; i++) {
    const dax = evilDaxes[i];
    dax.x -= evilDaxSpeed;
    // Animate wings
    dax.animationTimer += deltaTime;
    if (dax.animationTimer >= dax.animationInterval) {
      dax.animationTimer = 0;
      dax.animationIndex = dax.animationIndex === 0 ? 1 : 0;
    }
    // Collision check
    if (checkAABBCollision(getCurrentDinoHitbox(), getRefinedHitbox(dax, evilDaxHitboxPadding))) {
      gameState = 'LOSE';
    }
    // Remove if off-screen
    if (dax.x + dax.width < 0) {
      evilDaxes.splice(i, 1);
      i--;
    }
  }
}

function getCurrentDinoHitbox() {
  if (isDucking) {
    return getRefinedHitbox(
      dino,
      dinoDuckHitboxPadding,
      {
        y: dino.y + (dino.height - DINO_DUCK_HEIGHT),
        height: DINO_DUCK_HEIGHT,
        width: DINO_DUCK_WIDTH
      }
    );
  } else {
    return getRefinedHitbox(dino, dinoHitboxPadding);
  }
}

function checkAABBCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
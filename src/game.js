// --- Constants ---
const BASE_GAME_WIDTH = 1205;
const BASE_GAME_HEIGHT = 678;
const DINO_X_RATIO = 40 / BASE_GAME_WIDTH;
const DINO_Y_RATIO = (BASE_GAME_HEIGHT - 287) / BASE_GAME_HEIGHT;
const DINO_WIDTH_RATIO = 88 / BASE_GAME_WIDTH;
const DINO_HEIGHT_RATIO = 94 / BASE_GAME_HEIGHT;
const DINO_DUCK_WIDTH_RATIO = 118 / BASE_GAME_WIDTH;
const DINO_DUCK_HEIGHT_RATIO = 56 / BASE_GAME_HEIGHT;
const GROUND_HEIGHT_RATIO = 256 / BASE_GAME_HEIGHT;
const SKY_HEIGHT_RATIO = 471 / BASE_GAME_HEIGHT;
const CACTUS_SMALL_WIDTH_RATIO = 50 / BASE_GAME_WIDTH;
const CACTUS_LARGE_WIDTH_RATIO = 100 / BASE_GAME_WIDTH;
const CACTUS_HEIGHT_RATIO = 100 / BASE_GAME_HEIGHT;
const CACTUS_Y_OFFSET_RATIO = 190 / BASE_GAME_HEIGHT;
const EVIL_DAX_WIDTH_RATIO = 80 / BASE_GAME_WIDTH;
const EVIL_DAX_HEIGHT_RATIO = 84 / BASE_GAME_HEIGHT;
const EVIL_DAX_Y_OFFSET_RATIO = 256 / BASE_GAME_HEIGHT;
const EVIL_DAX_ABOVE_GROUND_RATIO = 80 / BASE_GAME_HEIGHT;
const scrollSpeedPerSecond = 240;
const SCORE_PER_SECOND = 100;
const animationInterval = 0.25;
const INITIAL_JUMP_VELOCITY = 600;
const gravity = 1000;
const GROUND_OVERLAP = 60; // px, for dino/cactus to slightly overlap ground
const EVIL_DAX_DUCKABLE_OFFSET = 0; // px, how high evil dax flies above ground
const DINO_STAND_HEIGHT = 94;
const DINO_DUCK_HEIGHT = 56;

// --- Game State Variables ---
let lastTimestamp = performance.now();
let score = 0;
let gameState = 'READY'; // 'READY', 'PLAYING', or 'LOSE'
let isDucking = false;
let animationTimer = 0;
let dinoSpriteIndex = 0;
let isJumping = false;
let jumpVelocity = INITIAL_JUMP_VELOCITY;
let initialY = 0;
let cacti = [];
let cactusTimer = 0;
let nextCactusTime = getRandomCactusTime();
let isCactusRateHalved = false;
let evilDaxes = [];
let evilDaxNextSpawnDelay = null;
let evilDaxSpawnTimer = 0;
let nextEvilDaxScore = 1500;

// --- Asset Loading ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const dinoHitboxPadding = { top: 10, bottom: 5, left: 22, right: 14 };
const dinoDuckHitboxPadding = { top: 5, bottom: 2, left: 10, right: 10 };
const cactusHitboxPadding = { top: 5, bottom: 0, left: 12, right: 12 };
const evilDaxHitboxPadding = { top: 10, bottom: 10, left: 20, right: 20 };

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
  { img: new Image(), weight: 1.5 },
  { img: new Image(), weight: 1.5 },
  { img: new Image(), weight: 1 },
  { img: new Image(), weight: 1 }
];
cactusImages[0].img.src = 'assets/cactus1.svg';
cactusImages[1].img.src = 'assets/cactus2.svg';
cactusImages[2].img.src = 'assets/cactus-pair.svg';
cactusImages[3].img.src = 'assets/cactus-trio.svg';
const evilDax1Image = new Image();
evilDax1Image.src = 'assets/evil-dax1.svg';
const evilDax2Image = new Image();
evilDax2Image.src = 'assets/evil-dax2.svg';

// --- Store all positions in virtual coordinates (base size) ---
let dino = { x: 40, y: getGroundTopY() - DINO_STAND_HEIGHT + GROUND_OVERLAP, width: 88, height: DINO_STAND_HEIGHT };
let ground = { x: 0, y: getGroundTopY(), width: BASE_GAME_WIDTH, height: 256 };
let groundClone = { x: BASE_GAME_WIDTH, y: getGroundTopY(), width: BASE_GAME_WIDTH, height: 256 };
let sky = { x: 0, y: 0, width: BASE_GAME_WIDTH, height: 471 };
let skyClone = { x: BASE_GAME_WIDTH, y: 0, width: BASE_GAME_WIDTH, height: 471 };

// --- Drawing helpers: convert virtual to pixel ---
function toPxX(x) { return x * canvas.width / BASE_GAME_WIDTH; }
function toPxY(y) { return y * canvas.height / BASE_GAME_HEIGHT; }
function toPxW(w) { return w * canvas.width / BASE_GAME_WIDTH; }
function toPxH(h) { return h * canvas.height / BASE_GAME_HEIGHT; }

// --- Update resizeCanvas to only resize canvas ---
function resizeCanvas() {
  const aspect = BASE_GAME_WIDTH / BASE_GAME_HEIGHT;
  let width = window.innerWidth;
  let height = window.innerHeight;
  if (width / height > aspect) {
    width = height * aspect;
  } else {
    height = width / aspect;
  }
  // Set CSS size (in CSS pixels)
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  // Set internal resolution (in device pixels)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

// --- Update init() to use virtual coordinates and convert to pixels for drawing ---
function init() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw sky - original and clone
  if (skyImage.complete) {
    ctx.drawImage(
      skyImage,
      Math.floor(toPxX(sky.x)),
      toPxY(sky.y),
      Math.ceil(toPxW(sky.width) + 1),
      toPxH(sky.height)
    );
    ctx.drawImage(
      skyImage,
      Math.floor(toPxX(skyClone.x)),
      toPxY(skyClone.y),
      Math.ceil(toPxW(skyClone.width) + 1),
      toPxH(skyClone.height)
    );
  }

  // Draw ground - original and clone
  if (groundImage.complete) {
    ctx.drawImage(
      groundImage,
      Math.floor(toPxX(ground.x)),
      toPxY(ground.y),
      Math.ceil(toPxW(ground.width) + 1),
      toPxH(ground.height)
    );
    ctx.drawImage(
      groundImage,
      Math.floor(toPxX(groundClone.x)),
      toPxY(groundClone.y),
      Math.ceil(toPxW(groundClone.width) + 1),
      toPxH(groundClone.height)
    );
  }

  // Draw cacti
  cacti.forEach(cactus => {
    if (cactus.image.complete) {
      ctx.drawImage(cactus.image, toPxX(cactus.x), toPxY(cactus.y), toPxW(cactus.width), toPxH(cactus.height));
    }
  });

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
      ctx.drawImage(dinoDeadImage, toPxX(dino.x), toPxY(dino.y), toPxW(dino.width), toPxH(dino.height));
    } else if (gameState === 'READY' || isJumping) {
      ctx.drawImage(dinoStandingImage, toPxX(dino.x), toPxY(dino.y), toPxW(dino.width), toPxH(dino.height));
    } else if (isDucking) {
      const currentDuckImage = dinoSpriteIndex === 0 ? dinoDuckLeftLegImage : dinoDuckRightLegImage;
      ctx.drawImage(
        currentDuckImage,
        toPxX(dino.x),
        toPxY(dino.y + (DINO_STAND_HEIGHT - DINO_DUCK_HEIGHT)),
        toPxW(118),
        toPxH(DINO_DUCK_HEIGHT)
      );
    } else {
      const currentDinoImage = dinoSpriteIndex === 0 ? dinoLeftLegImage : dinoRightLegImage;
      ctx.drawImage(currentDinoImage, toPxX(dino.x), toPxY(dino.y), toPxW(dino.width), toPxH(dino.height));
    }
  }

  // Draw score as 7-digit zero-padded number
  ctx.fillStyle = 'yellow';
  ctx.font = `bold ${Math.floor(canvas.height * 0.07)}px Fira Mono, Consolas, 'Courier New'`;
  ctx.textAlign = 'right';
  const scoreString = Math.floor(score).toString().padStart(7, '0');
  ctx.fillText(scoreString, canvas.width - 100, 60);

  // Add text based on game state
  ctx.textAlign = 'center';
  if (gameState === 'READY') {
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(canvas.height * 0.065)}px 'Basic Sans', Arial, sans-serif`;
    ctx.fillText('PRESS SPACE TO START', canvas.width / 2, canvas.height / 2);
  } else if (gameState === 'LOSE') {
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(canvas.height * 0.11)}px 'Basic Sans', Arial, sans-serif`;
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = `bold ${Math.floor(canvas.height * 0.05)}px 'Basic Sans', Arial, sans-serif`;
    ctx.fillText('Press space to play again', canvas.width / 2, canvas.height / 2 + 40);
  }

  // Draw evil-daxes
  evilDaxes.forEach(dax => {
    const img = dax.animationIndex === 0 ? evilDax1Image : evilDax2Image;
    if (img.complete) {
      ctx.drawImage(img, toPxX(dax.x), toPxY(dax.y), toPxW(dax.width), toPxH(dax.height));
    }
  });
}

// --- Update update() for responsive movement ---
function update(deltaTime) {
  const effectiveSpeed = (canvas.width / BASE_GAME_WIDTH) * scrollSpeedPerSecond * deltaTime;
  if (gameState === 'PLAYING') {
    score += SCORE_PER_SECOND * deltaTime;
    if (isJumping) {
      jumpVelocity -= gravity * deltaTime;
      dino.y -= jumpVelocity * deltaTime;
      if (dino.y >= initialY) {
        dino.y = initialY;
        isJumping = false;
      }
    } else if (isDucking) {
      animationTimer += deltaTime;
      if (animationTimer >= animationInterval) {
        animationTimer = 0;
        dinoSpriteIndex = dinoSpriteIndex === 0 ? 1 : 0;
      }
    } else {
      animationTimer += deltaTime;
      if (animationTimer >= animationInterval) {
        animationTimer = 0;
        dinoSpriteIndex = dinoSpriteIndex === 0 ? 1 : 0;
      }
    }
    // Move ground and sky
    ground.x -= effectiveSpeed;
    sky.x -= effectiveSpeed;
    groundClone.x -= effectiveSpeed;
    skyClone.x -= effectiveSpeed;
    if (ground.x <= -ground.width) ground.x = groundClone.x + groundClone.width;
    if (groundClone.x <= -groundClone.width) groundClone.x = ground.x + ground.width;
    if (sky.x <= -sky.width) sky.x = skyClone.x + skyClone.width;
    if (skyClone.x <= -skyClone.width) skyClone.x = sky.x + sky.width;
    // Update cactus timer
    cactusTimer += deltaTime;
    if (cactusTimer >= nextCactusTime) {
      generateCactus();
      cactusTimer = 0;
      nextCactusTime = getRandomCactusTime() * (isCactusRateHalved ? 2 : 1);
    }
    updateCacti(deltaTime, effectiveSpeed);
    // Evil-dax logic
    if (score >= 1500 && Math.floor(score) >= nextEvilDaxScore) {
      if (evilDaxNextSpawnDelay === null) {
        evilDaxNextSpawnDelay = Math.random() * 7 + 3;
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
    updateEvilDaxes(deltaTime, effectiveSpeed * 2);
    isCactusRateHalved = false;
    if ((evilDaxNextSpawnDelay !== null && evilDaxNextSpawnDelay - evilDaxSpawnTimer <= 6) || evilDaxes.length > 0) {
      isCactusRateHalved = true;
    }
  }
}

// --- Update drawCacti and updateCacti for responsive ---
function drawCacti() {
  cacti.forEach(cactus => {
    if (cactus.image.complete) {
      ctx.drawImage(cactus.image, toPxX(cactus.x), toPxY(cactus.y), toPxW(cactus.width), toPxH(cactus.height));
    }
  });
}

function generateCactus() {
  const totalWeight = cactusImages.reduce((sum, img) => sum + img.weight, 0);
  let random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  let selectedIndex = 0;
  for (let i = 0; i < cactusImages.length; i++) {
    cumulativeWeight += cactusImages[i].weight;
    if (random <= cumulativeWeight) {
      selectedIndex = i;
      break;
    }
  }
  const selectedImage = cactusImages[selectedIndex].img;
  let width, height;
  if (selectedIndex === 0 || selectedIndex === 1) {
    width = 50;
    height = 100;
  } else {
    width = 100;
    height = 100;
  }
  const cactus = {
    x: BASE_GAME_WIDTH,
    y: getGroundTopY() - height + GROUND_OVERLAP,
    width,
    height,
    image: selectedImage
  };
  cacti.push(cactus);
}

function updateCacti(deltaTime, effectiveSpeed) {
  for (let i = 0; i < cacti.length; i++) {
    const cactus = cacti[i];
    cactus.x -= effectiveSpeed;
    if (checkAABBCollision(getCurrentDinoHitbox(), getRefinedHitbox(cactus, cactusHitboxPadding))) {
      gameState = 'LOSE';
    }
    if (cactus.x + cactus.width < 0) {
      cacti.splice(i, 1);
      i--;
    }
  }
}

// --- Update evil-dax for responsive ---
function generateEvilDax() {
  const width = 80;
  const height = 84;
  evilDaxes.push({
    x: BASE_GAME_WIDTH,
    y: getGroundTopY() - height - EVIL_DAX_DUCKABLE_OFFSET,
    width,
    height,
    animationIndex: 0,
    animationTimer: 0,
    animationInterval: 0.2
  });
}

function updateEvilDaxes(deltaTime, evilDaxSpeed) {
  for (let i = 0; i < evilDaxes.length; i++) {
    const dax = evilDaxes[i];
    dax.x -= evilDaxSpeed;
    dax.animationTimer += deltaTime;
    if (dax.animationTimer >= dax.animationInterval) {
      dax.animationTimer = 0;
      dax.animationIndex = dax.animationIndex === 0 ? 1 : 0;
    }
    if (checkAABBCollision(getCurrentDinoHitbox(), getRefinedHitbox(dax, evilDaxHitboxPadding))) {
      gameState = 'LOSE';
    }
    if (dax.x + dax.width < 0) {
      evilDaxes.splice(i, 1);
      i--;
    }
  }
}

// --- Update getCurrentDinoHitbox for responsive ---
function getCurrentDinoHitbox() {
  if (isDucking) {
    const rect = {
      x: dino.x,
      y: dino.y + (DINO_STAND_HEIGHT - DINO_DUCK_HEIGHT),
      width: 118,
      height: DINO_DUCK_HEIGHT
    };
    return getRefinedHitbox(rect, dinoDuckHitboxPadding);
  } else {
    const rect = { x: dino.x, y: dino.y, width: 88, height: DINO_STAND_HEIGHT };
    return getRefinedHitbox(rect, dinoHitboxPadding);
  }
}

// --- Update resetGame for responsive ---
function resetGame() {
  gameState = 'PLAYING';
  cacti = [];
  cactusTimer = 0;
  nextCactusTime = getRandomCactusTime();
  isJumping = false;
  dino.y = getGroundTopY() - DINO_STAND_HEIGHT + GROUND_OVERLAP;
  score = 0;
  evilDaxes = [];
  nextEvilDaxScore = 1500;
  evilDaxSpawnTimer = 0;
  evilDaxNextSpawnDelay = null;
}

// Event listeners
document.addEventListener('keydown', function(event) {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    if (gameState === 'READY') {
      gameState = 'PLAYING';
    } else if (gameState === 'PLAYING' && !isJumping) {
      // Start jump if on the ground
      isJumping = true;
      jumpVelocity = INITIAL_JUMP_VELOCITY;  // Reset to initial velocity
      initialY = getGroundTopY() - DINO_STAND_HEIGHT + GROUND_OVERLAP;
    } else if (gameState === 'LOSE') {
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

function getRandomCactusTime() {
  // Return a random time between 1.4 and 3.4 seconds
  return Math.random() * 2 + 1.4;
}

// --- Helper functions for responsive positions/sizes ---
function getDinoRect(isDucking = false) {
  // Return virtual coordinates, not pixels
  const x = dino.x;
  const y = dino.y;
  const width = isDucking ? 118 : 88;
  const height = isDucking ? 56 : 94;
  return { x, y, width, height };
}

function getGroundRect() {
  const y = canvas.height - GROUND_HEIGHT_RATIO * canvas.height;
  return {
    x: 0,
    y,
    width: canvas.width,
    height: GROUND_HEIGHT_RATIO * canvas.height
  };
}

function getSkyRect() {
  return {
    x: 0,
    y: 0,
    width: canvas.width,
    height: SKY_HEIGHT_RATIO * canvas.height
  };
}

function checkAABBCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getRefinedHitbox(obj, padding, override = {}) {
  const x = (override.x !== undefined ? override.x : obj.x) + padding.left;
  const y = (override.y !== undefined ? override.y : obj.y) + padding.top;
  const width = (override.width !== undefined ? override.width : obj.width) - padding.left - padding.right;
  const height = (override.height !== undefined ? override.height : obj.height) - padding.top - padding.bottom;
  return { x, y, width, height };
}

// Helper to get the top y position of the ground in virtual coordinates
function getGroundTopY() {
  return BASE_GAME_HEIGHT - GROUND_HEIGHT_RATIO * BASE_GAME_HEIGHT;
}
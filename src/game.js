// --- Constants ---
const BASE_GAME_WIDTH = 1205;
const BASE_GAME_HEIGHT = 678;
const GROUND_HEIGHT_RATIO = 256 / BASE_GAME_HEIGHT;
const SKY_HEIGHT_RATIO = 471 / BASE_GAME_HEIGHT;
const CACTUS_HEIGHT_RATIO = 100 / BASE_GAME_HEIGHT;
const CACTUS_Y_OFFSET_RATIO = 190 / BASE_GAME_HEIGHT;
const scrollSpeedPerSecond = 240;
const SCORE_PER_SECOND = 100;
const animationInterval = 0.25;
const INITIAL_JUMP_VELOCITY = 600;
const gravity = 1000;
const GROUND_OVERLAP = 60; // px, for dino/cactus to slightly overlap ground
const EVIL_DAX_DUCKABLE_OFFSET = 0; // px, how high evil dax flies above ground
const DINO_STAND_HEIGHT = 94;
const DINO_DUCK_HEIGHT = 56;
const TARPIT_Y_OFFSET = 50; // Adjust as needed for visual alignment

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
let cactusGenerationPaused = false;
let evilDaxes = [];
let evilDaxNextSpawnDelay = null;
let evilDaxSpawnTimer = 0;
let nextEvilDaxScore = 1500;
let tarpits = [];
let goodDax = null;
let nextTarpitScore = 4500;
let tarpitActive = false;
let goodDaxUsed = false;
// --- Ride state variables ---
let isRidingDax = false;
let rideStartScore = 0;
let dinoDaxSpriteIndex = 0;
let dinoDaxAnimationTimer = 0;
let fallingDino = null;
let flyingDax = null;
let dinoDaxPos = null;

// --- Global variables for CSS size ---
let cssWidth = 0;
let cssHeight = 0;

// --- Global variables for key tracking ---
let keysDown = {};

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

// Tarpit and good dax assets
const tarpitImage = new Image();
tarpitImage.src = 'assets/tarpit.svg';
const goodDax1Image = new Image();
goodDax1Image.src = 'assets/dax1.svg';
const goodDax2Image = new Image();
goodDax2Image.src = 'assets/dax2.svg';

// Asset loading for dino-dax
const dinoDax1Image = new Image();
dinoDax1Image.src = 'assets/dino-dax1.svg';
const dinoDax2Image = new Image();
dinoDax2Image.src = 'assets/dino-dax2.svg';

// Asset loading for swag-run-title
const swagRunTitleImage = new Image();
swagRunTitleImage.src = 'assets/swag-run-title.svg';

// --- Animation state for title and text ---
let readyPulseTimer = 0;
let gameOverTimer = 0;
const SWAG_TITLE_WIDTH = 566;
const SWAG_TITLE_HEIGHT = 329;
const TITLE_SCALE_MIN = 0.92;
const TITLE_SCALE_MAX = 1.08;
const TITLE_PULSE_SPEED = 2 * Math.PI / 2; // 1 pulse per second
const SPACE_COLORS = ['#ffe600', '#ffb347', '#6ee7b7', '#60a5fa', '#f472b6'];

// --- Store all positions in virtual coordinates (base size) ---
let dino = { x: 40, y: getGroundTopY() - DINO_STAND_HEIGHT + GROUND_OVERLAP, width: 88, height: DINO_STAND_HEIGHT };
let ground = { x: 0, y: getGroundTopY(), width: BASE_GAME_WIDTH, height: 256 };
let groundClone = { x: BASE_GAME_WIDTH, y: getGroundTopY(), width: BASE_GAME_WIDTH, height: 256 };
let sky = { x: 0, y: 0, width: BASE_GAME_WIDTH, height: 471 };
let skyClone = { x: BASE_GAME_WIDTH, y: 0, width: BASE_GAME_WIDTH, height: 471 };

// --- Drawing helpers: convert virtual to pixel (using CSS size) ---
function toPxX(x) { return x * cssWidth / BASE_GAME_WIDTH; }
function toPxY(y) { return y * cssHeight / BASE_GAME_HEIGHT; }
function toPxW(w) { return w * cssWidth / BASE_GAME_WIDTH; }
function toPxH(h) { return h * cssHeight / BASE_GAME_HEIGHT; }

// --- Update resizeCanvas to store CSS size ---
function resizeCanvas() {
  const aspect = BASE_GAME_WIDTH / BASE_GAME_HEIGHT;
  // Subtract margin from available space
  const marginW = window.innerWidth * 0.10; // 5vw left + 5vw right
  const marginH = window.innerHeight * 0.10; // 5vh top + 5vh bottom
  let width = window.innerWidth - marginW;
  let height = window.innerHeight - marginH;
  if (width / height > aspect) {
    width = height * aspect;
  } else {
    height = width / aspect;
  }
  cssWidth = width;
  cssHeight = height;
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
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

  // Draw dino-dax if riding
  if (isRidingDax && dinoDaxPos) {
    const img = dinoDaxSpriteIndex === 0 ? dinoDax1Image : dinoDax2Image;
    ctx.drawImage(img, toPxX(dinoDaxPos.x), toPxY(dinoDaxPos.y), toPxW(img.width), toPxH(img.height));
  } else {
    // Draw regular dino if not riding and not falling
    if (!fallingDino) {
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
    }
    // Draw good dax if present and not riding
    if (goodDax && !isRidingDax) {
      const img = goodDax.animationIndex === 0 ? goodDax1Image : goodDax2Image;
      ctx.drawImage(
        img,
        toPxX(goodDax.x),
        toPxY(goodDax.y),
        toPxW(img.width),
        toPxH(img.height)
      );
    }
  }

  // Draw score as 7-digit zero-padded number
  ctx.fillStyle = 'yellow';
  ctx.font = `bold ${Math.floor(cssHeight * 0.07)}px Fira Mono, Consolas, 'Courier New'`;
  ctx.textAlign = 'right';
  const scoreString = Math.floor(score).toString().padStart(7, '0');
  ctx.fillText(scoreString, cssWidth - 100, 60 * (cssHeight / BASE_GAME_HEIGHT));

  // --- READY STATE: Draw swag-run-title and animated text ---
  if (gameState === 'READY') {
    // Pulse calculation
    const pulse = (Math.sin(readyPulseTimer * TITLE_PULSE_SPEED) + 1) / 2; // 0..1
    const scale = TITLE_SCALE_MIN + (TITLE_SCALE_MAX - TITLE_SCALE_MIN) * pulse;
    // Centered position
    const titleDrawWidth = SWAG_TITLE_WIDTH * scale * (cssWidth / BASE_GAME_WIDTH);
    const titleDrawHeight = SWAG_TITLE_HEIGHT * scale * (cssHeight / BASE_GAME_HEIGHT);
    const titleX = (cssWidth - titleDrawWidth) / 2;
    const titleY = (cssHeight - titleDrawHeight) / 2 - 60;
    // Only draw the image if loaded
    if (swagRunTitleImage.complete && swagRunTitleImage.naturalWidth > 0) {
      ctx.save();
      ctx.drawImage(swagRunTitleImage, titleX, titleY, titleDrawWidth, titleDrawHeight);
      ctx.restore();
    }
    // Animated 'PRESS SPACE TO START' text (always draw)
    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.floor(cssHeight * 0.065)}px 'Basic Sans', Arial, sans-serif`;
    // Color for 'SPACE'
    const colorIndex = Math.floor(pulse * (SPACE_COLORS.length - 1));
    const spaceColor = SPACE_COLORS[colorIndex];
    // Split and measure text
    const pre = 'PRESS ';
    const space = 'SPACE';
    const post = ' TO START';
    const y = titleY + titleDrawHeight + 100;
    // Measure widths
    const preWidth = ctx.measureText(pre).width;
    const spaceWidth = ctx.measureText(space).width;
    const postWidth = ctx.measureText(post).width;
    const totalWidth = preWidth + spaceWidth + postWidth;
    const startX = cssWidth / 2 - totalWidth / 2;
    // Draw 'PRESS '
    ctx.fillStyle = 'white';
    ctx.fillText(pre, startX, y);
    // Draw 'SPACE' in color
    ctx.fillStyle = spaceColor;
    ctx.fillText(space, startX + preWidth, y);
    // Draw ' TO START'
    ctx.fillStyle = 'white';
    ctx.fillText(post, startX + preWidth + spaceWidth, y);
    return; // Don't draw other overlays in READY
  }

  // --- GAME OVER STATE: Auto-return to READY after 10s ---
  if (gameState === 'LOSE') {
    gameOverTimer += 1 / 60; // Approximate, will be reset on state change
    if (gameOverTimer >= 10) {
      gameState = 'READY';
      gameOverTimer = 0;
      return;
    }
  } else {
    gameOverTimer = 0;
  }

  // Add text based on game state
  ctx.textAlign = 'center';
  if (gameState === 'READY') {
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(cssHeight * 0.065)}px 'Basic Sans', Arial, sans-serif`;
    ctx.fillText('PRESS SPACE TO START', cssWidth / 2, cssHeight / 2);
  } else if (gameState === 'LOSE') {
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(cssHeight * 0.11)}px 'Basic Sans', Arial, sans-serif`;
    ctx.fillText('GAME OVER', cssWidth / 2, cssHeight / 2 - 40 * (cssHeight / BASE_GAME_HEIGHT));
    ctx.font = `bold ${Math.floor(cssHeight * 0.05)}px 'Basic Sans', Arial, sans-serif`;
    ctx.fillText('Press space to play again', cssWidth / 2, cssHeight / 2 + 40 * (cssHeight / BASE_GAME_HEIGHT));
  }

  // Draw evil-daxes
  evilDaxes.forEach(dax => {
    const img = dax.animationIndex === 0 ? evilDax1Image : evilDax2Image;
    if (img.complete) {
      ctx.drawImage(img, toPxX(dax.x), toPxY(dax.y), toPxW(dax.width), toPxH(dax.height));
    }
  });

  // Draw tarpits
  tarpits.forEach(tarpit => {
    if (tarpitImage.complete) {
      ctx.drawImage(
        tarpitImage,
        toPxX(tarpit.x),
        toPxY(tarpit.y),
        toPxW(tarpitImage.width),
        toPxH(tarpitImage.height)
      );
    }
  });

  // Draw falling dino and flying dax as needed
  if (fallingDino) {
    ctx.drawImage(dinoStandingImage, toPxX(fallingDino.x), toPxY(fallingDino.y), toPxW(fallingDino.width), toPxH(fallingDino.height));
  }
  if (flyingDax) {
    const img = flyingDax.animationIndex === 0 ? goodDax1Image : goodDax2Image;
    ctx.drawImage(img, toPxX(flyingDax.x), toPxY(flyingDax.y), toPxW(flyingDax.width), toPxH(flyingDax.height));
  }

  // Draw score explosions
  for (const exp of scoreExplosions) {
    const t = exp.timer / exp.duration;
    const scale = 1 + 1.5 * t;
    const alpha = 1 - t;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.floor(cssHeight * 0.13)}px 'Basic Sans', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(cssWidth / 2, cssHeight / 2);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 8;
    ctx.strokeText(exp.value.toString(), 0, 0);
    ctx.fillText(exp.value.toString(), 0, 0);
    ctx.restore();
    // Draw particles
    for (const p of exp.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(cssWidth / 2 + p.x, cssHeight / 2 + p.y, p.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }
}

// --- Update update() for responsive movement ---
function update(deltaTime) {
  const effectiveSpeed = scrollSpeedPerSecond * deltaTime;
  if (window.DEBUG_SPEED) {
    console.log({
      cssWidth,
      cssHeight,
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      effectiveSpeed,
      deltaTime
    });
  }
  // --- Tarpit event logic ---
  if (gameState === 'PLAYING') {
    // Move tarpits
    for (let i = 0; i < tarpits.length; i++) {
      tarpits[i].x -= effectiveSpeed;
      // Collision with dino
      if (!isRidingDax && checkAABBCollision(getCurrentDinoHitbox(), tarpits[i])) {
        gameState = 'LOSE';
      }
      // Remove tarpit if off-canvas
      if (tarpits[i].x + tarpits[i].width < 0) {
        tarpits.splice(i, 1);
        i--;
        tarpitActive = false;
        nextTarpitScore += 4500;
        isCactusRateHalved = false;
        cactusTimer = 0;
        nextCactusTime = getRandomCactusTime();
        evilDaxNextSpawnDelay = null;
        evilDaxSpawnTimer = 0;
        // Set nextEvilDaxScore to the next future multiple of 1500
        nextEvilDaxScore = Math.ceil(score / 1500) * 1500;
        goodDaxUsed = false;
      }
    }
  }
  // Pause cactus generation 300 points before tarpit event, during tarpit, or while evilDaxNextSpawnDelay !== null
  if ((score >= nextTarpitScore - 300 && score < nextTarpitScore) || tarpitActive) {
    cactusGenerationPaused = true;
  } else if (evilDaxNextSpawnDelay !== null) {
    cactusGenerationPaused = true;
  } else {
    cactusGenerationPaused = false;
  }
  // Spawn tarpit at multiples of 4500
  if (!tarpitActive && Math.floor(score) >= nextTarpitScore) {
    tarpits.push({
      x: BASE_GAME_WIDTH,
      y: getGroundTopY() - tarpitImage.height + GROUND_OVERLAP + TARPIT_Y_OFFSET,
      width: tarpitImage.width,
      height: tarpitImage.height
    });
    tarpitActive = true;
    // Pause evil dax generation
    evilDaxNextSpawnDelay = null;
    isCactusRateHalved = false;
  }
  // Good dax spawns 200 points after tarpit event
  if (tarpitActive && !goodDax && !goodDaxUsed && Math.floor(score) >= nextTarpitScore - 4300) {
    goodDax = {
      x: -100,
      y: getGroundTopY() - 200,
      width: goodDax1Image.width,
      height: goodDax1Image.height,
      targetX: dino.x,
      hoverBaseY: getGroundTopY() - 200,
      hoverTime: 0,
      animationIndex: 0,
      animationTimer: 0
    };
    goodDaxUsed = true;
  }
  // Move good dax
  if (goodDax) {
    // Move right until above dino
    if (goodDax.x < dino.x) {
      goodDax.x += effectiveSpeed * 1.5; // Move faster than ground
      if (goodDax.x >= dino.x) {
        goodDax.x = dino.x;
      }
    } else {
      // Hover gently up and down
      goodDax.hoverTime += deltaTime;
      goodDax.y = goodDax.hoverBaseY + Math.sin(goodDax.hoverTime * 2) * 15;
    }
    // Animate wings
    goodDax.animationTimer += deltaTime;
    if (goodDax.animationTimer >= 0.2) {
      goodDax.animationTimer = 0;
      goodDax.animationIndex = goodDax.animationIndex === 0 ? 1 : 0;
    }
    // Remove good dax if tarpit is gone
    if (!tarpitActive) {
      goodDax = null;
    }
  }
  // --- Existing game logic ---
  if (gameState === 'PLAYING') {
    score += SCORE_PER_SECOND * deltaTime;
    if (isJumping) {
      const fastFallGravity = gravity * 9;
      const currentGravity = keysDown['ArrowDown'] ? fastFallGravity : gravity;
      jumpVelocity -= currentGravity * deltaTime;
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
    // Update cactus timer (skip if tarpitActive or isCactusRateHalved)
    if (!cactusGenerationPaused) {
      cactusTimer += deltaTime;
      if (cactusTimer >= nextCactusTime) {
        generateCactus();
        cactusTimer = 0;
        nextCactusTime = getRandomCactusTime();
      }
    }
    updateCacti(deltaTime, effectiveSpeed);
    // Evil-dax logic (skip if tarpitActive)
    if (!tarpitActive && score >= 1500 && Math.floor(score) >= nextEvilDaxScore) {
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
  }

  // --- Good dax collision and ride start ---
  if (!isRidingDax && goodDax && isJumping) {
    const dinoHitbox = getCurrentDinoHitbox();
    const daxHitbox = getGoodDaxHitbox();
    if (daxHitbox && checkAABBCollision(dinoHitbox, daxHitbox)) {
      isRidingDax = true;
      rideStartScore = Math.floor(score);
      dinoDaxSpriteIndex = 0;
      dinoDaxAnimationTimer = 0;
      dinoDaxPos = { x: goodDax.x, y: goodDax.y };
      isJumping = false;
      goodDax = null;
      goodDaxUsed = true;
    }
  }
  // --- Dino-dax ride logic ---
  if (isRidingDax) {
    // Double game speed
    const rideSpeedMultiplier = 2;
    // Animate dino-dax
    dinoDaxAnimationTimer += deltaTime;
    if (dinoDaxAnimationTimer >= animationInterval) {
      dinoDaxAnimationTimer = 0;
      dinoDaxSpriteIndex = dinoDaxSpriteIndex === 0 ? 1 : 0;
    }
    // Check for collisions with all obstacles
    const dinoDaxHitbox = getDinoDaxHitbox();
    for (let i = 0; i < cacti.length; i++) {
      if (checkAABBCollision(dinoDaxHitbox, getRefinedHitbox(cacti[i], cactusHitboxPadding))) {
        gameState = 'LOSE';
      }
    }
    for (let i = 0; i < evilDaxes.length; i++) {
      if (checkAABBCollision(dinoDaxHitbox, getRefinedHitbox(evilDaxes[i], evilDaxHitboxPadding))) {
        gameState = 'LOSE';
      }
    }
    for (let i = 0; i < tarpits.length; i++) {
      if (checkAABBCollision(dinoDaxHitbox, tarpits[i])) {
        gameState = 'LOSE';
      }
    }
    // End ride if down arrow pressed or score increased by 1000
    if (keysDown['ArrowDown'] || Math.floor(score) >= rideStartScore + 1000) {
      isRidingDax = false;
      dinoDaxPos = null;
      // Animate falling dino and flying dax
      fallingDino = {
        x: dinoDaxPos ? dinoDaxPos.x : dino.x,
        y: dinoDaxPos ? dinoDaxPos.y : dino.y,
        vy: 0,
        width: dino.width,
        height: dino.height
      };
      flyingDax = {
        x: dinoDaxPos ? dinoDaxPos.x : dino.x,
        y: dinoDaxPos ? dinoDaxPos.y : dino.y,
        vx: 8,
        vy: -3,
        width: goodDax1Image.width,
        height: goodDax1Image.height,
        animationIndex: 0,
        animationTimer: 0
      };
    }
  }
  // --- Animate falling dino ---
  if (fallingDino) {
    const fastFallGravity = gravity * 9;
    // Use fast gravity if down arrow is pressed
    const currentGravity = keysDown['ArrowDown'] ? fastFallGravity : gravity;
    fallingDino.vy += currentGravity * deltaTime;
    fallingDino.y += fallingDino.vy * deltaTime;
    const landingY = getGroundTopY() - DINO_STAND_HEIGHT + GROUND_OVERLAP;
    if (fallingDino.y >= landingY) {
      fallingDino.y = landingY;
      dino.y = landingY; // Ensure regular dino appears at correct position
      fallingDino = null;
      // Resume player control
    }
  }
  // --- Animate flying dax ---
  if (flyingDax) {
    flyingDax.x += flyingDax.vx;
    flyingDax.y += flyingDax.vy;
    flyingDax.animationTimer += deltaTime;
    if (flyingDax.animationTimer >= 0.2) {
      flyingDax.animationTimer = 0;
      flyingDax.animationIndex = flyingDax.animationIndex === 0 ? 1 : 0;
    }
    if (flyingDax.x > BASE_GAME_WIDTH || flyingDax.y < 0) {
      flyingDax = null;
    }
  }

  // --- Score explosion trigger ---
  const roundedScore = Math.floor(score / 1000) * 1000;
  if (score >= 1000 && roundedScore !== lastExplosionScore) {
    lastExplosionScore = roundedScore;
    // Create explosion
    const particles = [];
    for (let i = 0; i < SCORE_EXPLOSION_PARTICLES; i++) {
      const angle = (2 * Math.PI * i) / SCORE_EXPLOSION_PARTICLES;
      const speed = 180 + Math.random() * 80;
      particles.push({
        x: 0, y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: SCORE_EXPLOSION_COLORS[i % SCORE_EXPLOSION_COLORS.length],
        radius: 8 + Math.random() * 6
      });
    }
    scoreExplosions.push({
      value: roundedScore,
      timer: 0,
      duration: SCORE_EXPLOSION_DURATION,
      particles
    });
  }
  // --- Animate score explosions ---
  for (let i = scoreExplosions.length - 1; i >= 0; i--) {
    const exp = scoreExplosions[i];
    exp.timer += deltaTime;
    // Animate particles
    for (const p of exp.particles) {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.alpha -= deltaTime / exp.duration;
    }
    if (exp.timer > exp.duration) {
      scoreExplosions.splice(i, 1);
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
    if (!isRidingDax && checkAABBCollision(getCurrentDinoHitbox(), getRefinedHitbox(cactus, cactusHitboxPadding))) {
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
    if (!isRidingDax && checkAABBCollision(getCurrentDinoHitbox(), getRefinedHitbox(dax, evilDaxHitboxPadding))) {
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
  tarpits = [];
  goodDax = null;
  tarpitActive = false;
  nextTarpitScore = 4500;
  isCactusRateHalved = false;
  isRidingDax = false;
  rideStartScore = 0;
  dinoDaxSpriteIndex = 0;
  dinoDaxAnimationTimer = 0;
  fallingDino = null;
  flyingDax = null;
  dinoDaxPos = null;
  goodDaxUsed = false;
}

// Event listeners
document.addEventListener('keydown', function(event) {
  keysDown[event.code] = true;
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    if (gameState === 'READY') {
      gameState = 'PLAYING';
      isRidingDax = false;
      rideStartScore = 0;
      dinoDaxSpriteIndex = 0;
      dinoDaxAnimationTimer = 0;
      fallingDino = null;
      flyingDax = null;
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
  keysDown[event.code] = false;
  if (event.code === 'ArrowDown') {
    isDucking = false;
  }
});

// Make sure images are loaded before initializing
let assetsLoaded = 0;
const requiredAssets = 12; // Updated to include all images

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
dinoDax1Image.onload = checkAllAssetsLoaded;
dinoDax2Image.onload = checkAllAssetsLoaded;
swagRunTitleImage.onload = checkAllAssetsLoaded;

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
if (dinoDax1Image.complete) checkAllAssetsLoaded();
if (dinoDax2Image.complete) checkAllAssetsLoaded();
if (swagRunTitleImage.complete) checkAllAssetsLoaded();

// Start the game loop immediately so READY overlay is always visible
requestAnimationFrame(gameLoop);

// Game loop
window._frameCount = 0;
function gameLoop(timestamp) {
  window._frameCount++;
  if (window._frameCount % 60 === 0) {
    console.log('Frames in last second:', window._frameCount);
    window._frameCount = 0;
  }
  const deltaTime = (timestamp - lastTimestamp) / 1000; // in seconds
  lastTimestamp = timestamp;

  if (gameState === 'READY') {
    readyPulseTimer += deltaTime;
  } else {
    readyPulseTimer = 0;
  }

  update(deltaTime);  // pass deltaTime to update
  init();             // draw
  requestAnimationFrame(gameLoop);
}

// Resize canvas on load and when window resizes
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getRandomCactusTime() {
  // Return a random time between 1.4 and 3.4 seconds
  return Math.random() * 2 + 1.4;
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

function getGoodDaxHitbox() {
  if (!goodDax) return null;
  // Use natural size, add 10% padding
  const padW = goodDax.width * 0.05;
  const padH = goodDax.height * 0.05;
  return {
    x: goodDax.x - padW,
    y: goodDax.y - padH,
    width: goodDax.width + padW * 2,
    height: goodDax.height + padH * 2
  };
}

function getDinoDaxHitbox() {
  if (!dinoDaxPos) return null;
  const img = dinoDaxSpriteIndex === 0 ? dinoDax1Image : dinoDax2Image;
  const padW = img.width * 0.05;
  const padH = img.height * 0.05;
  return {
    x: dinoDaxPos.x - padW,
    y: dinoDaxPos.y - padH,
    width: img.width + padW * 2,
    height: img.height + padH * 2
  };
}

// Debug: allow setting score from console for testing
window.setScoreForTesting = function(newScore) {
  score = newScore;
};

// --- Score explosion animation state ---
let scoreExplosions = [];
const SCORE_EXPLOSION_DURATION = 1.1; // seconds
const SCORE_EXPLOSION_PARTICLES = 24;
const SCORE_EXPLOSION_COLORS = ['#ffe600', '#ffb347', '#6ee7b7', '#60a5fa', '#f472b6', '#fff', '#fbbf24'];
let lastExplosionScore = 0;
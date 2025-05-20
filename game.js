// Game canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game variables
const gameWidth = 1205;
const gameHeight = 678;
const scrollSpeed = 4; // 4px per frame scrolling speed

// Game state
let gameState = 'READY'; // 'READY' or 'PLAYING'

// Animation variables
let animationTimer = 0;
const animationInterval = 15; // Switch legs every 15 frames (approx 0.5s at 60fps)
let dinoSpriteIndex = 0;

// Jumping variables
let isJumping = false;
const jumpHeight = 200;
let jumpVelocity = 10;
const gravity = 0.5;
let initialY = 0;

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

// Game elements
// Original ground element
const ground = {
  x: 0,
  y: gameHeight - 256, // Updated ground height to 256px
  width: gameWidth,
  height: 256 // Updated ground height to 256px
};

// Clone ground element
const groundClone = {
  x: gameWidth, // Start at the right edge of the canvas
  y: gameHeight - 256,
  width: gameWidth,
  height: 256
};

// Original sky element
const sky = {
  x: 0,
  y: 0,
  width: gameWidth,
  height: 471 // Updated sky height to 471px
};

// Clone sky element
const skyClone = {
  x: gameWidth, // Start at the right edge of the canvas
  y: 0,
  width: gameWidth,
  height: 471
};

const dino = {
  x: 40, //40px right of left border
  y: gameHeight - 287, //287px above bottom border
  width: 88, // Will adjust based on image aspect ratio
  height: 94 // Will adjust based on image aspect ratio
};

// Event listeners
document.addEventListener('keydown', function(event) {
  // Check if the pressed key is the spacebar
  if (event.code === 'Space') {
    if (gameState === 'READY') {
      gameState = 'PLAYING';
    } else if (gameState === 'PLAYING' && !isJumping) {
      // Start jump if on the ground
      isJumping = true;
      jumpVelocity = 10;
      initialY = dino.y;
    }
  }
});

// Game initialization
function init() {
  // Clear the canvas
  ctx.clearRect(0, 0, gameWidth, gameHeight);
  
  // Draw background
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, gameWidth, gameHeight);
  
  // Draw sky - original and clone
  if (skyImage.complete) {
    ctx.drawImage(skyImage, sky.x, sky.y, sky.width, sky.height);
    ctx.drawImage(skyImage, skyClone.x, skyClone.y, skyClone.width, skyClone.height);
  }
  
  // Draw ground - original and clone
  if (groundImage.complete) {
    ctx.drawImage(groundImage, ground.x, ground.y, ground.width, ground.height);
    ctx.drawImage(groundImage, groundClone.x, groundClone.y, groundClone.width, groundClone.height);
  }
  
  // Draw dino
  if (dinoStandingImage.complete && dinoLeftLegImage.complete && dinoRightLegImage.complete) {
    if (gameState === 'READY' || isJumping) {
      // Use standing dino in READY state or when jumping
      ctx.drawImage(dinoStandingImage, dino.x, dino.y, dino.width, dino.height);
    } else {
      // Use animated dino in PLAYING state
      const currentDinoImage = dinoSpriteIndex === 0 ? dinoLeftLegImage : dinoRightLegImage;
      ctx.drawImage(currentDinoImage, dino.x, dino.y, dino.width, dino.height);
    }
  }
  
  // Add text based on game state
  if (gameState === 'READY') {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 45px "Basic Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS SPACE TO START', gameWidth / 2, gameHeight / 2);
  }
}

// Update game elements
function update() {
  if (gameState === 'PLAYING') {
    // Handle jumping
    if (isJumping) {
      // Apply gravity to velocity
      jumpVelocity -= gravity;
      
      // Update dino position
      dino.y -= jumpVelocity;
      
      // Check if dino has returned to the ground
      if (dino.y >= initialY) {
        dino.y = initialY;
        isJumping = false;
      }
    } else {
      // Handle animation timing
      animationTimer++;
      if (animationTimer >= animationInterval) {
        animationTimer = 0;
        dinoSpriteIndex = dinoSpriteIndex === 0 ? 1 : 0;
      }
    }
    
    // Move original ground and sky to the left
    ground.x -= scrollSpeed;
    sky.x -= scrollSpeed;
    
    // Move clone ground and sky to the left
    groundClone.x -= scrollSpeed;
    skyClone.x -= scrollSpeed;
    
    // Reset positions when elements go off-screen
    if (ground.x <= -gameWidth) {
      ground.x = groundClone.x + gameWidth;
    }
    
    if (groundClone.x <= -gameWidth) {
      groundClone.x = ground.x + gameWidth;
    }
    
    if (sky.x <= -gameWidth) {
      sky.x = skyClone.x + gameWidth;
    }
    
    if (skyClone.x <= -gameWidth) {
      skyClone.x = sky.x + gameWidth;
    }
  }
}

// Make sure images are loaded before initializing
let assetsLoaded = 0;
const requiredAssets = 5; // Updated to include dino animations

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

// In case images are already cached
if (skyImage.complete) checkAllAssetsLoaded();
if (groundImage.complete) checkAllAssetsLoaded();
if (dinoStandingImage.complete) checkAllAssetsLoaded();
if (dinoLeftLegImage.complete) checkAllAssetsLoaded();
if (dinoRightLegImage.complete) checkAllAssetsLoaded();

// Game loop
function gameLoop() {
  update(); // Update game elements
  init();   // Redraw game elements
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
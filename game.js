// Game canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game variables
const gameWidth = 1205;
const gameHeight = 678;
const scrollSpeed = 4; // 4px per frame scrolling speed

// Game state
let gameState = 'READY'; // 'READY' or 'PLAYING'

// Load game assets
const skyImage = new Image();
skyImage.src = 'assets/sky.svg';

const groundImage = new Image();
groundImage.src = 'assets/ground.svg';

const dinoImage = new Image();
dinoImage.src = 'assets/dino-standing.svg';

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
  x: 40, // Doubled from 20px to 40px from left border
  y: gameHeight - 287, // Increased by another 15px to 287px above bottom border
  width: 88, // Will adjust based on image aspect ratio
  height: 94 // Will adjust based on image aspect ratio
};

// Event listeners
document.addEventListener('keydown', function(event) {
  // Check if the pressed key is the spacebar
  if (event.code === 'Space' && gameState === 'READY') {
    gameState = 'PLAYING';
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
  if (dinoImage.complete) {
    ctx.drawImage(dinoImage, dino.x, dino.y, dino.width, dino.height);
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
    // Move original ground and sky to the left
    ground.x -= scrollSpeed;
    sky.x -= scrollSpeed;
    
    // Move clone ground and sky to the left
    groundClone.x -= scrollSpeed;
    skyClone.x -= scrollSpeed;
    
    // Reset positions when elements go off-screen
    if (ground.x <= -gameWidth) {
      ground.x = gameWidth;
    }
    
    if (groundClone.x <= -gameWidth) {
      groundClone.x = gameWidth;
    }
    
    if (sky.x <= -gameWidth) {
      sky.x = gameWidth;
    }
    
    if (skyClone.x <= -gameWidth) {
      skyClone.x = gameWidth;
    }
  }
}

// Make sure images are loaded before initializing
let assetsLoaded = 0;
const requiredAssets = 3; // Updated to include dino image

function checkAllAssetsLoaded() {
  assetsLoaded++;
  if (assetsLoaded >= requiredAssets) {
    init();
  }
}

skyImage.onload = checkAllAssetsLoaded;
groundImage.onload = checkAllAssetsLoaded;
dinoImage.onload = checkAllAssetsLoaded;

// In case images are already cached
if (skyImage.complete) checkAllAssetsLoaded();
if (groundImage.complete) checkAllAssetsLoaded();
if (dinoImage.complete) checkAllAssetsLoaded();

// Game loop
function gameLoop() {
  update(); // Update game elements
  init();   // Redraw game elements
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
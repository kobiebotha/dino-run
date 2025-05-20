// Game canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game variables
const gameWidth = 1205;
const gameHeight = 678;

// Load game assets
const skyImage = new Image();
skyImage.src = 'assets/sky.svg';

const groundImage = new Image();
groundImage.src = 'assets/ground.svg';

const dinoImage = new Image();
dinoImage.src = 'assets/dino-standing.svg';

// Game elements
const ground = {
  x: 0,
  y: gameHeight - 256, // Updated ground height to 256px
  width: gameWidth,
  height: 256 // Updated ground height to 256px
};

const sky = {
  x: 0,
  y: 0,
  width: gameWidth,
  height: 471 // Updated sky height to 471px
};

const dino = {
  x: 40, // Doubled from 20px to 40px from left border
  y: gameHeight - 287, // Increased by another 15px to 287px above bottom border
  width: 88, // Will adjust based on image aspect ratio
  height: 94 // Will adjust based on image aspect ratio
};

// Game initialization
function init() {
  // Clear the canvas
  ctx.clearRect(0, 0, gameWidth, gameHeight);
  
  // Draw background
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, gameWidth, gameHeight);
  
  // Draw sky first (behind ground on z-axis)
  if (skyImage.complete) {
    ctx.drawImage(skyImage, sky.x, sky.y, sky.width, sky.height);
  }
  
  // Draw ground second (in front of sky on z-axis)
  if (groundImage.complete) {
    ctx.drawImage(groundImage, ground.x, ground.y, ground.width, ground.height);
  }
  
  // Draw dino
  if (dinoImage.complete) {
    ctx.drawImage(dinoImage, dino.x, dino.y, dino.width, dino.height);
  }
  
  // Add text to show the game is ready
  ctx.fillStyle = 'black';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Dino Run Game - Ready to start', gameWidth / 2, gameHeight / 2);
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

// Game loop (will be implemented in future steps)
function gameLoop() {
  init(); // Redraw game elements
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
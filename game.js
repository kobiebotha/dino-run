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

// Game elements
const ground = {
  x: 0,
  y: gameHeight - 100, // Adjust based on ground image height
  width: gameWidth,
  height: 100
};

const sky = {
  x: 0,
  y: 0,
  width: gameWidth,
  height: 200 // Adjust based on sky image height
};

// Game initialization
function init() {
  // Clear the canvas
  ctx.clearRect(0, 0, gameWidth, gameHeight);
  
  // Draw background
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, gameWidth, gameHeight);
  
  // Draw sky
  if (skyImage.complete) {
    ctx.drawImage(skyImage, sky.x, sky.y, sky.width, sky.height);
  }
  
  // Draw ground
  if (groundImage.complete) {
    ctx.drawImage(groundImage, ground.x, ground.y, ground.width, ground.height);
  }
  
  // Add text to show the game is ready
  ctx.fillStyle = 'black';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Dino Run Game - Ready to start', gameWidth / 2, gameHeight / 2);
}

// Make sure images are loaded before initializing
let assetsLoaded = 0;
const requiredAssets = 2;

function checkAllAssetsLoaded() {
  assetsLoaded++;
  if (assetsLoaded >= requiredAssets) {
    init();
  }
}

skyImage.onload = checkAllAssetsLoaded;
groundImage.onload = checkAllAssetsLoaded;

// In case images are already cached
if (skyImage.complete) checkAllAssetsLoaded();
if (groundImage.complete) checkAllAssetsLoaded();

// Game loop (will be implemented in future steps)
function gameLoop() {
  init(); // Redraw game elements
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
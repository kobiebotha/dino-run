// Game canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game variables
const gameWidth = 1205;
const gameHeight = 678;

// Game initialization
function init() {
  // Clear the canvas
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  // Draw a background
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, gameWidth, gameHeight);

  // Add text to show the game is ready
  ctx.fillStyle = 'black';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Dino Run Game - Ready to start', gameWidth / 2, gameHeight / 2);
}

// Initialize the game
init();

// Game loop (will be implemented in future steps)
function gameLoop() {
  requestAnimationFrame(gameLoop);
}
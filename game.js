// Game canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game variables
const gameWidth = 1205;
const gameHeight = 678;
const scrollSpeed = 4; // 4px per frame scrolling speed

// Game state
let gameState = 'READY'; // 'READY', 'PLAYING', or 'LOSE'

// Animation variables
let animationTimer = 0;
const animationInterval = 15; // Switch legs every 15 frames (approx 0.5s at 60fps)
let dinoSpriteIndex = 0;

// Jumping variables
let isJumping = false;
const jumpHeight = 500;
let jumpVelocity = 20;
const gravity = 0.4;
let initialY = 0;

// Cactus variables
let cacti = [];
let cactusTimer = 0;
let nextCactusTime = getRandomCactusTime();

// Path data for the dino and cactus sprites
const dinoPaths = {
  standing: new Path2D('M40,30 h25 v-10 h10 v-10 h10 v-10 h-15 v5 h-5 v-5 h-5 v5 h-40 v5 h-5 v35 h5 v10 h10 v-10 h10 v-10 z'),
  leftLeg: new Path2D('M40,30 h25 v-10 h10 v-10 h10 v-10 h-15 v5 h-5 v-5 h-5 v5 h-40 v5 h-5 v35 h5 v10 h10 v-10 h10 v-10 z M25,60 v15 h-10 v10 h20 v-25 h-10 z'),
  rightLeg: new Path2D('M40,30 h25 v-10 h10 v-10 h10 v-10 h-15 v5 h-5 v-5 h-5 v5 h-40 v5 h-5 v35 h5 v10 h10 v-10 h10 v-10 z M45,60 v15 h-10 v10 h20 v-25 h-10 z'),
  dead: new Path2D('M40,30 h25 v-10 h10 v-10 h10 v-10 h-15 v5 h-5 v-5 h-5 v5 h-40 v5 h-5 v35 h5 v10 h10 v-10 h10 v-10 z M45,5 l5,5 m-10,0 l5,-5')
};

const cactusPaths = [
  // cactus1 - simple cactus
  { 
    path: new Path2D('M25,0 v50 h-15 v40 h5 v-35 h5 v35 h10 v-35 h5 v35 h5 v-40 h-15 v-50 z'),
    width: 30, 
    height: 90, 
    weight: 1.5
  },
  // cactus2 - tall single cactus
  {
    path: new Path2D('M25,0 v70 h-15 v30 h5 v-25 h5 v25 h10 v-25 h5 v25 h5 v-30 h-15 v-70 z'),
    width: 30, 
    height: 100, 
    weight: 1.5
  },
  // cactus-pair - two cacti close together
  {
    path: new Path2D('M15,20 v50 h-10 v30 h5 v-25 h5 v25 h5 v-30 h-5 v-50 z M45,0 v70 h-10 v30 h5 v-25 h5 v25 h5 v-30 h-5 v-70 z'),
    width: 60, 
    height: 100, 
    weight: 1
  },
  // cactus-trio - three cacti of different heights
  {
    path: new Path2D('M15,20 v50 h-10 v30 h5 v-25 h5 v25 h5 v-30 h-5 v-50 z M45,0 v70 h-10 v30 h5 v-25 h5 v25 h5 v-30 h-5 v-70 z M75,10 v60 h-10 v30 h5 v-25 h5 v25 h5 v-30 h-5 v-60 z'),
    width: 90, 
    height: 100, 
    weight: 1
  }
];

// Load background images
const skyImage = new Image();
skyImage.src = 'assets/sky.svg';

const groundImage = new Image();
groundImage.src = 'assets/ground.svg';

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
  height: 94, // Will adjust based on image aspect ratio
  path: dinoPaths.standing
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
      jumpVelocity = 14;
      initialY = dino.y;
    } else if (gameState === 'LOSE') {
      // Reset the game
      resetGame();
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
  
  // Draw cacti
  drawCacti();
  
  // Draw dino
  ctx.save();
  ctx.translate(dino.x, dino.y);
  
  if (gameState === 'LOSE') {
    ctx.fillStyle = '#000';
    ctx.fill(dinoPaths.dead);
  } else if (gameState === 'READY' || isJumping) {
    // Use standing dino in READY state or when jumping
    ctx.fillStyle = '#000';
    ctx.fill(dinoPaths.standing);
  } else {
    // Use animated dino in PLAYING state
    ctx.fillStyle = '#000';
    if (dinoSpriteIndex === 0) {
      ctx.fill(dinoPaths.leftLeg);
    } else {
      ctx.fill(dinoPaths.rightLeg);
    }
  }
  ctx.restore();
  
  // Add text based on game state
  if (gameState === 'READY') {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 45px "Basic Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS SPACE TO START', gameWidth / 2, gameHeight / 2);
  } else if (gameState === 'LOSE') {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 72px "Basic Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', gameWidth / 2, gameHeight / 2 - 40);
    
    ctx.font = 'bold 36px "Basic Sans", Arial, sans-serif';
    ctx.fillText('Press space to play again', gameWidth / 2, gameHeight / 2 + 40);
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
    
    // Update cactus timer
    cactusTimer++;
    if (cactusTimer >= nextCactusTime) {
      generateCactus();
      cactusTimer = 0;
      nextCactusTime = getRandomCactusTime();
    }
    
    // Update cacti positions and check for collision
    updateCacti();
  }
}

function drawCacti() {
  cacti.forEach(cactus => {
    ctx.save();
    ctx.translate(cactus.x, cactus.y);
    ctx.fillStyle = '#000';
    ctx.fill(cactus.path);
    ctx.restore();
  });
}

function generateCactus() {
  // Calculate the total weight
  const totalWeight = cactusPaths.reduce((sum, cactus) => sum + cactus.weight, 0);
  
  // Generate a random value between 0 and the total weight
  let random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  let selectedIndex = 0;
  
  // Select a cactus based on its weight
  for (let i = 0; i < cactusPaths.length; i++) {
    cumulativeWeight += cactusPaths[i].weight;
    if (random <= cumulativeWeight) {
      selectedIndex = i;
      break;
    }
  }
  
  const selectedCactus = cactusPaths[selectedIndex];
  
  // Create a new cactus
  const cactus = {
    x: gameWidth,
    y: gameHeight - 190 - selectedCactus.height,
    width: selectedCactus.width,
    height: selectedCactus.height,
    path: selectedCactus.path
  };
  
  cacti.push(cactus);
}

function updateCacti() {
  // Move cacti to the left
  for (let i = 0; i < cacti.length; i++) {
    const cactus = cacti[i];
    cactus.x -= scrollSpeed;
    
    // Check for collision with dino
    if (checkCollision(dino, cactus)) {
      gameState = 'LOSE';
    }
    
    // Remove cacti that are off screen
    if (cactus.x + cactus.width < 0) {
      cacti.splice(i, 1);
      i--;
    }
  }
}

function getRandomCactusTime() {
  // Return a random frame count between 1.4 and 3.4 seconds (at 60fps)
  return Math.floor(Math.random() * (204 - 84) + 84); // 1.4*60 = 84, 3.4*60 = 204
}

function checkCollision(dinoObj, cactusObj) {
  // Create a temporary canvas for collision detection
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  // Set size to cover both objects
  const left = Math.min(dinoObj.x, cactusObj.x);
  const top = Math.min(dinoObj.y, cactusObj.y);
  const right = Math.max(dinoObj.x + dinoObj.width, cactusObj.x + cactusObj.width);
  const bottom = Math.max(dinoObj.y + dinoObj.height, cactusObj.y + cactusObj.height);
  
  tempCanvas.width = right - left;
  tempCanvas.height = bottom - top;
  
  // Draw dino with a unique color
  tempCtx.save();
  tempCtx.translate(dinoObj.x - left, dinoObj.y - top);
  tempCtx.fillStyle = '#FF0000'; // Red for dino
  
  // Choose the right dino path based on the game state
  if (gameState === 'LOSE') {
    tempCtx.fill(dinoPaths.dead);
  } else if (gameState === 'READY' || isJumping) {
    tempCtx.fill(dinoPaths.standing);
  } else {
    if (dinoSpriteIndex === 0) {
      tempCtx.fill(dinoPaths.leftLeg);
    } else {
      tempCtx.fill(dinoPaths.rightLeg);
    }
  }
  tempCtx.restore();
  
  // Draw cactus with a unique color
  tempCtx.save();
  tempCtx.translate(cactusObj.x - left, cactusObj.y - top);
  tempCtx.fillStyle = '#00FF00'; // Green for cactus
  tempCtx.fill(cactusObj.path);
  tempCtx.restore();
  
  // Check for pixel color overlaps (collision)
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;
  
  // Check for pixels that are both red and green (collision points)
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    // If a pixel has both red and green components, we have a collision
    if (red > 200 && green > 200) {
      return true;
    }
  }
  
  return false;
}

function resetGame() {
  gameState = 'PLAYING';
  cacti = [];
  cactusTimer = 0;
  nextCactusTime = getRandomCactusTime();
  isJumping = false;
  dino.y = initialY = gameHeight - 287;
}

// Game loop
function gameLoop() {
  update(); // Update game elements
  init();   // Redraw game elements
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
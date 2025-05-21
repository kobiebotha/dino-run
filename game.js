// Game canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game variables
const baseGameWidth = 1205;
const baseGameHeight = 678;
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

// Define padding values for both objects
const dinoHitboxPadding = { top: 10, bottom: 5, left: 8, right: 8 };
const cactusHitboxPadding = { top: 5, bottom: 0, left: 12, right: 12 };

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

// Helper function to get a refined bounding box
function getRefinedHitbox(obj, padding) {
  return {
    x: obj.x + padding.left,
    y: obj.y + padding.top,
    width: obj.width - padding.left - padding.right,
    height: obj.height - padding.top - padding.bottom
  };
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
  if (dinoStandingImage.complete && dinoLeftLegImage.complete && dinoRightLegImage.complete && dinoDeadImage.complete) {
    if (gameState === 'LOSE') {
      ctx.drawImage(dinoDeadImage, dino.x, dino.y, dino.width, dino.height);
    } else if (gameState === 'READY' || isJumping) {
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
    ctx.fillText('PRESS SPACE TO START', baseGameWidth / 2, baseGameHeight / 2);
  } else if (gameState === 'LOSE') {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 72px "Basic Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', baseGameWidth / 2, baseGameHeight / 2 - 40);
    
    ctx.font = 'bold 36px "Basic Sans", Arial, sans-serif';
    ctx.fillText('Press space to play again', baseGameWidth / 2, baseGameHeight / 2 + 40);
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

function updateCacti() {
  // Move cacti to the left
  for (let i = 0; i < cacti.length; i++) {
    const cactus = cacti[i];
    cactus.x -= scrollSpeed;
    
    // Check for collision with dino using refined collision detection
    if (checkRefinedCollision(dino, dinoHitboxPadding, cactus, cactusHitboxPadding)) {
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

function resetGame() {
  gameState = 'PLAYING';
  cacti = [];
  cactusTimer = 0;
  nextCactusTime = getRandomCactusTime();
  isJumping = false;
  dino.y = initialY = baseGameHeight - 287;
}

// Make sure images are loaded before initializing
let assetsLoaded = 0;
const requiredAssets = 9; // Updated to include all images

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
cactusImages[0].img.onload = checkAllAssetsLoaded;
cactusImages[1].img.onload = checkAllAssetsLoaded;
cactusImages[2].img.onload = checkAllAssetsLoaded;
cactusImages[3].img.onload = checkAllAssetsLoaded;

// In case images are already cached
if (skyImage.complete) checkAllAssetsLoaded();
if (groundImage.complete) checkAllAssetsLoaded();
if (dinoStandingImage.complete) checkAllAssetsLoaded();
if (dinoLeftLegImage.complete) checkAllAssetsLoaded();
if (dinoRightLegImage.complete) checkAllAssetsLoaded();
if (dinoDeadImage.complete) checkAllAssetsLoaded();
if (cactusImages[0].img.complete) checkAllAssetsLoaded();
if (cactusImages[1].img.complete) checkAllAssetsLoaded();
if (cactusImages[2].img.complete) checkAllAssetsLoaded();
if (cactusImages[3].img.complete) checkAllAssetsLoaded();

// Game loop
function gameLoop() {
  update(); // Update game elements
  init();   // Redraw game elements
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
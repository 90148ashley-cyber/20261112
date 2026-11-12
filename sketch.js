// ==================== 全域變數宣告 ====================
let idleImg, walkImg, jumpImg, skillImg, effectImg;
let currentAction = 'idle'; // 'idle', 'walk', 'jump', 'skill', 'effect'

let currentFrame = 0;
let frameInterval = 6;   // 控制動畫播放速度（數值越大越慢）
let frameCounter = 0;

// 精靈圖設定（包含總寬、總高、總格數）
const sheets = {
  idle:   { w: 1663, h: 212, frames: 12 },
  walk:   { w: 1246, h: 198, frames: 9 },
  jump:   { w: 1228, h: 188, frames: 9 },   
  skill:  { w: 1039, h: 146, frames: 4 },   // 招數：4張，尺寸 1039 * 146
  effect: { w: 740,  h: 19,  frames: 5 }    // 招數特效：5張，尺寸 740 * 19
};

let charX = 0;
let charY = 0;
let moveDirection = 1; // 1 代表朝右，-1 代表朝左
let walkSpeed = 4;
let isMoving = false;

// 跳躍物理變數
let isJumping = false;
let velocityY = 0;
let gravity = 0.6;
let jumpStrength = -12;
let groundY = 0;

function preload() {
  idleImg = loadImage('1/暫停/暫停.png');
  walkImg = loadImage('1/走/走.png');
  jumpImg = loadImage('1/跳/跳.png', () => {}, () => { console.log("跳躍圖片載入失敗"); });
  skillImg = loadImage('1/招數/招數.png', () => {}, () => { console.log("招數圖片載入失敗"); });
  effectImg = loadImage('1/招數特效/招數特效.png', () => {}, () => { console.log("特效圖片載入失敗"); });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  
  let targetHeight = height / 3;
  let singleFrameHeight = sheets.idle.h;
  let aspectRatio = (sheets.idle.w / sheets.idle.frames) / singleFrameHeight;
  let targetWidth = targetHeight * aspectRatio;
  
  charX = (width * 2 / 3) - (targetWidth / 2);
  groundY = height - targetHeight;
  charY = groundY;
}

function draw() {
  background(135, 206, 235); // 天空色背景

  // 1. 移動邏輯（左右鍵持續移動，直到碰到邊界）
  if (isMoving) {
    charX += walkSpeed * moveDirection;
    
    let targetHeight = height / 3;
    let currentConfig = sheets[currentAction];
    let singleFWidth = currentConfig.w / currentConfig.frames;
    let targetWidth = targetHeight * (singleFWidth / currentConfig.h);

    if (charX + targetWidth >= width) {
      charX = width - targetWidth;
      isMoving = false;
    }
    if (charX <= 0) {
      charX = 0;
      isMoving = false;
    }
  }

  // 2. 跳躍物理邏輯
  if (isJumping) {
    charY += velocityY;
    velocityY += gravity;
    if (charY >= groundY) {
      charY = groundY;
      isJumping = false;
      velocityY = 0;
      if (currentAction === 'jump') {
        currentAction = 'idle';
        currentFrame = 0;
      }
    }
  }

  // 3. 動畫影格與播放狀態更新
  frameCounter++;
  if (frameCounter >= frameInterval) {
    currentFrame++;
    frameCounter = 0;

    let config = sheets[currentAction];
    
    // 單次播放動作處理（跳躍、招數、特效）
    if (currentAction === 'jump' || currentAction === 'skill' || currentAction === 'effect') {
      if (currentFrame >= config.frames) {
        if (currentAction === 'skill') {
          // 招數播完後，接著播招數特效
          currentAction = 'effect';
          currentFrame = 0;
        } else if (currentAction === 'effect') {
          // 特效播完後，切回暫停狀態
          currentAction = 'idle';
          currentFrame = 0;
        } else if (currentAction === 'jump') {
          // 跳躍播完後停在最後一格，直到落地
          currentFrame = config.frames - 1;
        }
      }
    } else {
      // 循環播放動作（暫停、走路）
      currentFrame = currentFrame % config.frames;
    }
  }

  // 4. 繪製角色
  drawSprite();
}

/**
 * 繪製角色的專用函式（支援 RWD 縮放與左右鏡射翻轉）
 */
function drawSprite() {
  push();
  
  let targetHeight = height / 3;
  let config = sheets[currentAction];
  
  let singleFrameWidth = config.w / config.frames;
  let singleFrameHeight = config.h;
  let targetWidth = targetHeight * (singleFrameWidth / singleFrameHeight);

  // 安全防呆：確保影格不超出範圍
  let safeFrame = constrain(currentFrame, 0, config.frames - 1);
  let sx = safeFrame * singleFrameWidth;
  let sy = 0;

  // 如果是走路且朝左，進行水平鏡射
  if (moveDirection === -1 && currentAction === 'walk') {
    translate(charX + targetWidth, charY);
    scale(-1, 1);
    image(walkImg, 0, 0, targetWidth, targetHeight, sx, sy, singleFrameWidth, singleFrameHeight);
  } else {
    // 依當前動作選擇對應的圖片精靈
    let imgToDraw = idleImg;
    if (currentAction === 'walk') imgToDraw = walkImg;
    else if (currentAction === 'jump') imgToDraw = jumpImg;
    else if (currentAction === 'skill') imgToDraw = skillImg;
    else if (currentAction === 'effect') imgToDraw = effectImg;

    image(imgToDraw, charX, charY, targetWidth, targetHeight, sx, sy, singleFrameWidth, singleFrameHeight);
  }
  
  pop();
}

/**
 * 鍵盤按下事件
 */
function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    moveDirection = 1;
    isMoving = true;
    if (currentAction !== 'jump' && currentAction !== 'skill' && currentAction !== 'effect') {
      currentAction = 'walk';
      currentFrame = 0;
    }
  } else if (keyCode === LEFT_ARROW) {
    moveDirection = -1;
    isMoving = true;
    if (currentAction !== 'jump' && currentAction !== 'skill' && currentAction !== 'effect') {
      currentAction = 'walk';
      currentFrame = 0;
    }
  } else if (keyCode === UP_ARROW) {
    if (!isJumping) {
      isJumping = true;
      velocityY = jumpStrength;
      currentAction = 'jump';
      currentFrame = 0;
    }
  } else if (key === ' ') {
    currentAction = 'skill';
    currentFrame = 0;
  }
}

/**
 * 鍵盤放開事件
 */
function keyReleased() {
  if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) {
    isMoving = false;
    if (currentAction === 'walk') {
      currentAction = 'idle';
      currentFrame = 0;
    }
  }
}

/**
 * 視窗大小改變時自動適應全螢幕
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let targetHeight = height / 3;
  groundY = height - targetHeight;
  if (!isJumping) {
    charY = groundY;
  }
}
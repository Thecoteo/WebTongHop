const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');

// Kích thước ô
const gridSize = 30;
const tileCount = canvas.width / gridSize;

// Biến trò chơi
let snake = [{ x: 10, y: 10 }];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gamePaused = false;
let gameSpeed = 150;
let animationId;

// Biến cho chuyển động mượt
let snakePositions = [];
let animationProgress = 0;
let lastRenderTime = 0;
const frameTime = 1000 / 60; // 60 FPS

// Hiển thị điểm cao
highScoreElement.textContent = highScore;

// Tạo mồi ngẫu nhiên
function randomFood() {
    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// Tính toán vị trí nội suy cho chuyển động mượt
function interpolatePosition(current, target, progress) {
    return {
        x: current.x + (target.x - current.x) * progress,
        y: current.y + (target.y - current.y) * progress
    };
}

// Vẽ trò chơi với animation mượt
function drawGame() {
    // Xóa canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ lưới (tùy chọn)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Vẽ rắn với animation mượt
    snake.forEach((segment, index) => {
        let drawX = segment.x * gridSize;
        let drawY = segment.y * gridSize;

        // Áp dụng animation mượt
        if (snakePositions[index] && animationProgress < 1) {
            const interpolated = interpolatePosition(
                snakePositions[index],
                { x: drawX, y: drawY },
                animationProgress
            );
            drawX = interpolated.x;
            drawY = interpolated.y;
        }

        if (index === 0) {
            // Đầu rắn với gradient
            const gradient = ctx.createLinearGradient(drawX, drawY, drawX + gridSize, drawY + gridSize);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#ff5252');
            ctx.fillStyle = gradient;
            
            // Vẽ đầu rắn bo tròn
            ctx.beginPath();
            ctx.roundRect(drawX + 2, drawY + 2, gridSize - 4, gridSize - 4, 4);
            ctx.fill();
            
            // Vẽ mắt với hiệu ứng
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(drawX + 6, drawY + 6, 2, 0, 2 * Math.PI);
            ctx.arc(drawX + 14, drawY + 6, 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Vẽ pupil
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(drawX + 6, drawY + 6, 1, 0, 2 * Math.PI);
            ctx.arc(drawX + 14, drawY + 6, 1, 0, 2 * Math.PI);
            ctx.fill();
            
            // Vẽ highlight mắt
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(drawX + 6.5, drawY + 5.5, 0.5, 0, 2 * Math.PI);
            ctx.arc(drawX + 14.5, drawY + 5.5, 0.5, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // Thân rắn với gradient động
            const hue = (180 + index * 10 + Date.now() * 0.1) % 360;
            const gradient = ctx.createLinearGradient(drawX, drawY, drawX + gridSize, drawY + gridSize);
            gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
            gradient.addColorStop(1, `hsl(${hue}, 70%, 40%)`);
            ctx.fillStyle = gradient;
            
            // Vẽ thân bo tròn
            ctx.beginPath();
            ctx.roundRect(drawX + 2, drawY + 2, gridSize - 4, gridSize - 4, 3);
            ctx.fill();
            
            // Vẽ highlight
            ctx.fillStyle = `hsla(${hue}, 70%, 80%, 0.3)`;
            ctx.beginPath();
            ctx.roundRect(drawX + 3, drawY + 3, gridSize - 6, gridSize - 6, 2);
            ctx.fill();
        }
    });

    // Vẽ mồi với hiệu ứng nhấp nháy
    const foodPulse = Math.sin(Date.now() * 0.008) * 0.1 + 0.9;
    const foodSize = (gridSize / 2 - 2) * foodPulse;
    
    // Vẽ shadow cho mồi
    ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2 + 1,
        food.y * gridSize + gridSize / 2 + 1,
        foodSize + 2,
        0,
        2 * Math.PI
    );
    ctx.fill();
    
    // Vẽ mồi chính
    const foodGradient = ctx.createRadialGradient(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        0,
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        foodSize
    );
    foodGradient.addColorStop(0, '#ff6b6b');
    foodGradient.addColorStop(0.7, '#ff5252');
    foodGradient.addColorStop(1, '#d32f2f');
    
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        foodSize,
        0,
        2 * Math.PI
    );
    ctx.fill();

    // Vẽ highlight cho mồi
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2 - 2,
        food.y * gridSize + gridSize / 2 - 2,
        foodSize * 0.3,
        0,
        2 * Math.PI
    );
    ctx.fill();
}

// Cập nhật vị trí cho animation mượt
function updateSnakePositions() {
    snakePositions = snake.map(segment => ({
        x: segment.x * gridSize,
        y: segment.y * gridSize
    }));
}

// Di chuyển rắn
function moveSnake() {
    if (gamePaused || (dx === 0 && dy === 0)) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Kiểm tra va chạm với tường
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Kiểm tra va chạm với thân
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    // Lưu vị trí cũ cho animation
    updateSnakePositions();

    snake.unshift(head);

    // Kiểm tra ăn mồi
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        // Hiệu ứng tăng điểm
        scoreElement.parentElement.classList.add('score-animate');
        setTimeout(() => {
            scoreElement.parentElement.classList.remove('score-animate');
        }, 300);
        
        randomFood();
        
        // Tăng tốc độ dần
        if (gameSpeed > 80) {
            gameSpeed = Math.max(80, gameSpeed - 2);
        }
        
        // Kiểm tra điểm cao
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
    } else {
        snake.pop();
    }

    // Reset animation progress
    animationProgress = 0;
}

// Game over
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';
    
    // Hiệu ứng rung canvas
    canvas.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        canvas.style.animation = '';
    }, 500);
}

// Khởi động lại game
function restartGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    gameSpeed = 150;
    scoreElement.textContent = score;
    randomFood();
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    gamePaused = false;
    animationProgress = 0;
    snakePositions = [];
    updateSnakePositions();
    
    // Reset nút pause
    document.querySelector('.pause-btn').textContent = '⏸️ Tạm dừng';
}

// Tạm dừng/tiếp tục
function togglePause() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        document.querySelector('.pause-btn').textContent = gamePaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
    }
}

// Vòng lặp game với animation mượt
function gameLoop(currentTime) {
    // Tính toán thời gian delta
    const deltaTime = currentTime - lastRenderTime;
    
    if (deltaTime >= frameTime) {
        if (gameRunning) {
            // Cập nhật animation progress
            animationProgress = Math.min(1, animationProgress + deltaTime / gameSpeed);
            
            // Di chuyển rắn khi animation hoàn thành
            if (animationProgress >= 1) {
                moveSnake();
            }
            
            drawGame();
        }
        lastRenderTime = currentTime;
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Điều khiển bàn phím
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    // Ngăn chặn cuộn trang
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    // Nếu rắn chưa bắt đầu di chuyển, cho phép di chuyển đầu tiên
    if (dx === 0 && dy === 0) {
        switch(e.key) {
            case 'ArrowUp':
                dx = 0;
                dy = -1;
                break;
            case 'ArrowDown':
                dx = 0;
                dy = 1;
                break;
            case 'ArrowLeft':
                dx = -1;
                dy = 0;
                break;
            case 'ArrowRight':
                dx = 1;
                dy = 0;
                break;
        }
        return;
    }

    if (gamePaused) return;

    switch(e.key) {
        case 'ArrowUp':
            if (dy !== 1) {
                dx = 0;
                dy = -1;
            }
            break;
        case 'ArrowDown':
            if (dy !== -1) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (dx !== 1) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'ArrowRight':
            if (dx !== -1) {
                dx = 1;
                dy = 0;
            }
            break;
        case ' ':
            togglePause();
            break;
    }
});

// Điều khiển cảm ứng cho mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!gameRunning || gamePaused) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Kiểm tra ngưỡng vuốt tối thiểu
    if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) return;

    // Nếu rắn chưa di chuyển
    if (dx === 0 && dy === 0) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
            dx = diffX > 0 ? -1 : 1;
            dy = 0;
        } else {
            dx = 0;
            dy = diffY > 0 ? -1 : 1;
        }
        return;
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Vuốt ngang
        if (diffX > 0 && dx !== 1) {
            dx = -1;
            dy = 0;
        } else if (diffX < 0 && dx !== -1) {
            dx = 1;
            dy = 0;
        }
    } else {
        // Vuốt dọc
        if (diffY > 0 && dy !== 1) {
            dx = 0;
            dy = -1;
        } else if (diffY < 0 && dy !== -1) {
            dx = 0;
            dy = 1;
        }
    }
});

// Thêm fallback cho roundRect nếu không được hỗ trợ
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.arcTo(x + width, y, x + width, y + radius, radius);
        this.lineTo(x + width, y + height - radius);
        this.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        this.lineTo(x + radius, y + height);
        this.arcTo(x, y + height, x, y + height - radius, radius);
        this.lineTo(x, y + radius);
        this.arcTo(x, y, x + radius, y, radius);
        this.closePath();
    };
}

// Khởi tạo game
function initGame() {
    randomFood();
    updateSnakePositions();
    drawGame();
    gameRunning = true;
    gamePaused = false;
    requestAnimationFrame(gameLoop);
}

// Bắt đầu game
initGame();
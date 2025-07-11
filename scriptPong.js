const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const paddleWidth = 12, paddleHeight = 80;
const ballSize = 14;
const speed = 5;
let leftY = canvas.height/2 - paddleHeight/2;
let rightY = canvas.height/2 - paddleHeight/2;
let leftScore = 0, rightScore = 0;
let ballX = canvas.width/2 - ballSize/2;
let ballY = canvas.height/2 - ballSize/2;
let ballSpeedX = speed, ballSpeedY = speed * (Math.random() > 0.5 ? 1 : -1);
let upPressed = false, downPressed = false, wPressed = false, sPressed = false;
// PARTICLES BACKGROUND
const bgCanvas = document.getElementById('bg-particles');
const bgCtx = bgCanvas.getContext('2d');
let particles = Array.from({length: 48}, () => ({
    x: Math.random()*bgCanvas.width,
    y: Math.random()*bgCanvas.height,
    r: 1.5+Math.random()*2.5,
    dx: (Math.random()-0.5)*0.6,
    dy: (Math.random()-0.5)*0.6,
    alpha: 0.3+Math.random()*0.7
}));
function drawParticles() {
    bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
    for(const p of particles) {
        bgCtx.save();
        bgCtx.globalAlpha = p.alpha;
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        bgCtx.closePath();
        bgCtx.fillStyle = 'rgba(0,255,255,0.7)';
        bgCtx.shadowColor = '#00ffe0';
        bgCtx.shadowBlur = 12;
        bgCtx.fill();
        bgCtx.restore();
        p.x += p.dx; p.y += p.dy;
        if(p.x<0||p.x>bgCanvas.width) p.dx*=-1;
        if(p.y<0||p.y>bgCanvas.height) p.dy*=-1;
    }
    requestAnimationFrame(drawParticles);
}
drawParticles();
// BALL TRAIL
let ballTrail = [];
function drawBallTrail() {
    for(let i=ballTrail.length-1;i>=0;i--) {
        let t = ballTrail[i];
        let alpha = (i+1)/ballTrail.length*0.25;
        drawCircle(t.x+ballSize/2, t.y+ballSize/2, ballSize/2+2, '#00bfff', `rgba(0,191,255,${alpha})`);
    }
}
function drawCircle(x, y, r, color, shadowColor) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = shadowColor || 'transparent';
    ctx.shadowBlur = shadowColor ? 18 : 0;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
// SCORE BOUNCE
let scoreBounceL = 0, scoreBounceR = 0;
function drawText(text, x, y, bounce=0) {
    ctx.save();
    ctx.font = 'bold 36px Orbitron, Segoe UI, Arial';
    ctx.shadowColor = '#00ffe0';
    ctx.shadowBlur = 18;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.translate(x, y-bounce);
    ctx.scale(1, 1+bounce/18);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}
// WIN POPUP & FIREWORKS
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popup-title');
const restartBtn = document.getElementById('restart-btn');
const fireworksDiv = document.getElementById('fireworks');
function showPopup(winner) {
    popupTitle.textContent = winner + ' thắng!';
    popup.style.display = 'block';
    launchFireworks();
}
function hidePopup() {
    popup.style.display = 'none';
    fireworksDiv.innerHTML = '';
}
restartBtn.onclick = function() {
    leftScore = 0; rightScore = 0; hidePopup();
};
// FIREWORKS EFFECT
function launchFireworks() {
    fireworksDiv.innerHTML = '';
    for(let i=0;i<8;i++) {
        let f = document.createElement('div');
        f.style.position = 'absolute';
        f.style.left = (40+Math.random()*20)+'%';
        f.style.top = (30+Math.random()*40)+'%';
        f.style.width = f.style.height = '8px';
        f.style.borderRadius = '50%';
        f.style.background = `linear-gradient(90deg,#00ffe0,#ffb300,#00bfff)`;
        f.style.boxShadow = '0 0 24px 8px #00ffe0cc';
        f.style.opacity = 0.8;
        f.animate([
            {transform:'scale(1)',opacity:1},
            {transform:`scale(${2+Math.random()*2})`,opacity:0}
        ],{duration:900+Math.random()*400,fill:'forwards'});
        fireworksDiv.appendChild(f);
    }
}
// PADDLE SHAKE
let shakeL = 0, shakeR = 0;
function drawRect(x, y, w, h, color, shadowColor, shake=0) {
    ctx.save();
    ctx.translate(shake?((Math.random()-0.5)*shake):0, shake?((Math.random()-0.5)*shake):0);
    ctx.fillStyle = color;
    ctx.shadowColor = shadowColor || 'transparent';
    ctx.shadowBlur = shadowColor ? 18 : 0;
    ctx.beginPath();
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + w - 8, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + 8);
    ctx.lineTo(x + w, y + h - 8);
    ctx.quadraticCurveTo(x + w, y + h, x + w - 8, y + h);
    ctx.lineTo(x + 8, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - 8);
    ctx.lineTo(x, y + 8);
    ctx.quadraticCurveTo(x, y, x + 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
// SOUND EFFECTS
const hitSound = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b9b6b2.mp3');
const scoreSound = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b9b6b2.mp3');
const winSound = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b9b6b2.mp3');
let lastHit = null;
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRect(0, 0, canvas.width, canvas.height, '#181818');
    // Lưới giữa
    ctx.save();
    ctx.strokeStyle = '#fff3';
    ctx.setLineDash([16, 18]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // Paddle
    let leftGlow = lastHit==='left' ? ctx.createLinearGradient(0, leftY, paddleWidth, leftY+paddleHeight) : null;
    if(leftGlow) { leftGlow.addColorStop(0, '#00ffe0'); leftGlow.addColorStop(1, '#00bfff'); }
    let rightGlow = lastHit==='right' ? ctx.createLinearGradient(canvas.width-paddleWidth, rightY, canvas.width, rightY+paddleHeight) : null;
    if(rightGlow) { rightGlow.addColorStop(0, '#ffb300'); rightGlow.addColorStop(1, '#fff200'); }
    drawRect(0, leftY, paddleWidth, paddleHeight, '#fff', leftGlow||'#00ffe0', shakeL);
    drawRect(canvas.width-paddleWidth, rightY, paddleWidth, paddleHeight, '#fff', rightGlow||'#ffb300', shakeR);
    // Ball trail
    drawBallTrail();
    // Bóng
    let ballGlow = ctx.createRadialGradient(ballX+ballSize/2, ballY+ballSize/2, 2, ballX+ballSize/2, ballY+ballSize/2, ballSize);
    ballGlow.addColorStop(0, '#fff');
    ballGlow.addColorStop(0.5, '#00bfffcc');
    ballGlow.addColorStop(1, 'transparent');
    drawCircle(ballX+ballSize/2, ballY+ballSize/2, ballSize/2, '#fff', ballGlow);
    // Điểm số
    drawText(leftScore, canvas.width/4, 54, scoreBounceL);
    drawText(rightScore, 3*canvas.width/4, 54, scoreBounceR);
}
function resetBall() {
    ballX = canvas.width/2 - ballSize/2;
    ballY = canvas.height/2 - ballSize/2;
    ballSpeedX = speed * (Math.random() > 0.5 ? 1 : -1);
    ballSpeedY = speed * (Math.random() > 0.5 ? 1 : -1);
    if (ballSpeedY === 0) ballSpeedY = speed;
}
function update() {
    // Paddle di chuyển
    if(wPressed && leftY > 0) leftY -= speed;
    if(sPressed && leftY < canvas.height - paddleHeight) leftY += speed;
    if(upPressed && rightY > 0) rightY -= speed;
    if(downPressed && rightY < canvas.height - paddleHeight) rightY += speed;
    // Bóng di chuyển
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    // Ball trail update
    ballTrail.push({x: ballX, y: ballY});
    if(ballTrail.length > 12) ballTrail.shift();
    // Bóng chạm trên/dưới
    if(ballY <= 0 || ballY + ballSize >= canvas.height) {
        if (ballSpeedY === 0 || isNaN(ballSpeedY)) {
            ballSpeedY = speed * (Math.random() > 0.5 ? 1 : -1);
        } else {
            ballSpeedY = -ballSpeedY;
        }
    }
    // Bóng chạm paddle trái
    if(ballX <= paddleWidth && ballY + ballSize > leftY && ballY < leftY + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        let deltaY = ballY + ballSize/2 - (leftY + paddleHeight/2);
        ballSpeedY = deltaY * 0.2;
        if (Math.abs(ballSpeedY) < 1 || isNaN(ballSpeedY)) {
            ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * speed;
        }
        lastHit = 'left';
        shakeL = 8;
        try { hitSound.currentTime = 0; hitSound.play(); } catch(e){}
    }
    // Bóng chạm paddle phải
    if(ballX + ballSize >= canvas.width - paddleWidth && ballY + ballSize > rightY && ballY < rightY + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        let deltaY = ballY + ballSize/2 - (rightY + paddleHeight/2);
        ballSpeedY = deltaY * 0.2;
        if (Math.abs(ballSpeedY) < 1 || isNaN(ballSpeedY)) {
            ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * speed;
        }
        lastHit = 'right';
        shakeR = 8;
        try { hitSound.currentTime = 0; hitSound.play(); } catch(e){}
    }
    // Nếu ballSpeedY bị 0 ở bất kỳ đâu, random lại hướng
    if (ballSpeedY === 0 || isNaN(ballSpeedY)) {
        ballSpeedY = speed * (Math.random() > 0.5 ? 1 : -1);
    }
    // Ghi điểm
    if(ballX < 0) {
        rightScore++;
        scoreBounceR = 18;
        try { scoreSound.currentTime = 0; scoreSound.play(); } catch(e){}
        resetBall();
    }
    if(ballX + ballSize > canvas.width) {
        leftScore++;
        scoreBounceL = 18;
        try { scoreSound.currentTime = 0; scoreSound.play(); } catch(e){}
        resetBall();
    }
    // Paddle shake giảm dần
    if(shakeL>0) shakeL -= 1.2; else shakeL = 0;
    if(shakeR>0) shakeR -= 1.2; else shakeR = 0;
    // Score bounce giảm dần
    if(scoreBounceL>0) scoreBounceL -= 1.5; else scoreBounceL = 0;
    if(scoreBounceR>0) scoreBounceR -= 1.5; else scoreBounceR = 0;
    // Kiểm tra thắng
    if(leftScore>=10) { showPopup('Người 1'); try { winSound.currentTime=0; winSound.play(); } catch(e){} }
    if(rightScore>=10) { showPopup('Người 2'); try { winSound.currentTime=0; winSound.play(); } catch(e){} }
}
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
document.addEventListener('keydown', e => {
    if(e.key === 'w' || e.key === 'W') wPressed = true;
    if(e.key === 's' || e.key === 'S') sPressed = true;
    if(e.key === 'ArrowUp') upPressed = true;
    if(e.key === 'ArrowDown') downPressed = true;
});
document.addEventListener('keyup', e => {
    if(e.key === 'w' || e.key === 'W') wPressed = false;
    if(e.key === 's' || e.key === 'S') sPressed = false;
    if(e.key === 'ArrowUp') upPressed = false;
    if(e.key === 'ArrowDown') downPressed = false;
});
gameLoop();

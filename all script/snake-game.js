/**
 * ==========================================================================
 * FILE: snake-game.js
 * GAME: NEON SNAKE MATRIX (GAME OVER TEXT & LAYOUT FIXED)
 * ==========================================================================
 */

(function () {
    let canvas, ctx;
    let gameActive = false;
    let isGameOver = false; // Tracking game over state
    let score = 0;
    let highScore = 0;
    let gameIntervalId = null;

    const gridSize = 20; 
    let tileCountX, tileCountY;
    let snake = [];
    let food = { x: 0, y: 0 };
    let dx = gridSize; 
    let dy = 0;        

    let touchStartX = 0;
    let touchStartY = 0;

    // Trigger capture to open game modal
    document.addEventListener('click', function(e) {
        let target = e.target;
        if (target && (target.tagName === 'BUTTON' || target.classList.contains('btn-play'))) {
            let parentCard = target.closest('.game-card') || target.closest('.card') || target.parentElement;
            if (parentCard) {
                let cardText = parentCard.innerText || parentCard.innerHTML;
                if (cardText.toUpperCase().includes('SNAKE')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setupSnakeModal();
                }
            }
        }
    }, true);

    function setupSnakeModal() {
        if (document.getElementById('snake-game-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'snake-game-modal';
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100vw', height: '100vh',
            background: 'rgba(5, 5, 8, 0.98)',
            backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)',
            zIndex: '9999', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Orbitron', sans-serif",
            userSelect: 'none', padding: '5px', boxSizing: 'border-box'
        });

        modal.innerHTML = `
            <div style="position: absolute; top: 15px; right: 25px; color: #fff; cursor: pointer; font-size: 2rem; font-weight:bold; z-index: 10000; padding: 10px;" id="close-snake-btn">×</div>
            <div style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 2px; text-shadow: 0 0 8px #39ff14; text-align:center;">NEON SNAKE MATRIX</div>
            <div style="color: #8a8a9e; font-size: 0.65rem; margin-bottom: 12px; text-align:center; letter-spacing:0.5px;">SWIPE ANYWHERE ON CANVAS TO CONTROL THE SNAKE</div>
            
            <div style="display: flex; justify-content: space-between; width: 320px; margin-bottom: 6px; font-size: 0.75rem; font-weight: 700; color: #8a8a9e; padding: 0 4px;">
                <div>SCORE: <span id="snake-score" style="color: #39ff14;">0</span></div>
                <div>BEST: <span id="snake-high" style="color: #00f0ff;">0</span></div>
            </div>

            <div style="position: relative; border: 2px solid rgba(57, 255, 20, 0.3); border-radius: 14px; background: #050508; overflow: hidden; z-index: 10001;" id="canvas-container">
                <canvas id="snake-canvas" width="320" height="360" style="display: block; background: #050508;"></canvas>
            </div>
            
            <button id="snake-restart-btn" style="margin-top: 20px; background: #0a170c; border: 1px solid #39ff14; color: #39ff14; font-family: inherit; font-size: 0.85rem; font-weight: 700; padding: 12px 28px; border-radius: 6px; cursor: pointer; display: none; box-shadow: 0 0 12px rgba(57,255,20,0.3); z-index: 10005; position: relative;">RESTART GRID</button>
        `;

        document.body.appendChild(modal);

        canvas = document.getElementById('snake-canvas');
        ctx = canvas.getContext('2d');

        tileCountX = canvas.width / gridSize;
        tileCountY = canvas.height / gridSize;

        document.getElementById('close-snake-btn').addEventListener('click', destroyGame);
        
        const restartBtn = document.getElementById('snake-restart-btn');
        
        // Restart logic handlers
        const triggerRestart = function(e) {
            e.preventDefault();
            e.stopPropagation();
            restartGame();
        };

        restartBtn.addEventListener('click', triggerRestart);
        restartBtn.addEventListener('touchstart', triggerRestart);

        // Canvas swipe & click to restart tracking
        canvas.addEventListener('touchstart', function (e) {
            if (isGameOver) {
                triggerRestart(e);
                return;
            }
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        canvas.addEventListener('touchmove', function (e) {
            if (!gameActive) return;
            e.preventDefault(); 
            
            let touchEndX = e.touches[0].clientX;
            let touchEndY = e.touches[0].clientY;

            let xDiff = touchEndX - touchStartX;
            let yDiff = touchEndY - touchStartY;

            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                if (Math.abs(xDiff) > 15) { 
                    if (xDiff > 0 && dx === 0) { dx = gridSize; dy = 0; } 
                    else if (xDiff < 0 && dx === 0) { dx = -gridSize; dy = 0; } 
                }
            } else {
                if (Math.abs(yDiff) > 15) {
                    if (yDiff > 0 && dy === 0) { dx = 0; dy = gridSize; } 
                    else if (yDiff < 0 && dy === 0) { dx = 0; dy = -gridSize; } 
                }
            }
        }, { passive: false });

        window.addEventListener('keydown', handleKeyDown);

        restartGame();
    }

    function restartGame() {
        score = 0;
        dx = gridSize;
        dy = 0;
        isGameOver = false;
        snake = [
            { x: gridSize * 3, y: gridSize * 5 },
            { x: gridSize * 2, y: gridSize * 5 },
            { x: gridSize * 1, y: gridSize * 5 }
        ];
        
        document.getElementById('snake-score').innerText = score;
        document.getElementById('snake-restart-btn').style.display = 'none';
        
        spawnFood();
        if (gameIntervalId) clearInterval(gameIntervalId);
        gameActive = true;
        gameIntervalId = setInterval(gameLoop, 130); 
    }

    function spawnFood() {
        food.x = Math.floor(Math.random() * tileCountX) * gridSize;
        food.y = Math.floor(Math.random() * tileCountY) * gridSize;
        
        for (let cell of snake) {
            if (cell.x === food.x && cell.y === food.y) {
                spawnFood();
                break;
            }
        }
    }

    function gameLoop() {
        if (!gameActive) return;

        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
            gameOver();
            return;
        }

        for (let cell of snake) {
            if (head.x === cell.x && head.y === cell.y) {
                gameOver();
                return;
            }
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            document.getElementById('snake-score').innerText = score;
            if (score > highScore) {
                highScore = score;
                document.getElementById('snake-high').innerText = highScore;
            }
            spawnFood();
        } else {
            snake.pop();
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Matrix background grid lines
        ctx.strokeStyle = "rgba(57, 255, 20, 0.02)"; ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += gridSize) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        }
        for (let j = 0; j < canvas.height; j += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
        }

        // Draw Food
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 8;
        ctx.fillRect(food.x + 2, food.y + 2, gridSize - 4, gridSize - 4);

        // Draw Snake
        ctx.shadowColor = '#39ff14';
        snake.forEach((cell, idx) => {
            ctx.fillStyle = idx === 0 ? '#ffffff' : '#39ff14';
            ctx.shadowBlur = idx === 0 ? 12 : 6;
            ctx.fillRect(cell.x + 1, cell.y + 1, gridSize - 2, gridSize - 2);
        });
        
        ctx.shadowBlur = 0;
    }

    function handleKeyDown(e) {
        if (!gameActive) return;
        if (e.key === "ArrowLeft" && dx === 0) { dx = -gridSize; dy = 0; }
        else if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -gridSize; }
        else if (e.key === "ArrowRight" && dx === 0) { dx = gridSize; dy = 0; }
        else if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = gridSize; }
    }

    function gameOver() {
        gameActive = false;
        isGameOver = true;
        clearInterval(gameIntervalId);
        document.getElementById('snake-restart-btn').style.display = 'block';

        ctx.fillStyle = 'rgba(255, 0, 127, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // CHANGED TO STANDARD "GAME OVER" TEXT
        ctx.font = "900 22px 'Orbitron'";
        ctx.fillStyle = "#ff007f";
        ctx.textAlign = "center";
        ctx.shadowColor = '#ff007f'; ctx.shadowBlur = 12;
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
    }

    function destroyGame() {
        gameActive = false;
        clearInterval(gameIntervalId);
        window.removeEventListener('keydown', handleKeyDown);
        const modal = document.getElementById('snake-game-modal');
        if (modal) modal.remove();
    }
})();

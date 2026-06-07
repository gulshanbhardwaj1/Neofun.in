/**
 * ==========================================================================
 * FILE: bubble-pop.js
 * GAME: BUBBLE POP SUPERDRIVE (ANTI-FREEZE & SMOOTH SWITCH MATRIX)
 * ==========================================================================
 */

(function () {
    let canvas, ctx;
    let gameActive = false;
    let popCount = 0;
    let highPopCount = 0;
    let bubbles = [];
    let animationFrameId = null;
    let spawnIntervalId = null;

    let currentMode = "NORMAL"; 
    const CONFIG = {
        EASY: { spawnRate: 700, baseMin: 0.8, baseMax: 1.3, cap: 0.8, labelColor: '#39ff14' },
        NORMAL: { spawnRate: 500, baseMin: 1.4, baseMax: 2.2, cap: 1.8, labelColor: '#00f0ff' },
        // Hard mode speed kept fast but smooth to avoid sudden matrix lockups
        HARD: { spawnRate: 380, baseMin: 1.8, baseMax: 2.5, cap: 2.2, labelColor: '#ff007f' }
    };

    const POP_COLORS = ['#00f0ff', '#ff007f', '#39ff14', '#b026ff', '#ffcc00'];

    document.addEventListener('DOMContentLoaded', () => {
        const launchBtn = document.querySelectorAll('.btn-play')[3]; 
        if (launchBtn) {
            launchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                setupBubbleModal();
            });
        }
    });

    function setupBubbleModal() {
        if (document.getElementById('bubble-game-modal')) return;

        highPopCount = localStorage.getItem('bubble_high_score') || '0';

        const modal = document.createElement('div');
        modal.id = 'bubble-game-modal';
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100vw', height: '100vh',
            background: 'rgba(5, 5, 8, 0.98)',
            backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)',
            zIndex: '3000', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Orbitron', sans-serif",
            userSelect: 'none',
            padding: '5px',
            boxSizing: 'border-box'
        });

        modal.innerHTML = `
            <div style="position: absolute; top: 10px; right: 20px; color: #8a8a9e; cursor: pointer; font-size: 1.5rem; transition: color 0.2s; z-index: 3005;" id="close-bubble-btn">×</div>
            
            <div style="color: #fff; font-size: 1.05rem; font-weight: 700; margin-bottom: 2px; letter-spacing: 1px; text-shadow: 0 0 8px #00f0ff; text-align: center; width: 90%;">BUBBLE POP SUPERDRIVE</div>
            <div style="color: #8a8a9e; font-size: 0.62rem; letter-spacing: 0.5px; margin-bottom: 8px; text-align: center; width: 90%;">CHOOSE YOUR NEURAL MATRIX DIFFICULTY</div>
            
            <div style="display: flex; gap: 6px; width: 320px; margin-bottom: 8px; height: 30px; box-sizing: border-box;">
                <button id="diff-easy" style="flex: 1; background: #08140a; border: 1px solid rgba(57, 255, 20, 0.2); color: #8a8a9e; font-family: inherit; font-size: 0.62rem; font-weight: 700; border-radius: 5px; cursor: pointer; outline: none;">EASY</button>
                <button id="diff-normal" style="flex: 1; background: #0c1c24; border: 1px solid #00f0ff; color: #00f0ff; font-family: inherit; font-size: 0.62rem; font-weight: 700; border-radius: 5px; cursor: pointer; outline: none; box-shadow: 0 0 6px rgba(0,240,255,0.2);">NORMAL</button>
                <button id="diff-hard" style="flex: 1; background: #1a0610; border: 1px solid rgba(255, 0, 127, 0.2); color: #8a8a9e; font-family: inherit; font-size: 0.62rem; font-weight: 700; border-radius: 5px; cursor: pointer; outline: none;">HARD</button>
            </div>

            <div style="display: flex; gap: 20px; margin-bottom: 8px; font-size: 0.75rem; font-weight: 700;">
                <div style="color: #39ff14; text-shadow: 0 0 5px rgba(57,255,20,0.15);" id="bubble-high-score">BEST: ${highPopCount}</div>
                <div style="color: #fff;">POPPED: <span id="bubble-current-score" style="color: #ff007f;">0</span></div>
            </div>

            <div style="position: relative; border: 2px solid rgba(0, 240, 255, 0.2); border-radius: 14px; background: #07070c; overflow: hidden;">
                <canvas id="bubble-canvas" width="320" height="330" style="display: block; cursor: pointer; background: #07070c;"></canvas>
            </div>
            
            <button id="catcher-tap-retry" style="display:none; margin-top: 10px; padding: 6px 20px; background: transparent; border: 1px solid #00f0ff; color: #00f0ff; font-family: inherit; font-weight: 700; font-size: 0.7rem; letter-spacing: 0.5px; border-radius: 4px; cursor: pointer; box-shadow: 0 0 10px rgba(0, 240, 255, 0.2); text-shadow: 0 0 4px #00f0ff;">PLAY AGAIN</button>
        `;

        document.body.appendChild(modal);

        canvas = document.getElementById('bubble-canvas');
        ctx = canvas.getContext('2d');

        document.getElementById('close-bubble-btn').addEventListener('click', destroyGame);
        
        const easyBtn = document.getElementById('diff-easy');
        const normalBtn = document.getElementById('diff-normal');
        const hardBtn = document.getElementById('diff-hard');

        // FIXED: Pure cleanup state function added before shifting modes to completely eliminate screen locking
        function updateDifficultyVisuals(selected) {
            currentMode = selected;
            
            // UI Button resets
            [easyBtn, normalBtn, hardBtn].forEach(btn => {
                btn.style.color = "#8a8a9e";
                btn.style.boxShadow = "none";
            });
            easyBtn.style.borderColor = "rgba(57, 255, 20, 0.2)";
            normalBtn.style.borderColor = "rgba(0, 240, 255, 0.2)";
            hardBtn.style.borderColor = "rgba(255, 0, 127, 0.2)";

            if(selected === "EASY") {
                easyBtn.style.color = CONFIG.EASY.labelColor;
                easyBtn.style.borderColor = CONFIG.EASY.labelColor;
                easyBtn.style.boxShadow = `0 0 6px ${CONFIG.EASY.labelColor}33`;
            } else if(selected === "NORMAL") {
                normalBtn.style.color = CONFIG.NORMAL.labelColor;
                normalBtn.style.borderColor = CONFIG.NORMAL.labelColor;
                normalBtn.style.boxShadow = `0 0 6px ${CONFIG.NORMAL.labelColor}33`;
            } else if(selected === "HARD") {
                hardBtn.style.color = CONFIG.HARD.labelColor;
                hardBtn.style.borderColor = CONFIG.HARD.labelColor;
                hardBtn.style.boxShadow = `0 0 6px ${CONFIG.HARD.labelColor}33`;
            }

            // Hard reset loops to cleanly switch states
            stopGameEngines();
            startGame();
        }

        easyBtn.addEventListener('click', () => updateDifficultyVisuals("EASY"));
        normalBtn.addEventListener('click', () => updateDifficultyVisuals("NORMAL"));
        hardBtn.addEventListener('click', () => updateDifficultyVisuals("HARD"));

        canvas.addEventListener('mousedown', handleBubbleClick);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleBubbleClick(e.touches[0]);
        }, { passive: false });

        document.getElementById('catcher-tap-retry').addEventListener('click', startGame);

        startGame();
    }

    function stopGameEngines() {
        gameActive = false;
        if (spawnIntervalId) {
            clearInterval(spawnIntervalId);
            spawnIntervalId = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function startGame() {
        stopGameEngines(); // Reset active loops before running new engines
        
        gameActive = true;
        popCount = 0;
        bubbles = [];
        document.getElementById('bubble-current-score').innerText = popCount;
        document.getElementById('catcher-tap-retry').style.display = "none";

        let activeConfig = CONFIG[currentMode];

        for (let i = 0; i < 5; i++) {
            spawnBubble(true);
        }

        spawnIntervalId = setInterval(() => spawnBubble(false), activeConfig.spawnRate); 
        gameLoop();
    }

    function spawnBubble(initialScatter = false) {
        if (!gameActive || bubbles.length >= 20) return; 

        let radius = Math.random() * 5 + 14; 
        let activeConfig = CONFIG[currentMode];
        let speed = (Math.random() * (activeConfig.baseMax - activeConfig.baseMin) + activeConfig.baseMin) + Math.min(popCount * 0.015, activeConfig.cap);

        let x, y, speedX, speedY;

        if (initialScatter) {
            x = Math.random() * (canvas.width - radius * 2) + radius;
            y = Math.random() * (canvas.height - radius * 2) + radius;
            let randomAngle = Math.random() * Math.PI * 2;
            speedX = Math.cos(randomAngle) * speed;
            speedY = Math.sin(randomAngle) * speed;
        } else {
            let edge = Math.floor(Math.random() * 4);
            
            if (edge === 0) { 
                x = Math.random() * (canvas.width - radius * 2) + radius;
                y = canvas.height + radius + 2;
                speedX = (Math.random() - 0.5) * speed;
                speedY = -speed * 0.9;
            } else if (edge === 1) { 
                x = Math.random() * (canvas.width - radius * 2) + radius;
                y = -radius - 2;
                speedX = (Math.random() - 0.5) * speed;
                speedY = speed * 0.9;
            } else if (edge === 2) { 
                x = -radius - 2;
                y = Math.random() * (canvas.height - radius * 2) + radius;
                speedX = speed * 0.9;
                speedY = (Math.random() - 0.5) * speed;
            } else { 
                x = canvas.width + radius + 2;
                y = Math.random() * (canvas.height - radius * 2) + radius;
                speedX = -speed * 0.9;
                speedY = (Math.random() - 0.5) * speed;
            }
        }

        bubbles.push({
            x: x, y: y,
            radius: radius,
            color: POP_COLORS[Math.floor(Math.random() * POP_COLORS.length)],
            speedX: speedX,
            speedY: speedY,
            wobble: Math.random() * 100,
            wobbleSpeed: 0.02,
            popping: false,
            popFrame: 0
        });
    }

    function handleBubbleClick(e) {
        if (!gameActive) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        for (let i = bubbles.length - 1; i >= 0; i--) {
            let b = bubbles[i];
            if (b.popping) continue;

            let dist = Math.sqrt((clickX - b.x) ** 2 + (clickY - b.y) ** 2);
            if (dist <= b.radius + 16) { 
                b.popping = true; 
                popCount++;
                document.getElementById('bubble-current-score').innerText = popCount;

                if (popCount > highPopCount) {
                    highPopCount = popCount;
                    localStorage.setItem('bubble_high_score', highPopCount);
                    document.getElementById('bubble-high-score').innerText = `BEST: ${highPopCount}`;
                }
                break; 
            }
        }
    }

    function gameLoop() {
        if (!gameActive) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let missedBubble = false;

        for (let i = bubbles.length - 1; i >= 0; i--) {
            let b = bubbles[i];

            if (!b.popping) {
                b.x += b.speedX;
                b.y += b.speedY;

                b.wobble += b.wobbleSpeed;
                b.x += Math.sin(b.wobble) * 0.12;
                b.y += Math.cos(b.wobble) * 0.12;

                // Buffer padded room for safe multi-touch triggers
                let isOut = (b.x < -b.radius - 40 || b.x > canvas.width + b.radius + 40 || b.y < -b.radius - 40 || b.y > canvas.height + b.radius + 40);
                
                if (isOut) {
                    if (currentMode === "HARD") {
                        missedBubble = true;
                    } else {
                        bubbles.splice(i, 1);
                        spawnBubble(false);
                        continue;
                    }
                }

                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.strokeStyle = b.color;
                ctx.lineWidth = 2.2;
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.28, Math.PI * 1, Math.PI * 1.5);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.8;
                ctx.stroke();

            } else {
                b.popFrame++;
                ctx.beginPath();
                let shardRadius = b.radius * (1 + b.popFrame * 0.2); 
                ctx.arc(b.x, b.y, shardRadius, 0, Math.PI * 2);
                ctx.strokeStyle = b.color;
                ctx.lineWidth = 4 / b.popFrame; 
                ctx.setLineDash([3, 6]); 
                ctx.stroke();
                ctx.setLineDash([]);

                if (b.popFrame > 4) {
                    bubbles.splice(i, 1); 
                }
            }
        }

        if (missedBubble) {
            endGame();
            return;
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function endGame() {
        stopGameEngines(); // FIXED: Force clear everything instantly on Game Over so buttons unlock immediately

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255, 51, 51, 0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        document.getElementById('catcher-tap-retry').style.display = "block";

        ctx.font = "900 18px 'Orbitron'";
        ctx.fillStyle = "#ff007f";
        ctx.textAlign = "center";
        ctx.textShadow = "0 0 8px #ff007f";
        ctx.fillText("MATRIX OVERLOAD", canvas.width / 2, canvas.height / 2 - 10);
        
        ctx.font = "700 10px 'Orbitron'";
        ctx.fillStyle = "#fff";
        ctx.fillText("BUBBLE ESCAPED THE GRID!", canvas.width / 2, canvas.height / 2 + 15);
    }

    function destroyGame() {
        stopGameEngines();
        const modal = document.getElementById('bubble-game-modal');
        if (modal) modal.remove();
    }
})();

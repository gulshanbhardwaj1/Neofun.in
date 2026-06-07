/**
 * ==========================================================================
 * FILE: color-catcher.js
 * GAME: COLOR CATCHER (PERFECT BUTTON LIFT & RESTART UI EDITION)
 * ==========================================================================
 */

(function () {
    let canvas, ctx;
    let gameActive = false;
    let score = 0;
    let lives = 3;
    let photons = [];
    let playerColorIndex = 0; // 0: Pink, 1: Blue, 2: Green
    let animationFrameId = null;
    let spawnIntervalId = null;

    const COLORS = [
        { hex: '#ff007f', name: 'PINK' },
        { hex: '#00f0ff', name: 'BLUE' },
        { hex: '#39ff14', name: 'GREEN' }
    ];

    document.addEventListener('DOMContentLoaded', () => {
        const launchBtn = document.querySelectorAll('.btn-play')[2]; 
        if (launchBtn) {
            launchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                setupCatcherModal();
            });
        }
    });

    function setupCatcherModal() {
        if (document.getElementById('catcher-game-modal')) return;

        const savedBest = localStorage.getItem('catcher_high_score') || '0';

        const modal = document.createElement('div');
        modal.id = 'catcher-game-modal';
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100vw', height: '100vh',
            background: 'rgba(5, 5, 8, 0.96)',
            backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)',
            zIndex: '3000', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Orbitron', sans-serif",
            userSelect: 'none'
        });

        modal.innerHTML = `
            <div style="position: absolute; top: 15px; right: 25px; color: #8a8a9e; cursor: pointer; font-size: 2rem; transition: color 0.2s;" id="close-catcher-btn">×</div>
            <div style="color: #fff; font-size: 1.5rem; font-weight: 700; margin-bottom: 2px; letter-spacing: 2px; text-shadow: 0 0 10px #39ff14;">COLOR CATCHER</div>
            <div style="color: #8a8a9e; font-size: 0.75rem; letter-spacing: 1px; margin-bottom: 12px;" id="catcher-instruction">MATCH THE SHIELD WITH FALLING PHOTONS</div>
            
            <div id="catcher-high-score" style="font-size: 0.8rem; font-weight: 700; color: #39ff14; letter-spacing: 1.5px; margin-bottom: 8px; text-shadow: 0 0 8px rgba(57,255,20,0.3);">BEST: ${savedBest}</div>
            
            <div style="display: flex; gap: 40px; margin-bottom: 12px; font-weight:900; font-size:1.1rem;">
                <div style="color: #fff;">SCORE: <span id="catcher-score" style="color: #00f0ff;">0</span></div>
                <div style="color: #fff;">LIVES: <span id="catcher-lives" style="color: #ff007f;">💖💖💖</span></div>
            </div>

            <div style="position: relative; border: 2px solid rgba(57, 255, 20, 0.2); border-radius: 16px; background: #07070c; box-shadow: 0 0 30px rgba(0,0,0,0.5);">
                <canvas id="catcher-canvas" width="340" height="320" style="display: block; border-radius: 14px 14px 0 0; background: #07070c;"></canvas>
                
                <div style="display: flex; width: 100%; height: 58px; background: #0c0c14; border-radius: 0 0 14px 14px; border-top: 1px solid rgba(255,255,255,0.1); box-sizing: border-box;">
                    <button id="btn-col-0" style="flex: 1; background: #200513; border: none; color: #ff007f; font-family: inherit; font-weight: 900; font-size: 0.85rem; cursor: pointer; border-radius: 0 0 0 14px; outline: none;">PINK</button>
                    <button id="btn-col-1" style="flex: 1; background: #051820; border: none; color: #00f0ff; font-family: inherit; font-weight: 900; font-size: 0.85rem; border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05); outline: none;">BLUE</button>
                    <button id="btn-col-2" style="flex: 1; background: #0a2005; border: none; color: #39ff14; font-family: inherit; font-weight: 900; font-size: 0.85rem; border-radius: 0 0 14px 0; outline: none;">GREEN</button>
                </div>
            </div>
            
            <button id="catcher-tap-retry" style="display:none; margin-top: 20px; padding: 12px 35px; background: transparent; border: 1px solid #00f0ff; color: #00f0ff; font-family: inherit; font-weight: 700; font-size: 0.85rem; letter-spacing: 1px; border-radius: 4px; cursor: pointer; box-shadow: 0 0 15px rgba(0, 240, 255, 0.3); text-shadow: 0 0 5px #00f0ff; transition: all 0.2s;">PLAY AGAIN</button>
        `;

        document.body.appendChild(modal);

        canvas = document.getElementById('catcher-canvas');
        ctx = canvas.getContext('2d');

        // Handlers
        document.getElementById('close-catcher-btn').addEventListener('click', destroyGame);

        const setShieldColor = (idx) => {
            if (!gameActive) return;
            playerColorIndex = idx;
        };

        document.getElementById('btn-col-0').addEventListener('click', () => setShieldColor(0));
        document.getElementById('btn-col-1').addEventListener('click', () => setShieldColor(1));
        document.getElementById('btn-col-2').addEventListener('click', () => setShieldColor(2));
        
        document.getElementById('catcher-tap-retry').addEventListener('click', startGame);

        startGame();
    }

    function startGame() {
        gameActive = true;
        score = 0;
        lives = 3;
        photons = [];
        playerColorIndex = 0;
        
        document.getElementById('catcher-score').innerText = score;
        document.getElementById('catcher-lives').innerText = '💖💖💖';
        document.getElementById('catcher-instruction').innerText = "MATCH THE SHIELD WITH FALLING PHOTONS";
        document.getElementById('catcher-instruction').style.color = "#8a8a9e";
        document.getElementById('catcher-tap-retry').style.display = "none";

        if(spawnIntervalId) clearInterval(spawnIntervalId);
        spawnIntervalId = setInterval(spawnPhoton, 1200); 

        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        gameLoop();
    }

    function spawnPhoton() {
        if (!gameActive) return;
        let randomColorIdx = Math.floor(Math.random() * COLORS.length);
        photons.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: -15,
            radius: 11, 
            colorIndex: randomColorIdx,
            speed: 2.2 + (score * 0.05) 
        });
    }

    function gameLoop() {
        if (!gameActive) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Platform Shield
        let shieldY = canvas.height - 20;
        let activeColor = COLORS[playerColorIndex];

        ctx.beginPath();
        ctx.roundRect(20, shieldY, canvas.width - 40, 12, 6);
        ctx.fillStyle = activeColor.hex;
        ctx.shadowBlur = 20;
        ctx.shadowColor = activeColor.hex;
        ctx.fill();
        ctx.shadowBlur = 0; 

        // Photons Loop
        for (let i = photons.length - 1; i >= 0; i--) {
            let p = photons[i];
            p.y += p.speed;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = COLORS[p.colorIndex].hex;
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS[p.colorIndex].hex;
            ctx.fill();
            ctx.shadowBlur = 0;

            if (p.y + p.radius >= shieldY && p.y - p.radius <= shieldY + 12) {
                if (p.x >= 20 && p.x <= canvas.width - 20) {
                    if (p.colorIndex === playerColorIndex) {
                        score += 10;
                        document.getElementById('catcher-score').innerText = score;
                        
                        let bestCatcher = parseInt(localStorage.getItem('catcher_high_score') || '0');
                        if(score > bestCatcher) {
                            localStorage.setItem('catcher_high_score', score);
                            document.getElementById('catcher-high-score').innerText = `BEST: ${score}`;
                            document.getElementById('catcher-high-score').style.color = '#00f0ff';
                        }
                    } else {
                        loseLife(); 
                    }
                    photons.splice(i, 1);
                    continue;
                }
            }

            if (p.y > canvas.height) {
                photons.splice(i, 1);
                loseLife();
            }
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function loseLife() {
        lives--;
        let heartString = '';
        for(let k=0; k<lives; k++) heartString += '💖';
        if(heartString === '') heartString = '💔';
        document.getElementById('catcher-lives').innerText = heartString;

        if (lives <= 0) endGame();
    }

    function endGame() {
        gameActive = false;
        clearInterval(spawnIntervalId);
        cancelAnimationFrame(animationFrameId);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "rgba(255, 51, 51, 0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        document.getElementById('catcher-instruction').innerText = "GAME OVER! REBOOT SYSTEM.";
        document.getElementById('catcher-instruction').style.color = '#ff3333';
        
        // Reveals the highly glowing "PLAY AGAIN" Button
        document.getElementById('catcher-tap-retry').style.display = "block";

        ctx.font = "900 24px 'Orbitron'";
        ctx.fillStyle = "#ff3333";
        ctx.textAlign = "center";
        ctx.textShadow = "0 0 10px #ff3333";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    }

    function destroyGame() {
        gameActive = false;
        if (spawnIntervalId) clearInterval(spawnIntervalId);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        const modal = document.getElementById('catcher-game-modal');
        if (modal) modal.remove();
    }
})();

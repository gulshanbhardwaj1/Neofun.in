/**
 * ==========================================================================
 * FILE: circle-gamecopy.js
 * GAME: PERFECT CIRCLE ARENA (WITH HIGHEST SCORE LOCALSTORAGE STORAGE)
 * ==========================================================================
 */

(function () {
    let canvas, ctx;
    let isDrawing = false;
    let points = [];
    let gameActive = false;
    let targetCenter = { x: 0, y: 0 };
    let autoResetTimeout = null; 

    function initCircleGame() {
        const launchBtn = document.querySelectorAll('.btn-play')[0];
        if (!launchBtn) return;

        launchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            setupGameOverlay();
        });
    }

    function setupGameOverlay() {
        if (document.getElementById('circle-game-modal')) return;

        // Fetch saved high score from browser
        const savedHighScore = localStorage.getItem('circle_high_score') || '0.0';

        const modal = document.createElement('div');
        modal.id = 'circle-game-modal';
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
            <div style="position: absolute; top: 20px; right: 25px; color: #8a8a9e; cursor: pointer; font-size: 2rem; transition: color 0.2s;" id="close-game-btn">×</div>
            <div style="color: #fff; font-size: 1.6rem; font-weight: 700; margin-bottom: 2px; letter-spacing: 2px; text-shadow: 0 0 10px var(--neon-pink, #ff007f);">PERFECT CIRCLE</div>
            <div style="color: #00f0ff; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 15px;" id="game-instruction">DRAW A SINGLE FLAWLESS CIRCLE AROUND THE DOT</div>
            
            <div id="high-score-display" style="font-size: 0.8rem; font-weight: 700; color: #39ff14; letter-spacing: 1.5px; margin-bottom: 5px; text-shadow: 0 0 8px rgba(57, 255, 20, 0.3);">BEST: ${savedHighScore}%</div>
            
            <div id="score-display" style="font-size: 3.5rem; font-weight: 900; color: #fff; margin-bottom: 15px; min-height: 80px; text-shadow: 0 0 15px rgba(255,255,255,0.1);">---</div>
            <div style="position: relative; border: 2px solid rgba(0, 240, 255, 0.2); border-radius: 16px; box-shadow: 0 0 40px rgba(0, 240, 255, 0.15); background: #07070c;">
                <canvas id="circle-canvas" width="340" height="340" style="display: block; cursor: crosshair; border-radius: 14px;"></canvas>
            </div>
            <button id="reset-game-btn" style="margin-top: 25px; padding: 12px 30px; background: transparent; border: 1px solid #00f0ff; color: #00f0ff; font-family: inherit; font-weight: 700; font-size: 0.85rem; letter-spacing: 1px; border-radius: 4px; cursor: pointer; box-shadow: 0 0 15px rgba(0, 240, 255, 0.15); transition: all 0.3s ease;">RESET ARENA</button>
        `;

        document.body.appendChild(modal);

        canvas = document.getElementById('circle-canvas');
        ctx = canvas.getContext('2d');
        targetCenter = { x: canvas.width / 2, y: canvas.height / 2 };

        document.getElementById('close-game-btn').addEventListener('click', () => {
            if(autoResetTimeout) clearTimeout(autoResetTimeout);
            modal.remove();
            gameActive = false;
        });
        
        document.getElementById('reset-game-btn').addEventListener('click', () => {
            if(autoResetTimeout) clearTimeout(autoResetTimeout);
            resetArena();
        });

        setupCanvasListeners();
        resetArena();
    }

    function setupCanvasListeners() {
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', drawStroke);
        window.addEventListener('mouseup', endDrawing);

        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e.touches[0]); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); drawStroke(e.touches[0]); }, { passive: false });
        window.addEventListener('touchend', () => { endDrawing(); });
    }

    function resetArena() {
        isDrawing = false;
        points = [];
        gameActive = true; 
        document.getElementById('score-display').innerText = "---";
        document.getElementById('score-display').style.color = "#fff";
        document.getElementById('game-instruction').innerText = "DRAW A SINGLE FLAWLESS CIRCLE AROUND THE DOT";
        document.getElementById('game-instruction').style.color = "#00f0ff";
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCenterDot();
    }

    function drawCenterDot() {
        ctx.beginPath();
        ctx.arc(targetCenter.x, targetCenter.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff007f'; 
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff007f';
        ctx.fill();
        ctx.shadowBlur = 0; 
    }

    function startDrawing(e) {
        if(autoResetTimeout) {
            clearTimeout(autoResetTimeout);
            autoResetTimeout = null;
        }
        
        gameActive = true; 
        isDrawing = true;
        points = [];
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCenterDot();

        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        points.push({ x: clientX - rect.left, y: clientY - rect.top });
    }

    function drawStroke(e) {
        if (!isDrawing || !gameActive) return;
        const rect = canvas.getBoundingClientRect();
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        points.push({ x, y });

        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(x, y);
        
        ctx.strokeStyle = '#e6ffff'; 
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 14; 
        ctx.shadowColor = '#00f0ff'; 
        
        ctx.stroke();
        ctx.shadowBlur = 0; 
    }

    function endDrawing() {
        if (!isDrawing) return;
        isDrawing = false;

        if (points.length < 25) {
            document.getElementById('game-instruction').innerText = "TOO SHORT! DRAW THE WHOLE CIRCLE.";
            document.getElementById('game-instruction').style.color = '#ff3333';
            autoResetTimeout = setTimeout(resetArena, 1200);
            return;
        }

        calculateCirclePrecision();
    }

    function calculateCirclePrecision() {
        let totalRadius = 0;
        points.forEach(p => {
            const dx = p.x - targetCenter.x;
            const dy = p.y - targetCenter.y;
            totalRadius += Math.sqrt(dx * dx + dy * dy);
        });
        const averageRadius = totalRadius / points.length;

        if (averageRadius < 35) {
            document.getElementById('game-instruction').innerText = "CIRCLE IS TOO SMALL! TRY AGAIN.";
            document.getElementById('game-instruction').style.color = '#ff3333';
            autoResetTimeout = setTimeout(resetArena, 1500);
            return;
        }

        let totalDeviation = 0;
        points.forEach(p => {
            const dx = p.x - targetCenter.x;
            const dy = p.y - targetCenter.y;
            const currentDist = Math.sqrt(dx * dx + dy * dy);
            totalDeviation += Math.abs(currentDist - averageRadius);
        });
        const averageDeviation = totalDeviation / points.length;
        
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        const closingGap = Math.sqrt(Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2));

        let score = 100 - (averageDeviation / averageRadius * 115) - (closingGap / averageRadius * 20);
        if (score < 0) score = 0;
        score = parseFloat(score.toFixed(1));

        const scoreDisplay = document.getElementById('score-display');
        scoreDisplay.innerText = `${score}%`;

        // HIGH SCORE COMPARISON AND UPDATER ENGINE
        let currentHighScore = parseFloat(localStorage.getItem('circle_high_score') || '0.0');
        if (score > currentHighScore) {
            localStorage.setItem('circle_high_score', score.toFixed(1));
            document.getElementById('high-score-display').innerText = `BEST: ${score.toFixed(1)}%`;
            document.getElementById('high-score-display').style.color = '#00f0ff'; // Neon Glow blue alert on beat record
        }

        const inst = document.getElementById('game-instruction');
        if (score >= 90) {
            scoreDisplay.style.color = '#39ff14'; 
            inst.innerText = "LEGENDARY PRECISION ALPHA MASTER!";
            inst.style.color = '#39ff14';
        } else if (score >= 75) {
            scoreDisplay.style.color = '#00f0ff'; 
            inst.innerText = "EXCELLENT STRUCTURE. KEEP IT UP!";
            inst.style.color = '#00f0ff';
        } else if (score >= 50) {
            scoreDisplay.style.color = '#b026ff'; 
            inst.innerText = "DECENT SHAPE, BUT REDUCE SHAKINESS.";
            inst.style.color = '#b026ff';
        } else {
            scoreDisplay.style.color = '#ff3333'; 
            inst.innerText = "HIGH VARIANCE IN SYMMETRY. RETRYING...";
            inst.style.color = '#ff3333';
        }

        ctx.beginPath();
        ctx.arc(targetCenter.x, targetCenter.y, averageRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.35)'; 
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        autoResetTimeout = setTimeout(() => {
            resetArena();
        }, 2500);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initCircleGame();
    } else {
        document.addEventListener('DOMContentLoaded', initCircleGame);
    }
})();

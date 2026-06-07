/**
 * ==========================================================================
 * FILE: synth-runner.js
 * GAME: SYNTH NEON RUNNER (ULTIMATE PARALLAX & VARIABLE OBSTACLES UPDATE)
 * FIXES: Added Synth-Moon, Cyber-Trees, Nano-Birds, and 3 Variant Obstacles
 * ==========================================================================
 */

(function () {
    let gameActive = false;
    let animationFrameId;
    let score = 0;
    let highScore = localStorage.getItem('synth_runner_highscore') || 0;
    
    let audioCtx = null;
    let canvas, ctx;
    let player, obstacles, particles, environmentElements;
    let gameSpeed = 5;
    let spawnTimer = 0;
    let runCycle = 0; 
    let bgScroll = 0; // Background movement tracker

    // STRICT TRIGGER: Controls activation only via the specific "Play Now" button
    document.addEventListener('click', handleLaunchTrigger, true);
    document.addEventListener('touchstart', handleLaunchTrigger, { passive: false, capture: true });

    function handleLaunchTrigger(e) {
        let target = e.target;
        let playBtn = target.closest('.btn-play');

        if (playBtn) {
            let gameCard = playBtn.closest('.game-card');
            let cardText = gameCard ? gameCard.innerText || gameCard.innerHTML : '';
            
            if (cardText.toUpperCase().includes('SYNTH') || cardText.toUpperCase().includes('RUNNER')) {
                e.preventDefault();
                e.stopPropagation();
                initSynthAudio();
                setupRunnerModal();
            }
        }
    }

    function initSynthAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playSynthTone(freq, type, duration) {
        if (!audioCtx) return;
        try {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch(e) {}
    }

    function setupRunnerModal() {
        if (document.getElementById('runner-game-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'runner-game-modal';
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100vw', height: '100vh',
            background: 'rgba(5, 4, 10, 0.99)',
            backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)',
            zIndex: '99999', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            userSelect: 'none', boxSizing: 'border-box'
        });

        modal.innerHTML = `
            <div style="width: 90%; max-width: 360px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255, 0, 127, 0.2); padding-bottom: 8px;">
                <div style="text-align: left;">
                    <div style="color: #ff007f; font-size: 1.1rem; font-weight: 700; text-shadow: 0 0 8px #ff007f;">SYNTH NEON RUNNER</div>
                    <div style="color: #8a8a9e; font-size: 0.6rem; letter-spacing:1px; margin-top: 2px;">ROBOT MATRIX ADVENTURE</div>
                </div>
                <div style="color: #00f0ff; cursor: pointer; font-size: 1.6rem; font-weight: bold; padding: 2px 10px; border: 1px solid rgba(0,240,255,0.3); border-radius: 6px; background: rgba(0,240,255,0.05); line-height: 1;" id="close-runner-btn">×</div>
            </div>

            <div style="display: flex; justify-content: space-between; width: 90%; max-width: 360px; margin-bottom: 8px; font-size: 0.75rem; font-weight: bold; color: #8a8a9e;">
                <div>SCORE: <span id="runner-score" style="color: #39ff14;">0</span></div>
                <div>BEST: <span style="color: #00f0ff;">${highScore}</span></div>
            </div>

            <div id="runner-interactive-zone" style="position: relative; width: 90%; max-width: 360px; aspect-ratio: 4/3; background: #030206; border: 1px solid #ff007f; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(255, 0, 127, 0.2);">
                <canvas id="runner-canvas" style="display: block; width: 100%; height: 100%; pointer-events: none;"></canvas>
                
                <div id="runner-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background: rgba(4,3,8,0.85); pointer-events: none;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">🤖</div>
                    <div style="color: #00f0ff; font-size: 0.9rem; font-weight: bold; letter-spacing: 1px; text-shadow: 0 0 8px #00f0ff;" id="runner-msg">TAP ANYWHERE TO START GAME</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-runner-btn').addEventListener('click', destroyGame);
        document.getElementById('close-runner-btn').addEventListener('touchstart', function(e) {
            e.preventDefault(); destroyGame();
        });

        canvas = document.getElementById('runner-canvas');
        ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 300;

        const zone = document.getElementById('runner-interactive-zone');
        zone.addEventListener('click', handleInput);
        zone.addEventListener('touchstart', function(e) {
            e.preventDefault(); 
            handleInput();
        });

        resetGameEngine();
        renderStaticLoop();
    }

    function resetGameEngine() {
        score = 0;
        gameSpeed = 4.5;
        spawnTimer = 0;
        runCycle = 0;
        bgScroll = 0;
        obstacles = [];
        particles = [];
        
        player = {
            x: 60,
            y: 200,
            width: 20,
            height: 32,
            vy: 0,
            gravity: 0.55,
            jumpForce: -9.5,
            isGrounded: false
        };

        // Populate dynamic background structures (Trees & Birds data layers)
        environmentElements = [];
        // Add random Cyber Trees
        for (let i = 0; i < 5; i++) {
            environmentElements.push({
                type: 'tree',
                x: i * 100 + Math.random() * 30,
                baseWidth: 15 + Math.random() * 10,
                height: 40 + Math.random() * 25,
                speedMultiplier: 0.3
            });
        }
        // Add random Cyber Birds
        for (let i = 0; i < 2; i++) {
            environmentElements.push({
                type: 'bird',
                x: 150 + i * 180 + Math.random() * 50,
                y: 40 + Math.random() * 40,
                size: 6 + Math.random() * 4,
                speedMultiplier: 0.6,
                wingPhase: Math.random() * 10
            });
        }
        
        document.getElementById('runner-score').innerText = score;
    }

    function handleInput() {
        if (!gameActive) {
            document.getElementById('runner-overlay').style.display = 'none';
            resetGameEngine();
            gameActive = true;
            playSynthTone(300, 'square', 0.2);
            runGameLoop();
        } else {
            if (player.isGrounded) {
                player.vy = player.jumpForce;
                player.isGrounded = false;
                playSynthTone(380, 'triangle', 0.12);
                
                for(let i=0; i<6; i++){
                    particles.push({
                        x: player.x + 5,
                        y: player.y + player.height,
                        vx: -Math.random()*2 - 1,
                        vy: (Math.random() - 0.5)*2,
                        size: Math.random()*3 + 1,
                        color: '#ff007f'
                    });
                }
            }
        }
    }

    // DRAW BACKGROUND LAYER (Synth-Moon, Cyber-Trees, Birds)
    function drawEnvironment() {
        // 1. NEON SYNTH-MOON (Big Sun/Moon with horizontal retro bars)
        let moonX = 300;
        let moonY = 65;
        let moonRadius = 35;
        
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffc107';
        let gradient = ctx.createLinearGradient(0, moonY - moonRadius, 0, moonY + moonRadius);
        gradient.addColorStop(0, '#ff007f');
        gradient.addColorStop(0.5, '#ff8500');
        gradient.addColorStop(1, '#ffc107');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Synthwave horizontal scanlines cutout on Moon
        ctx.fillStyle = '#030206';
        for (let y = moonY - moonRadius; y < moonY + moonRadius; y += 7) {
            if (y > moonY - 15) {
                ctx.fillRect(moonX - moonRadius - 5, y, moonRadius * 2 + 10, 2);
            }
        }

        // 2. PARALLAX ENVIRONMENT LOGIC (Trees and Birds)
        environmentElements.forEach(el => {
            el.x -= (gameSpeed * el.speedMultiplier);

            // Infinite loop wrapping mechanism
            if (el.x + 50 < 0) {
                el.x = canvas.width + Math.random() * 60;
            }

            if (el.type === 'tree') {
                // Drawing Technical/Geometric Circuit Tree
                ctx.save();
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
                ctx.lineWidth = 2;
                
                // Trunk line
                ctx.beginPath();
                ctx.moveTo(el.x, 234);
                ctx.lineTo(el.x, 234 - el.height);
                ctx.stroke();

                // Abstract geometric circuit foliage nodes
                ctx.fillStyle = 'rgba(57, 255, 20, 0.1)';
                ctx.strokeStyle = '#39ff14';
                ctx.lineWidth = 1;
                
                ctx.beginPath();
                ctx.arc(el.x, 234 - el.height, el.baseWidth / 1.5, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();

                ctx.beginPath();
                ctx.arc(el.x - 8, 234 - el.height + 12, el.baseWidth / 2, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();

                ctx.beginPath();
                ctx.arc(el.x + 8, 234 - el.height + 12, el.baseWidth / 2, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                ctx.restore();
            } 
            else if (el.type === 'bird') {
                // Drawing Animated Vector Cyber Bird
                el.wingPhase += 0.2;
                let wingY = Math.sin(el.wingPhase) * (el.size * 0.7);
                
                ctx.save();
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                // Left Wing
                ctx.moveTo(el.x - el.size, el.y + wingY);
                ctx.lineTo(el.x, el.y);
                // Right Wing
                ctx.lineTo(el.x + el.size, el.y + wingY);
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    // DRAW ANIMATED POCO ROBOT SPRITE
    function drawPocoRobot(x, y, isGrounded, cycle) {
        ctx.save();
        let swing = isGrounded ? Math.sin(cycle * 0.25) : 0;
        let bobbing = isGrounded ? Math.abs(Math.cos(cycle * 0.25)) * 2 : 0;
        let py = y + bobbing;

        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff007f';

        // Jetpack
        ctx.fillStyle = '#495057';
        ctx.fillRect(x - 4, py + 10, 6, 16);
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(x - 3, py + 14, 2, 4);

        // Main Chubby Chassis Frame
        ctx.fillStyle = '#e9ecef';
        ctx.beginPath();
        ctx.roundRect(x, py + 8, 20, 18, 5);
        ctx.fill();

        // Screen belly grid
        ctx.fillStyle = '#121214';
        ctx.fillRect(x + 4, py + 13, 12, 8);
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(x + 6, py + 16, 2, 2);

        // Poco Head
        ctx.fillStyle = '#f8f9fa';
        ctx.beginPath();
        ctx.arc(x + 10, py + 4, 7, 0, Math.PI * 2);
        ctx.fill();

        // Cyan Visor
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.roundRect(x + 6, py + 1, 9, 5, 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 8, py + 2, 2, 2);
        ctx.fillRect(x + 12, py + 2, 2, 2);

        // Legs
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath(); ctx.moveTo(x + 6, py + 26);
        ctx.lineTo(x + 4 + (swing * 6), py + 34); ctx.stroke();

        ctx.strokeStyle = '#ff007f';
        ctx.beginPath(); ctx.moveTo(x + 14, py + 26);
        ctx.lineTo(x + 12 - (swing * 6), py + 34); ctx.stroke();

        ctx.restore();
    }

    function runGameLoop() {
        if (!gameActive) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (player.isGrounded) {
            runCycle += gameSpeed;
        }

        // 1. Draw Environment background assets first
        drawEnvironment();

        // Retro perspective neon ground line
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, 234); ctx.lineTo(canvas.width, 234); ctx.stroke();

        // Moving ground horizontal accent lines for speed sensation
        bgScroll -= gameSpeed;
        if (bgScroll <= -40) bgScroll = 0;
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.3)';
        ctx.lineWidth = 1;
        for (let xOffset = bgScroll; xOffset < canvas.width; xOffset += 40) {
            ctx.beginPath(); ctx.moveTo(xOffset, 234); ctx.lineTo(xOffset - 15, canvas.height); ctx.stroke();
        }

        // Physics Framework Execution
        player.vy += player.gravity;
        player.y += player.vy;

        if (player.y + player.height >= 234) {
            player.y = 234 - player.height;
            player.vy = 0;
            player.isGrounded = true;
        }

        // Render Character Model
        drawPocoRobot(player.x, player.y, player.isGrounded, runCycle);

        // 2. Obstacles Controller Matrix (Variant Selector)
        spawnTimer++;
        let currentSpawnInterval = Math.max(55, 90 - Math.floor(score * 1.8));
        if (spawnTimer > currentSpawnInterval) {
            // Randomly select one of 3 obstacle designs
            let typeRand = Math.random();
            let obsType = 'spike'; 
            let oWidth = 14, oHeight = 22, oY = 234 - 22;

            if (typeRand > 0.66) {
                obsType = 'grid'; // Wide Double Grid Block
                oWidth = 24; oHeight = 16; oY = 234 - 16;
            } else if (typeRand > 0.33) {
                obsType = 'orb'; // Floating mid-air plasma orb
                oWidth = 16; oHeight = 16; oY = 175; // Suspended higher up
            }

            obstacles.push({
                x: canvas.width,
                y: oY,
                width: oWidth,
                height: oHeight,
                type: obsType,
                scored: false,
                pulsePhase: 0
            });
            spawnTimer = 0;
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;

            // DRAW RANDOMIZED VARIANT VISUALIZATIONS
            ctx.save();
            if (obs.type === 'spike') {
                // Style 1: Neon Cyan Spiked Pillar
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(obs.x, obs.y + obs.height);
                ctx.lineTo(obs.x + obs.width / 2, obs.y);
                ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                ctx.fill();
            } 
            else if (obs.type === 'grid') {
                // Style 2: Orange/Yellow Double Warning Grid Barrier
                ctx.fillStyle = '#ff8500';
                ctx.shadowColor = '#ff8500'; ctx.shadowBlur = 10;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.fillStyle = '#030206'; // Slanted Warning Lines
                ctx.fillRect(obs.x + 4, obs.y, 4, obs.height);
                ctx.fillRect(obs.x + 14, obs.y, 4, obs.height);
            } 
            else if (obs.type === 'orb') {
                // Style 3: Floating Electric Purple Plasma Orb
                obs.pulsePhase += 0.2;
                let sizePulse = Math.sin(obs.pulsePhase) * 2;
                ctx.fillStyle = '#9c27b0';
                ctx.shadowColor = '#9c27b0'; ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, (obs.width/2) + sizePulse, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // Point Scoring Validator
            if (obs.x + obs.width < player.x && !obs.scored) {
                score++;
                obs.scored = true;
                document.getElementById('runner-score').innerText = score;
                playSynthTone(580, 'sine', 0.05); 
                if(score % 5 === 0) gameSpeed += 0.4;
            }

            // High Precision Collision Box Matching
            if (player.x < obs.x + obs.width &&
                player.x + player.width > obs.x &&
                player.y < obs.y + obs.height &&
                player.y + player.height > obs.y) {
                gameOver();
            }

            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
            }
        }

        // Particle processing engine
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += -gameSpeed * 0.4;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            if (p.x < 0) particles.splice(i, 1);
        }

        animationFrameId = requestAnimationFrame(runGameLoop);
    }

    function renderStaticLoop() {
        if(gameActive) return;
        ctx.fillStyle = '#030206';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 234); ctx.lineTo(canvas.width, 234); ctx.stroke();
    }

    function gameOver() {
        gameActive = false;
        cancelAnimationFrame(animationFrameId);
        playSynthTone(130, 'sawtooth', 0.45); 
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('synth_runner_highscore', highScore);
        }

        document.getElementById('runner-msg').innerText = "SYSTEM REBOOT! RETRY";
        document.getElementById('runner-overlay').style.display = 'flex';
        renderStaticLoop();
    }

    function destroyGame() {
        gameActive = false;
        cancelAnimationFrame(animationFrameId);
        const modal = document.getElementById('runner-game-modal');
        if (modal) modal.remove();
    }
})();

/*-------- js by gemini--*/
/**
 * SNAKE MASTER X - PREMIUM PRODUCTION JAVASCRIPT ENGINE
 * Fully Vanilla ES6, Optimized for 60FPS Performance, Responsive Grid Engine
 */

(function () {
    'use strict';

    // ==========================================================================
    // 1. CONSTANTS & GAME CONFIGURATIONS
    // ==========================================================================
    const GRID_SIZE = 20; // 30x30 Virtual Grid on 600x600 Canvas
    const BASE_SPEEDS = { easy: 140, medium: 100, hard: 70, insane: 45 };
    const BOMB_CHANCES = { easy: 0.02, medium: 0.05, hard: 0.09, insane: 0.15 };
    const POWER_CHANCES = { easy: 0.08, medium: 0.06, hard: 0.04, insane: 0.03 };

    const SKIN_CONFIGS = {
        green: { core: '#39ff14', glow: 'rgba(57, 255, 20, 0.8)', price: 0 },
        blue: { core: '#0066ff', glow: 'rgba(0, 102, 255, 0.8)', price: 50 },
        red: { core: '#ff0055', glow: 'rgba(255, 0, 85, 0.8)', price: 100 },
        purple: { core: '#bd00ff', glow: 'rgba(189, 0, 255, 0.8)', price: 150 },
        gold: { core: '#ffd700', glow: 'rgba(255, 215, 0, 0.8)', price: 300 },
        black: { core: '#111424', glow: 'rgba(255, 255, 255, 0.6)', price: 500 }
    };

    const FOOD_TYPES = [
        { icon: '🍎', name: 'Apple', points: 10, weight: 3 },
        { icon: '🍔', name: 'Burger', points: 30, weight: 1 },
        { icon: '🍕', name: 'Pizza', points: 25, weight: 1 },
        { icon: '🍒', name: 'Cherry', points: 15, weight: 2 },
        { icon: '🍓', name: 'Strawberry', points: 15, weight: 2 },
        { icon: '🍇', name: 'Grapes', points: 20, weight: 2 },
        { icon: '🍌', name: 'Banana', points: 20, weight: 2 },
        { icon: '🥝', name: 'Kiwi', points: 15, weight: 2 },
        { icon: '🍉', name: 'Watermelon', points: 35, weight: 1 },
        { icon: '🥕', name: 'Carrot', points: 10, weight: 3 }
    ];

    const POWERUP_TYPES = [
        { type: 'shield', color: '#00f3ff', icon: '🛡️', duration: 8000 },
        { type: 'double', color: '#ffd700', icon: '2️⃣', duration: 6000 },
        { type: 'magnet', color: '#ff0055', icon: '🧲', duration: 7000 },
        { type: 'slow', color: '#bd00ff', icon: '⏰', duration: 8000 },
        { type: 'boost', color: '#39ff14', icon: '⚡', duration: 5000 }
    ];

    // ==========================================================================
    // 2. STATE MANAGEMENT & SYSTEM REGISTRIES
    // ==========================================================================
    let state = {
        coins: parseInt(localStorage.getItem('smx_coins')) || 0,
        bestScore: parseInt(localStorage.getItem('smx_bestScore')) || 0,
        unlockedSkins: JSON.parse(localStorage.getItem('smx_unlocked')) || ['green'],
        currentSkin: localStorage.getItem('smx_skin') || 'green',
        difficulty: localStorage.getItem('smx_diff') || 'medium',
        settings: JSON.parse(localStorage.getItem('smx_settings')) || { music: true, sound: true, grid: false },
        
        // Runtime Session Variables
        score: 0,
        earnedCoins: 0,
        lives: 3,
        isPlaying: false,
        isPaused: false,
        combo: 0,
        comboTimer: null,
        
        // Entity Systems
        snake: [],
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        foods: [],
        bombs: [],
        powerups: [],
        activePowers: {},
        particles: [],
        floatingTexts: [],
        
        // Timing & Engine Loops
        lastRender: 0,
        screenShake: 0,
        pulseScale: 1,
        pulseGrow: true
    };

    // Synthesized Audio Context Layer for No-External-Dependency sound effects
    const AudioEngine = {
        ctx: null,
        init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
        play(type) {
            if (!state.settings.sound) return;
            this.init();
            try {
                let osc = this.ctx.createOscillator();
                let gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                if (type === 'eat') {
                    osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
                    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.15, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);
                    osc.start(); osc.stop(this.ctx.currentTime + 0.15);
                } else if (type === 'bomb') {
                    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, this.ctx.currentTime);
                    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.4);
                    gain.gain.setValueAtTime(0.3, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
                    osc.start(); osc.stop(this.ctx.currentTime + 0.4);
                } else if (type === 'powerup') {
                    osc.type = 'triangle'; osc.frequency.setValueAtTime(300, this.ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);
                    gain.gain.setValueAtTime(0.2, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
                    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
                }
            } catch(e) {}
        }
    };

    // ==========================================================================
    // 3. DOM ELEMENT REGISTRATION
    // ==========================================================================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // HUD Cards
    const elCoins = document.getElementById('coins');
    const elScore = document.getElementById('score');
    const elBestScore = document.getElementById('bestScore');
    const elLives = document.getElementById('lives');
    
    // Configurations Selectors
    const skinSelect = document.getElementById('skinSelect');
    const diffSelect = document.getElementById('difficulty');
    
    // Primary Action Callers
    const btnStart = document.getElementById('startBtn');
    const btnPause = document.getElementById('pauseBtn');
    const btnRestart = document.getElementById('restartBtn');
    
    // Popups Interactivity mapping
    const popGameOver = document.getElementById('gameOver');
    const popShop = document.getElementById('shop');
    const popSettings = document.getElementById('settings');
    
    const elFinalScore = document.getElementById('finalScore');
    const elFinalBest = document.getElementById('finalBest');
    const elEarnedCoins = document.getElementById('earnedCoins');
    
    const btnPlayAgain = document.getElementById('playAgain');
    const btnCloseShop = document.getElementById('closeShop');
    const btnCloseSettings = document.getElementById('closeSettings');

    // ==========================================================================
    // 4. INITIALIZATION ENGINE
    // ==========================================================================
    function initializeEngine() {
        updateHUDBoards();
        syncSelectorsState();
        bindInputListeners();
        setupShopInteractivity();
        setupSettingsInteractivity();
        resetGameState();
        
        // Inject Canvas Setup for Responsive High DPI Render
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Fire Request Animation Loop
        window.requestAnimationFrame(engineLoop);
    }

    function syncSelectorsState() {
        skinSelect.value = state.currentSkin;
        diffSelect.value = state.difficulty;
        
        // Sync custom state checkmarks inside settings HTML structure dynamically
        const checks = popSettings.querySelectorAll('input[type="checkbox"]');
        if(checks.length >= 3) {
            checks[0].checked = state.settings.music;
            checks[1].checked = state.settings.sound;
            checks[2].checked = state.settings.grid;
        }
    }

    function updateHUDBoards() {
        elCoins.innerText = state.coins;
        elScore.innerText = state.score;
        elBestScore.innerText = state.bestScore;
        elLives.innerText = '❤️'.repeat(Math.max(0, state.lives)) || '💀';
    }

    function resizeCanvas() {
        const size = Math.min(window.innerWidth - 40, window.innerHeight - 250, 600);
        if (size < 300) return; // Guard safe bounds
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
    }

    // ==========================================================================
    // 5. CORE GAMEPLAY MECHANICS (LOGIC PIPELINES)
    // ==========================================================================
    function resetGameState() {
        state.score = 0;
        state.earnedCoins = 0;
        state.lives = 3;
        state.combo = 0;
        state.dir = { x: 1, y: 0 };
        state.nextDir = { x: 1, y: 0 };
        state.activePowers = {};
        state.foods = [];
        state.bombs = [];
        state.powerups = [];
        state.particles = [];
        state.floatingTexts = [];
        
        // Build Initial Snake Body (Center aligned Grid space)
        state.snake = [
            { x: 15, y: 15 },
            { x: 14, y: 15 },
            { x: 13, y: 15 }
        ];
        
        spawnFoodItem();
        updateHUDBoards();
    }

    function processGameTick() {
        if (!state.isPlaying || state.isPaused) return;

        // Pull Direction Updates from Guard Queue
        state.dir = state.nextDir;

        // Evaluate Next Head Cell Position
        const head = state.snake[0];
        let nextHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };

        // Process Border Wraparound Logic safely across 30x30 matrices
        if (nextHead.x < 0) nextHead.x = 29;
        if (nextHead.x >= 30) nextHead.x = 0;
        if (nextHead.y < 0) nextHead.y = 29;
        if (nextHead.y >= 30) nextHead.y = 0;

        // Collision Checks: Self Intersection Guarded by Active Shield PowerUp
        if (!state.activePowers['shield']) {
            for (let segment of state.snake) {
                if (segment.x === nextHead.x && segment.y === nextHead.y) {
                    triggerLifeLoss();
                    return;
                }
            }
        }

        // Advance Snake Architecture
        state.snake.unshift(nextHead);

        // Collision Check: Food Interaction Nodes
        let ateFood = false;
        for (let i = state.foods.length - 1; i >= 0; i--) {
            let food = state.foods[i];
            // Magnet PowerUp calculation: pull evaluation closer if within 2 tile radius
            if (state.activePowers['magnet']) {
                let dist = Math.abs(nextHead.x - food.x) + Math.abs(nextHead.y - food.y);
                if (dist <= 2) {
                    food.x = nextHead.x;
                    food.y = nextHead.y;
                }
            }

            if (nextHead.x === food.x && nextHead.y === food.y) {
                processFoodConsumption(food);
                state.foods.splice(i, 1);
                ateFood = true;
            }
        }

        if (!ateFood) {
            state.snake.pop(); // Remove tail if size isn't increasing
        } else {
            spawnFoodItem();
            // Roll dice for potential entity spawns on consumption phase
            if (Math.random() < BOMB_CHANCES[state.difficulty]) spawnBombItem();
            if (Math.random() < POWER_CHANCES[state.difficulty]) spawnPowerupItem();
        }

        // Collision Check: Bombs
        for (let i = state.bombs.length - 1; i >= 0; i--) {
            if (nextHead.x === state.bombs[i].x && nextHead.y === state.bombs[i].y) {
                triggerBombExplosion(state.bombs[i].x, state.bombs[i].y);
                state.bombs.splice(i, 1);
                triggerLifeLoss();
            }
        }

        // Collision Check: PowerUps
        for (let i = state.powerups.length - 1; i >= 0; i--) {
            let p = state.powerups[i];
            if (nextHead.x === p.x && nextHead.y === p.y) {
                activatePowerup(p);
                state.powerups.splice(i, 1);
            }
        }
    }

    // ==========================================================================
    // 6. SPAWN MECHANICS ENGINE (PREVENTS INTERSECTIONS)
    // ==========================================================================
    function getSafeSpawnCoords() {
        let attempts = 0;
        while (attempts < 200) {
            let x = Math.floor(Math.random() * 30);
            let y = Math.floor(Math.random() * 30);
            
            // Validate match against whole snake entity stack
            let onSnake = state.snake.some(s => s.x === x && s.y === y);
            let onFood = state.foods.some(f => f.x === x && f.y === y);
            let onBomb = state.bombs.some(b => b.x === x && b.y === y);
            let onPower = state.powerups.some(p => p.x === x && p.y === y);

            if (!onSnake && !onFood && !onBomb && !onPower) {
                return { x, y };
            }
            attempts++;
        }
        return { x: -1, y: -1 }; // System fallback catch
    }

    function spawnFoodItem() {
        let coords = getSafeSpawnCoords();
        if (coords.x === -1) return;
        let archetype = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
        state.foods.push({ ...coords, ...archetype, scale: 0, targetScale: 1 });
    }

    function spawnBombItem() {
        let coords = getSafeSpawnCoords();
        if (coords.x === -1) return;
        state.bombs.push({ ...coords });
    }

    function spawnPowerupItem() {
        let coords = getSafeSpawnCoords();
        if (coords.x === -1) return;
        let archetype = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        state.powerups.push({ ...coords, ...archetype });
    }

    // ==========================================================================
    // 7. CONSUMPTION, COMBO & TIMED MODIFIERS PIPELINE
    // ==========================================================================
    function processFoodConsumption(food) {
        AudioEngine.play('eat');
        
        // Track and compute combos
        state.combo++;
        clearTimeout(state.comboTimer);
        state.comboTimer = setTimeout(() => { state.combo = 0; }, 3000);

        let finalPoints = food.points;
        if (state.activePowers['double']) finalPoints *= 2;
        if (state.combo > 2) finalPoints += Math.min(state.combo * 2, 20); // Scale bonus caps at +20

        state.score += finalPoints;
        
        // Coin Award Computations
        let gainedCoins = Math.floor(food.points / 10);
        if (state.score % 100 === 0) gainedCoins += 5; // Bonus payouts milestones
        
        state.coins += gainedCoins;
        state.earnedCoins += gainedCoins;

        // Persist data immediately 
        localStorage.setItem('smx_coins', state.coins);
        if (state.score > state.bestScore) {
            state.bestScore = state.score;
            localStorage.setItem('smx_bestScore', state.bestScore);
        }

        updateHUDBoards();
        createParticles(food.x * GRID_SIZE + 10, food.y * GRID_SIZE + 10, SKIN_CONFIGS[state.currentSkin].core, 12);
        createFloatingText(`+${finalPoints} ${state.combo > 2 ? 'Combo!' : ''}`, food.x * GRID_SIZE, food.y * GRID_SIZE, '#00f3ff');
    }

    function activatePowerup(p) {
        AudioEngine.play('powerup');
        createFloatingText(`${p.type.toUpperCase()} ACTIVED!`, p.x * GRID_SIZE, p.y * GRID_SIZE, p.color);
        createParticles(p.x * GRID_SIZE + 10, p.y * GRID_SIZE + 10, p.color, 20);

        // Register powerup mapping tracking timestamps inside global ticks
        state.activePowers[p.type] = Date.now() + p.duration;
    }

    function triggerLifeLoss() {
        state.lives--;
        state.screenShake = 15;
        updateHUDBoards();
        
        if (state.lives <= 0) {
            triggerGameOver();
        } else {
            // Short Invulnerability/respawn processing sequence
            state.activePowers['shield'] = Date.now() + 2000;
        }
    }

    function triggerBombExplosion(gx, gy) {
        AudioEngine.play('bomb');
        createParticles(gx * GRID_SIZE + 10, gy * GRID_SIZE + 10, '#ff0055', 35);
        createFloatingText('-1 LIFE', gx * GRID_SIZE, gy * GRID_SIZE, '#ff0055');
    }

    function triggerGameOver() {
        state.isPlaying = false;
        elFinalScore.innerText = state.score;
        elFinalBest.innerText = state.bestScore;
        elEarnedCoins.innerText = state.earnedCoins;
        popGameOver.classList.add('active');
    }

    // ==========================================================================
    // 8. INTERACTIVE RENDERING PIPELINE (60FPS CANVAS ENGINE)
    // ==========================================================================
    function engineLoop(timestamp) {
        let speedModifier = BASE_SPEEDS[state.difficulty];
        
        // Evaluate Active PowerUp Speed adjustments
        if (state.activePowers['slow']) speedModifier *= 1.5;
        if (state.activePowers['boost']) speedModifier *= 0.6;

        let delta = timestamp - state.lastRender;
        if (delta >= speedModifier) {
            processGameTick();
            state.lastRender = timestamp;
        }

        // Animations Clock ticking
        processAnimationsClocks();

        // Canvas Redraw pipeline execution
        renderCanvasFrame();

        window.requestAnimationFrame(engineLoop);
    }

    function processAnimationsClocks() {
        // Handle pulse cycles
        if (state.pulseGrow) {
            state.pulseScale += 0.02;
            if (state.pulseScale >= 1.2) state.pulseGrow = false;
        } else {
            state.pulseScale -= 0.02;
            if (state.pulseScale <= 0.85) state.pulseGrow = true;
        }

        // Lower shake factor
        if (state.screenShake > 0) state.screenShake *= 0.9;
        
        // Cleanup expired PowerUp state trackers
        const now = Date.now();
        for (let type in state.activePowers) {
            if (now > state.activePowers[type]) {
                delete state.activePowers[type];
            }
        }
    }

    function renderCanvasFrame() {
        ctx.save();
        
        // Execute Screen Shake matrix translations contextually
        if (state.screenShake > 0.5) {
            let dx = (Math.random() - 0.5) * state.screenShake;
            let dy = (Math.random() - 0.5) * state.screenShake;
            ctx.translate(dx, dy);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render Background Grid if configurations permit 
        if (state.settings.grid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 600; i += GRID_SIZE) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
            }
        }

        // Draw Entity Elements
        renderActivePowerups();
        renderActiveBombs();
        renderActiveFoods();
        renderActiveSnake();
        renderParticleLayer();
        renderFloatingTextLayer();

        ctx.restore();
    }

    function renderActiveSnake() {
        const config = SKIN_CONFIGS[state.currentSkin];
        ctx.shadowBlur = 15;
        ctx.shadowColor = config.glow;

        state.snake.forEach((segment, idx) => {
            ctx.fillStyle = (idx === 0) ? '#ffffff' : config.core;
            
// Apply special visuals for Active Shield powerup
            if (state.activePowers['shield']) {
                ctx.fillStyle = '#00f3ff';
            }

            // Draw clean rounded rect blocks aligned cleanly to grid matrices
            drawRoundedRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2, 4);
        });
        ctx.shadowBlur = 0; // Clear context immediately post draw
    }

    function renderActiveFoods() {
        ctx.font = `${16 * state.pulseScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        state.foods.forEach(f => {
            ctx.fillText(f.icon, f.x * GRID_SIZE + 10, f.y * GRID_SIZE + 10);
        });
    }

    function renderActiveBombs() {
        state.bombs.forEach(b => {
            ctx.shadowBlur = 10 * state.pulseScale;
            ctx.shadowColor = '#ff0055';
            ctx.fillStyle = '#220011';
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(b.x * GRID_SIZE + 10, b.y * GRID_SIZE + 10, 8 * state.pulseScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        ctx.shadowBlur = 0;
    }

    function renderActivePowerups() {
        state.powerups.forEach(p => {
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.icon, p.x * GRID_SIZE + 10, p.y * GRID_SIZE + 10);
        });
        ctx.shadowBlur = 0;
    }

    function renderParticleLayer() {
        for (let i = state.particles.length - 1; i >= 0; i--) {
            let p = state.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                state.particles.splice(i, 1);
                continue;
            }
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1.0; // Reset canvas structural rules
    }

    function renderFloatingTextLayer() {
        ctx.font = 'bold 16px Orbitron';
        ctx.textAlign = 'center';
        for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
            let t = state.floatingTexts[i];
            t.y -= t.speed;
            t.life--;
            if (t.life <= 0) {
                state.floatingTexts.splice(i, 1);
                continue;
            }
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x + 10, t.y);
        }
    }

    function drawRoundedRect(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 3 + 1;
            state.particles.push({
                x, y, color,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 2,
                alpha: 1,
                decay: Math.random() * 0.03 + 0.015
            });
        }
    }

    function createFloatingText(text, x, y, color) {
        state.floatingTexts.push({ text, x, y, color, life: 40, speed: 0.8 });
    }

    // ==========================================================================
    // 9. CONTROLS, KEYBOARD & TOUCH ENGINE SWIPE INTERCEPTS
    // ==========================================================================
    function bindInputListeners() {
        // Desktop Standard System Listeners
        window.addEventListener('keydown', e => {
            let targetDir = null;
            switch(e.key.toLowerCase()) {
                case 'arrowup': case 'w': targetDir = { x: 0, y: -1 }; break;
                case 'arrowdown': case 's': targetDir = { x: 0, y: 1 }; break;
                case 'arrowleft': case 'a': targetDir = { x: -1, y: 0 }; break;
                case 'arrowright': case 'd': targetDir = { x: 1, y: 0 }; break;
                case ' ': // Spacebar shortcuts for instant pause management
                    e.preventDefault();
                    togglePauseState();
                    return;
            }
            if (targetDir) handleDirectionChange(targetDir);
        });

        // Mapping Virtual Interface Buttons HUD D-PAD
        document.getElementById('up').addEventListener('click', () => handleDirectionChange({ x: 0, y: -1 }));
        document.getElementById('down').addEventListener('click', () => handleDirectionChange({ x: 0, y: 1 }));
        document.getElementById('left').addEventListener('click', () => handleDirectionChange({ x: -1, y: 0 }));
        document.getElementById('right').addEventListener('click', () => handleDirectionChange({ x: 1, y: 0 }));

        // Implementation of Mobile Touch Swipe gestures
        let touchStart = { x: 0, y: 0 };
        canvas.addEventListener('touchstart', e => {
            touchStart.x = e.touches[0].clientX;
            touchStart.y = e.touches[0].clientY;
        }, { passive: true });

        canvas.addEventListener('touchend', e => {
            let dx = e.changedTouches[0].clientX - touchStart.x;
            let dy = e.changedTouches[0].clientY - touchStart.y;
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return; // Prevent tap interference

            if (Math.abs(dx) > Math.abs(dy)) {
                handleDirectionChange({ x: dx > 0 ? 1 : -1, y: 0 });
            } else {
                handleDirectionChange({ x: dy > 0 ? 1 : -1, y: 0 });
            }
        }, { passive: true });

        // Select controls wiring UI bindings
        skinSelect.addEventListener('change', e => {
            let selection = e.target.value;
            if (state.unlockedSkins.includes(selection)) {
                state.currentSkin = selection;
                localStorage.setItem('smx_skin', selection);
            } else {
                // Intercept locks and direct user straight to shop overlay
                popShop.classList.add('active');
                skinSelect.value = state.currentSkin; // Reset selector target view
            }
        });

        diffSelect.addEventListener('change', e => {
            state.difficulty = e.target.value;
            localStorage.setItem('smx_diff', state.difficulty);
        });

        // Core Primary Buttons Action Listeners
        btnStart.addEventListener('click', () => {
            if (!state.isPlaying) {
                resetGameState();
                state.isPlaying = true;
                state.isPaused = false;
            }
        });
        
        btnPause.addEventListener('click', togglePauseState);
        btnRestart.addEventListener('click', () => {
            resetGameState();
            state.isPlaying = true;
            state.isPaused = false;
        });

        btnPlayAgain.addEventListener('click', () => {
            popGameOver.classList.remove('active');
            resetGameState();
            state.isPlaying = true;
            state.isPaused = false;
        });
    }

    function handleDirectionChange(target) {
        // Prevent instant reverse direction tracking mapping logic loops
        if ((target.x === -state.dir.x && target.x !== 0) || (target.y === -state.dir.y && target.y !== 0)) {
            return;
        }
        state.nextDir = target;
    }

    function togglePauseState() {
        if (!state.isPlaying) return;
        state.isPaused = !state.isPaused;
        btnPause.innerText = state.isPaused ? '▶ Resume' : '⏸ Pause';
    }

    // ==========================================================================
    // 10. SHOP INVENTORY AND TRANSACTIONS MODULE
    // ==========================================================================
    function setupShopInteractivity() {
        const shopGrid = popShop.querySelector('.shop-grid');
        
        function rebuildShopUI() {
            shopGrid.innerHTML = ''; // Dynamic render tree
            Object.keys(SKIN_CONFIGS).forEach(key => {
                const cfg = SKIN_CONFIGS[key];
                const btn = document.createElement('button');
                const isUnlocked = state.unlockedSkins.includes(key);
                
                btn.innerHTML = `
                    <span>${getSkinEmoji(key)} ${key.toUpperCase()}</span>
                    <small>${isUnlocked ? 'UNLOCKED' : '🪙 ' + cfg.price}</small>
                `;
                
                if (state.currentSkin === key) btn.style.borderColor = 'var(--neon-cyan)';

                btn.addEventListener('click', () => {
                    if (isUnlocked) {
                        state.currentSkin = key;
                        localStorage.setItem('smx_skin', key);
                        skinSelect.value = key;
                        rebuildShopUI();
                    } else {
                        if (state.coins >= cfg.price) {
                            state.coins -= cfg.price;
                            state.unlockedSkins.push(key);
                            state.currentSkin = key;
                            localStorage.setItem('smx_coins', state.coins);
                            localStorage.setItem('smx_unlocked', JSON.stringify(state.unlockedSkins));
                            localStorage.setItem('smx_skin', key);
                            skinSelect.value = key;
                            updateHUDBoards();
                            rebuildShopUI();
                        } else {
                            alert('Not enough coins!');
                        }
                    }
                });
                shopGrid.appendChild(btn);
            });
        }

        // Expose trigger hooks into CSS targets inside topbar structure elements
        document.querySelector('.logo').addEventListener('click', () => {
            rebuildShopUI();
            popShop.classList.add('active');
        });

        btnCloseShop.addEventListener('click', () => popShop.classList.remove('active'));
    }

    function getSkinEmoji(color) {
        switch(color) {
            case 'green': return '🟢'; case 'blue': return '🔵'; case 'red': return '🔴';
            case 'purple': return '🟣'; case 'gold': return '🟡'; case 'black': return '⚫';
            default: return '🐍';
        }
    }
    
    // ==========================================================================
    // 11. SYSTEMS CONFIGURATION LOGIC (SETTINGS PANELS)
    // ==========================================================================
    function setupSettingsInteractivity() {
        // Intercepting card clicks inside stats cards structure to trigger configurations overlay
        document.querySelector('.stats').addEventListener('contextmenu', e => e.preventDefault()); // Lock context
        
        const triggerSettings = document.createElement('div');
        triggerSettings.className = 'card';
        triggerSettings.innerHTML = '⚙️';
        triggerSettings.style.cursor = 'pointer';
        triggerSettings.addEventListener('click', () => popSettings.classList.add('active'));
        document.querySelector('.stats').appendChild(triggerSettings);

        const checks = popSettings.querySelectorAll('input[type="checkbox"]');
        if (checks.length >= 3) {
            checks[0].addEventListener('change', e => {
                state.settings.music = e.target.checked;
                saveSettings();
            });
            checks[1].addEventListener('change', e => {
                state.settings.sound = e.target.checked;
                saveSettings();
            });
            checks[2].addEventListener('change', e => {
                state.settings.grid = e.target.checked;
                saveSettings();
            });
        }
        btnCloseSettings.addEventListener('click', () => popSettings.classList.remove('active'));
    }

    function saveSettings() {
        localStorage.setItem('smx_settings', JSON.stringify(state.settings));
    }

    // Launch Game System Engine Execution Core
    document.addEventListener('DOMContentLoaded', initializeEngine);

})();
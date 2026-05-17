/**
 * ==========================================================================
 * FILE: acoustic-snap.js
 * GAME: ACOUSTIC SNAP - INTERACTIVE PREDICTION SYNTH BOX
 * FEATURES: Double Box Dashboard, Live Tap Frequency Synth, Wave-Shifter
 * ==========================================================================
 */

(function () {
    let audioCtx = null;
    let lastTapTime = 0;
    let waveTypes = ['sine', 'triangle', 'sawtooth', 'square'];
    let waveIndex = 0;

    // STRICT TOUCH-DRIFT PROTECTION
    let touchStartX = 0;
    let touchStartY = 0;
    const MOVE_THRESHOLD = 8;

    document.addEventListener('touchstart', function (e) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: true, capture: true });

    document.addEventListener('touchend', handleLaunchTrigger, { passive: false, capture: true });
    document.addEventListener('click', handleLaunchTrigger, true);

    function handleLaunchTrigger(e) {
        let target = e.target;
        let playBtn = target.closest('.btn-play');

        if (playBtn) {
            if (e.type === 'touchend') {
                const touch = e.changedTouches[0];
                const distX = Math.abs(touch.clientX - touchStartX);
                const distY = Math.abs(touch.clientY - touchStartY);
                if (distX > MOVE_THRESHOLD || distY > MOVE_THRESHOLD) return; 
            }

            let gameCard = playBtn.closest('.game-card');
            let cardText = gameCard ? gameCard.innerText || gameCard.innerHTML : '';
            
            if (cardText.toUpperCase().includes('ACOUSTIC') || cardText.toUpperCase().includes('SNAP')) {
                e.preventDefault();
                e.stopPropagation();
                initAudioContext();
                setupPredictionModal();
            }
        }
    }

    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // CORE CUSTOM LIVE SYNTH ENGINE
    function playInteractiveSynth(frequency, type, duration) {
        if (!audioCtx) return;
        try {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            
            // Premium audio node curves for smooth sound
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
    }

    function setupPredictionModal() {
        if (document.getElementById('snap-game-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'snap-game-modal';
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100vw', height: '100vh', height: '100dvh',
            background: 'rgba(3, 4, 6, 0.98)',
            backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)',
            zIndex: '99999', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            userSelect: 'none', boxSizing: 'border-box'
        });

        modal.innerHTML = `
            <div style="width: 95%; max-width: 400px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(0, 240, 255, 0.3); padding-bottom: 10px;">
                <div style="text-align: left;">
                    <div style="color: #00f0ff; font-size: 1.2rem; font-weight: 700; text-shadow: 0 0 8px #00f0ff;">ACOUSTIC PREDICTION</div>
                    <div style="color: #8a8a9e; font-size: 0.65rem; letter-spacing:1px; margin-top: 2px;">LIVE FREQUENCY INTERACTIVE MATRIX</div>
                </div>
                <div style="color: #ff3b30; cursor: pointer; font-size: 1.8rem; font-weight: bold; padding: 2px 12px; border: 1px solid rgba(255,59,48,0.3); border-radius: 6px; background: rgba(255,59,48,0.05); line-height: 1;" id="close-snap-btn">×</div>
            </div>

            <div id="main-synth-box" style="position: relative; width: 95%; max-width: 400px; aspect-ratio: 4/5; background: #010204; border: 2px solid rgba(0, 240, 255, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 0 30px rgba(0, 240, 255, 0.1); box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s;">
                
                <div style="position: absolute; top: 15px; display: flex; gap: 20px; font-family: monospace; font-size: 0.7rem; color: #8a8a9e; letter-spacing: 1px;">
                    <div>WAVE: <span id="hud-wave" style="color: #ff007f;">SINE</span></div>
                    <div>FREQ: <span id="hud-freq" style="color: #39ff14;">000Hz</span></div>
                </div>

                <div id="prediction-trigger-box" style="position: relative; width: 65%; aspect-ratio: 1/1; background: rgba(0, 240, 255, 0.03); border: 2px dashed #00f0ff; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; box-shadow: inset 0 0 15px rgba(0,240,255,0.05); transition: all 0.1s ease;">
                    
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">🔮</div>
                    <div style="color: #ffffff; font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; text-align: center; text-transform: uppercase; padding: 0 10px;">TAP PREDICTION</div>
                    <div style="color: #00f0ff; font-size: 0.6rem; margin-top: 5px; opacity: 0.7; font-family: monospace;">TAP TO SHIFT SOUND</div>

                    <div id="ripple-effect" style="position: absolute; width: 100%; height: 100%; border: 2px solid #ff007f; border-radius: 12px; opacity: 0; transform: scale(1); transition: all 0.3s ease-out; pointer-events: none;"></div>
                </div>

                <div style="color: #8a8a9e; font-size: 0.75rem; text-align: center; position: absolute; bottom: 20px; width: 85%; line-height: 1.4; pointer-events: none;">
                    Aap jaise jaise dabate jaoge, tap ki speed ke hisab se different different dynamic tones and waves generate hongi!
                </div>

            </div>
        `;

        document.body.appendChild(modal);

        // Bind close events
        document.getElementById('close-snap-btn').addEventListener('click', destroyPredictionModal);
        document.getElementById('close-snap-btn').addEventListener('touchstart', function(e) {
            e.preventDefault(); destroyPredictionModal();
        });

        // Setup interaction systems for both outer and inner box clicks
        const targetZone = document.getElementById('prediction-trigger-box');
        targetZone.addEventListener('click', processPredictionTap);
        targetZone.addEventListener('touchstart', function(e) {
            e.preventDefault();
            processPredictionTap();
        });
    }

    function processPredictionTap() {
        initAudioContext();
        let now = Date.now();
        let timeGap = now - lastTapTime;
        lastTapTime = now;

        // 1. Calculate frequency dynamically based on tap speed (gap between taps)
        // Fast tap = High frequency pitch, Slow tap = Deep low bass frequency pitch
        let calculatedFreq = 150 + (100000 / Math.max(timeGap, 100));
        if (calculatedFreq > 1200) calculatedFreq = 1200; // Cap to keep audio pleasant
        if (timeGap > 1500) calculatedFreq = 300;         // Default if tapped after long break

        // 2. Rotate wave types periodically to produce different acoustic styles
        waveIndex = (waveIndex + 1) % waveTypes.length;
        let selectedWave = waveTypes[waveIndex];

        // 3. Play generated custom sound pulse
        playInteractiveSynth(calculatedFreq, selectedWave, 0.35);

        // 4. UI Feedback Update Matrix
        document.getElementById('hud-wave').innerText = selectedWave.toUpperCase();
        document.getElementById('hud-freq').innerText = Math.floor(calculatedFreq) + "Hz";

        // Inner Box Pop Animation
        const innerBox = document.getElementById('prediction-trigger-box');
        innerBox.style.transform = "scale(0.96)";
        innerBox.style.backgroundColor = "rgba(0, 240, 255, 0.1)";
        innerBox.style.borderColor = "#ff007f";

        // Outer Box Glow Flash
        const outerBox = document.getElementById('main-synth-box');
        outerBox.style.borderColor = "#ff007f";
        outerBox.style.boxShadow = "0 0 35px rgba(255, 0, 127, 0.25)";

        // 5. Trigger Wave Ripple Ring
        const ripple = document.getElementById('ripple-effect');
        ripple.style.transition = 'none';
        ripple.style.transform = 'scale(1)';
        ripple.style.opacity = '0.8';
        
        setTimeout(() => {
            ripple.style.transition = 'all 0.4s ease-out';
            ripple.style.transform = 'scale(1.25)';
            ripple.style.opacity = '0';
            
            innerBox.style.transform = "scale(1)";
            innerBox.style.backgroundColor = "rgba(0, 240, 255, 0.03)";
            innerBox.style.borderColor = "#00f0ff";
            
            outerBox.style.borderColor = "rgba(0, 240, 255, 0.4)";
            outerBox.style.boxShadow = "0 0 30px rgba(0, 240, 255, 0.1)";
        }, 50);
    }

    function destroyPredictionModal() {
        const modal = document.getElementById('snap-game-modal');
        if (modal) modal.remove();
    }
})();

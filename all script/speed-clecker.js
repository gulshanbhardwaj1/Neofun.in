// ==========================================================================
// GB PRODUCTION STUDIOS - SPEED CLICKER 9000 INJECTED ENGINE (STANDALONE)
// ==========================================================================

let scClicks = 0;
let scTimeLeft = 10; // Total 10 raw seconds game matrix
let scTimerInterval = null;
let scGameActive = false;

function startSpeedClickerStandalone() {
    scClicks = 0;
    scTimeLeft = 10;
    scGameActive = false;

    // Duplicate box rokne ke liye check
    if (document.getElementById("sc-overlay")) return;

    // --- JS SE EXTRA MODISH CYBER STYLE INJECT KARNA ---
    const styleTag = document.createElement("style");
    styleTag.id = "sc-injected-styles";
    styleTag.innerHTML = `
        .sc-screen-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(3, 3, 6, 0.96); z-index: 999999;
            display: flex; justify-content: center; align-items: center;
            font-family: 'Orbitron', 'Space Grotesk', sans-serif; box-sizing: border-box;
        }
        .sc-modal-box {
            background: #090a0f; border: 2px solid #fff000; border-radius: 12px;
            width: 90%; max-width: 400px; padding: 30px 25px; text-align: center;
            box-shadow: 0 0 35px rgba(255, 240, 0, 0.25); position: relative;
            animation: scScaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes scScaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .sc-title { color: #fff000; font-size: 1.4rem; font-weight: 900; margin-bottom: 10px; letter-spacing: 2px; text-shadow: 0 0 10px rgba(255,240,0,0.3); }
        .sc-subtitle { color: #8a8a9e; font-size: 0.8rem; margin-bottom: 25px; text-transform: uppercase; }
        
        .sc-stats-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .sc-stat-card { 
            background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,240,0,0.1);
            border-radius: 8px; padding: 10px; flex: 1; margin: 0 5px;
        }
        .sc-stat-label { font-size: 0.7rem; color: #8a8a9e; margin-bottom: 5px; }
        .sc-stat-value { font-size: 1.3rem; font-weight: bold; color: #fff; }
        
        .sc-huge-click-btn {
            width: 160px; height: 160px; border-radius: 50%; background: #050508;
            border: 4px solid #fff000; color: #fff000; font-family: 'Orbitron', sans-serif;
            font-size: 1.1rem; font-weight: bold; cursor: pointer; margin: 20px auto;
            display: flex; justify-content: center; align-items: center;
            box-shadow: 0 0 20px rgba(255, 240, 0, 0.15), inset 0 0 15px rgba(255, 240, 0, 0.1);
            transition: all 0.1s ease; outline: none; user-select: none;
        }
        .sc-huge-click-btn:hover { background: rgba(255,240,0,0.05); box-shadow: 0 0 25px rgba(255,240,0,0.3); }
        .sc-huge-click-btn:active { transform: scale(0.92); background: #fff000; color: #000; box-shadow: 0 0 35px #fff000; }
        
        .sc-progress-wrapper { width: 100%; height: 6px; background: #14161f; border-radius: 3px; overflow: hidden; margin-top: 20px; }
        .sc-progress-bar { width: 100%; height: 100%; background: linear-gradient(90deg, #fff000, #ff6700); transition: width 0.1s linear; }
        
        .sc-close-btn { position: absolute; top: 12px; right: 18px; color: #5a5a6e; font-size: 26px; cursor: pointer; transition: color 0.2s; }
        .sc-close-btn:hover { color: #fff000; }
    `;
    document.head.appendChild(styleTag);

    // --- JS SE DESIGNER CYBERPUNK POPUP CREATE KARNA ---
    const overlay = document.createElement("div");
    overlay.id = "sc-overlay";
    overlay.className = "sc-screen-overlay";
    overlay.innerHTML = `
        <div class="sc-modal-box">
            <span class="sc-close-btn" onclick="exitScGame()">&times;</span>
            <div class="sc-title">SPEED CLICKER 9000</div>
            <div class="sc-subtitle">// Quantum Speed Matrix</div>
            
            <div class="sc-stats-row">
                <div class="sc-stat-card">
                    <div class="sc-stat-label">TIME REMAINING</div>
                    <div class="sc-stat-value" id="sc-timer-txt">10.0s</div>
                </div>
                <div class="sc-stat-card">
                    <div class="sc-stat-card-glow"></div>
                    <div class="sc-stat-label">TOTAL CLICKS</div>
                    <div class="sc-stat-value" id="sc-clicks-txt">00</div>
                </div>
            </div>

            <button class="sc-huge-click-btn" id="sc-click-trigger" onclick="registerHyperClick()">TAP TO<br>START</button>
            
            <div class="sc-progress-wrapper">
                <div class="sc-progress-bar" id="sc-progress"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function registerHyperClick() {
    // Pehla click hote hi automatic countdown timer start ho jayega
    if (!scGameActive && scTimeLeft === 10) {
        scGameActive = true;
        document.getElementById("sc-click-trigger").innerHTML = "CLICK!<br>CLICK!";
        startScCountdown();
    }

    if (scGameActive) {
        scClicks++;
        document.getElementById("sc-clicks-txt").innerText = scClicks < 10 ? "0" + scClicks : scClicks;
    }
}

function startScCountdown() {
    let totalDuration = 10000; // 10 seconds in milliseconds
    let startTime = Date.now();

    scTimerInterval = setInterval(() => {
        let elapsed = Date.now() - startTime;
        let remaining = totalDuration - elapsed;

        if (remaining <= 0) {
            clearInterval(scTimerInterval);
            scGameActive = false;
            document.getElementById("sc-timer-txt").innerText = "0.0s";
            document.getElementById("sc-progress").style.width = "0%";
            calculateFinalScScore();
        } else {
            let secondsStr = (remaining / 1000).toFixed(1);
            document.getElementById("sc-timer-txt").innerText = secondsStr + "s";
            document.getElementById("sc-progress").style.width = (remaining / totalDuration) * 100 + "%";
        }
    }, 50);
}

function calculateFinalScScore() {
    let rating = "SLOW HANDS 🐌";
    if (scClicks > 35) rating = "CYBER SPEEDSTER ⚡";
    if (scClicks > 60) rating = "LIGHT-SPEED GOD 🔥";
    if (scClicks > 85) rating = "ZAHAR REFLEXES MAD MAX 🦖";

    alert(`⚡ MATRIX COMPLETED!\n\nTotal Registered Clicks: ${scClicks}\nYour Clicking Speed: ${(scClicks/10).toFixed(1)} clicks/sec\n\nPerformance Status: ${rating}`);
    exitScGame();
}

function exitScGame() {
    clearInterval(scTimerInterval);
    scGameActive = false;
    const overlay = document.getElementById("sc-overlay");
    const styleTag = document.getElementById("sc-injected-styles");
    if (overlay) overlay.remove();
    if (styleTag) styleTag.remove();
}

// ==========================================================================
// GB PRODUCTION STUDIOS - AI PARADOX MASTER ENGINE (100% STANDALONE)
// ==========================================================================

let pdScore = 0;
let pdIndex = 0;
let pdTimer = null;
let pdTimeLeft = 100;
let pdSpeed = 1;

// Ekdam dhasu Smart Reasoning aur Logic questions
const pdQuestions = [
    { q: "🧩 LOGIC SERIES:\nIf 2 + 3 = 10, 7 + 2 = 63, 6 + 5 = 66...\nThen what is 8 + 4?\nIs it 96 (SAFE) or 48 (PARADOX)?", ans: "S" }, // Logic: (a+b)*a -> (8+4)*8 = 96
    { q: "🤖 COGNITIVE LOOP:\nA machine always tells the opposite of the truth. It screens the message: 'THIS SYSTEM IS CURRENTLY OFFLINE'.\nIs this message Safe or a Paradox?", ans: "P" }, // Opposite of truth means it's online, but if it's online it shouldn't lie about being offline. Paradox!
    { q: "⏳ TIME PARADOX:\nYou go back in time and modernise the factory that built your time machine, making it 10x faster. Does this break timeline stability?", ans: "P" }, // Bootstrap paradox (Information with no origin)
    { q: "💻 CONDITIONAL MATRIX:\nIF (Score > 50 OR Members < 5) AND NOT(False).\nIf Score = 40 and Members = 2, is this condition logically SAFE?", ans: "S" }, // (False OR True) AND True -> True. Safe logic!
    { q: "♟️ THE LIAR'S PUZZLE:\nGuard A says Guard B is lying. Guard B says Guard A is telling the truth. What is the status of this room?", ans: "P" }, // Classical contradiction loop. Paradox!
    { q: "🔢 PATTERN EXCEPTION:\nIn a quantum system, numbers follow: 2, 4, 8, 16, 32. The AI injects '64' as the next stream. Is this line SAFE?", ans: "S" }, // Standard geometric progression. Safe!
    { q: "📜 CRITICAL EXCEPTION:\nAn ancient statement reads: 'Every rule has an exception.' If this rule has no exception, it's false. If it has an exception, not every rule has one! Status?", ans: "P" } // Self-referential logical paradox.
];

function startParadoxGameStandalone() {
    pdScore = 0;
    pdIndex = 0;
    pdSpeed = 1;

    if (document.getElementById("pd-overlay")) return;

    // --- EMBEDDED STYLES FOR THE ENTIRE UI & CUSTOM DIALOGS ---
    const styleTag = document.createElement("style");
    styleTag.id = "pd-injected-styles";
    styleTag.innerHTML = `
        .pd-screen-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(3, 4, 7, 0.98); z-index: 999999;
            display: flex; justify-content: center; align-items: center;
            font-family: 'Orbitron', 'Space Grotesk', sans-serif; box-sizing: border-box;
        }
        .pd-modal-box {
            background: #06070a; border: 2px solid #ff007f; border-radius: 12px;
            width: 92%; max-width: 440px; padding: 30px 25px; text-align: center;
            box-shadow: 0 0 35px rgba(255, 0, 127, 0.25); position: relative;
            animation: pdScaleUp 0.2s ease-out; transition: all 0.2s ease;
        }
        @keyframes pdScaleUp { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        .system-glitch-active {
            background: rgba(40, 5, 10, 0.2) !important;
            animation: pdShake 0.1s infinite !important;
            border-color: #ff2255 !important;
            box-shadow: 0 0 45px rgba(255, 34, 85, 0.5) !important;
        }
        @keyframes pdShake {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(-2px, 1px); }
            50% { transform: translate(1px, -2px); }
            75% { transform: translate(-1px, -1px); }
        }

        .pd-title { color: #00ffff; font-size: 1.3rem; font-weight: 900; margin-bottom: 4px; letter-spacing: 3px; text-shadow: 0 0 10px rgba(0,255,255,0.4); }
        .pd-subtitle { color: #4b4b60; font-size: 0.75rem; margin-bottom: 20px; letter-spacing: 1px; text-transform: uppercase; }
        .pd-score-board { color: #39ff14; font-size: 1rem; margin-bottom: 15px; font-weight: bold; font-family: 'Orbitron', sans-serif; }
        
        .pd-question-card {
            background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255, 0, 127, 0.15);
            border-radius: 6px; padding: 20px 15px; min-height: 110px; display: flex;
            align-items: center; justify-content: center; font-size: 0.92rem;
            color: #e2e2ec; line-height: 1.6; margin-bottom: 25px; text-align: center;
            font-family: 'Space Grotesk', sans-serif; white-space: pre-line;
        }
        
        .pd-timer-container { width: 100%; height: 6px; background: #0c0e17; border-radius: 3px; overflow: hidden; margin-bottom: 30px; }
        .pd-timer-bar { width: 100%; height: 100%; background: linear-gradient(90deg, #ff007f, #00ffff); transition: width 0.15s linear; }
        
        .pd-btn-wrapper { display: flex; gap: 15px; }
        .pd-game-btn {
            flex: 1; padding: 14px; border: none; border-radius: 6px; font-size: 0.85rem;
            font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
            font-family: 'Orbitron', sans-serif; transition: all 0.15s;
        }
        .pd-btn-safe { background: #39ff14; color: #000; box-shadow: 0 4px 12px rgba(57,255,20,0.15); }
        .pd-btn-safe:hover { box-shadow: 0 0 20px rgba(57,255,20,0.4); transform: translateY(-2px); }
        .pd-btn-paradox { background: #ff007f; color: #fff; box-shadow: 0 4px 12px rgba(255,0,127,0.15); }
        .pd-btn-paradox:hover { box-shadow: 0 0 20px rgba(255,0,127,0.4); transform: translateY(-2px); }
        
        .pd-close-x { position: absolute; top: 12px; right: 18px; color: #434355; font-size: 26px; cursor: pointer; user-select: none; }
        .pd-close-x:hover { color: #ff007f; }

        /* Custom Screen Over End Layouts */
        .pd-end-title { font-size: 1.7rem; font-weight: 900; margin-bottom: 15px; letter-spacing: 2px; }
        .pd-end-score { font-size: 2.2rem; color: #fff; font-weight: bold; margin: 15px 0; text-shadow: 0 0 15px rgba(255,255,255,0.2); }
        .pd-end-rating { font-size: 0.85rem; color: #8a8a9e; margin-bottom: 30px; text-transform: uppercase; line-height: 1.4; }
        .pd-reboot-btn {
            background: linear-gradient(90deg, #00ffff, #ff007f); color: #fff;
            padding: 14px 30px; border: none; border-radius: 6px; font-weight: bold;
            font-family: 'Orbitron', sans-serif; font-size: 0.9rem; cursor: pointer;
            letter-spacing: 2px; box-shadow: 0 0 20px rgba(0,255,255,0.2); transition: all 0.2s;
        }
        .pd-reboot-btn:hover { box-shadow: 0 0 30px rgba(255,0,127,0.5); transform: translateY(-2px); }
    `;
    document.head.appendChild(styleTag);

    // --- CONSTRUCT INTERFACE ---
    const overlay = document.createElement("div");
    overlay.id = "pd-overlay";
    overlay.className = "pd-screen-overlay";
    overlay.innerHTML = `
        <div class="pd-modal-box" id="pd-modal-content">
            <span class="pd-close-x" onclick="exitPdGame()">&times;</span>
            <div class="pd-title">AI PARADOX CORE</div>
            <div class="pd-subtitle">// Reasoning Protocol</div>
            <div class="pd-score-board" id="pd-score-txt">SCORE: 000</div>
            <div class="pd-question-card" id="pd-question-txt">BOOTING LOGIC ENGINE...</div>
            <div class="pd-timer-container">
                <div class="pd-timer-bar" id="pd-progress"></div>
            </div>
            <div class="pd-btn-wrapper" id="pd-btn-zone">
                <button class="pd-game-btn pd-btn-safe" onclick="submitPdAnswer('S')">SAFE LOGIC</button>
                <button class="pd-game-btn pd-btn-paradox" onclick="submitPdAnswer('P')">PARADOX</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    nextPdLevel();
}

function nextPdLevel() {
    clearInterval(pdTimer);
    
    // Check if player cracked all puzzles
    if (pdIndex >= pdQuestions.length) {
        triggerCustomGameOver(true, "🏆 MATRIX STABILIZED");
        return;
    }

    // UI Updates
    document.getElementById("pd-score-txt").innerText = "SCORE: " + (pdScore < 100 ? "0" + pdScore : pdScore);
    document.getElementById("pd-question-txt").innerText = pdQuestions[pdIndex].q;

    // Slower, reader-friendly dynamic timer loop (140ms per step instead of 70ms = 2x more time!)
    pdTimeLeft = 100;
    pdTimer = setInterval(() => {
        pdTimeLeft -= 1;
        const progressEl = document.getElementById("pd-progress");
        if (progressEl) progressEl.style.width = pdTimeLeft + "%";

        if (pdTimeLeft === 30 && progressEl) {
            progressEl.style.background = "#ff2255"; // Critical Warning Color
        }

        if (pdTimeLeft <= 0) {
            clearInterval(pdTimer);
            triggerCustomGameOver(false, "💥 TIME EXPIRED");
        }
    }, 145 / pdSpeed); 
}

function submitPdAnswer(playerChoice) {
    const modalBox = document.getElementById("pd-modal-content");
    
    if (playerChoice === pdQuestions[pdIndex].ans) {
        pdScore += 25; // 25 points per aptitude crack
        pdIndex++;
        pdSpeed += 0.12; // Gentle speed scaling
        
        if(modalBox) {
            modalBox.style.borderColor = "#39ff14";
            modalBox.style.boxShadow = "0 0 35px rgba(57, 255, 20, 0.4)";
            setTimeout(() => {
                if(modalBox && !modalBox.classList.contains("system-glitch-active")) {
                    modalBox.style.borderColor = "#ff007f";
                    modalBox.style.boxShadow = "0 0 35px rgba(255, 0, 127, 0.25)";
                }
            }, 200);
        }
        nextPdLevel();
    } else {
        triggerCustomGameOver(false, "🔥 SYSTEM CRASHED");
    }
}

// --- COMPLETELY CUSTOM GLOWING GAME OVER OVERLAY SCREEN ---
function triggerCustomGameOver(isVictory, statusTitle) {
    clearInterval(pdTimer);
    
    const modalBox = document.getElementById("pd-modal-content");
    const btnZone = document.getElementById("pd-btn-zone");
    const progressZone = document.querySelector(".pd-timer-container");
    
    if (!isVictory && modalBox) {
        modalBox.classList.add("system-glitch-active");
    }

    // Rating determination
    let rating = "ROOKIE OPERATOR ⚙️<br>Your deduction logic got stuck inside an elementary sequence.";
    if (pdScore >= 75) rating = "CYBER DETECTIVE ⚡<br>Solid computational skills. You bypassed multiple core overrides.";
    if (pdScore >= 150) rating = "QUANTUM LOGIC GOD 🔥<br>Absolute Supremacy! Your brain processing limits break the mainframe.";

    // Smoothly transition internal modal to show results without breaking background layout
    setTimeout(() => {
        if(progressZone) progressZone.remove();
        if(btnZone) btnZone.remove();
        
        if(modalBox) {
            modalBox.classList.remove("system-glitch-active");
            modalBox.style.borderColor = isVictory ? "#39ff14" : "#ff007f";
            modalBox.style.boxShadow = isVictory ? "0 0 40px rgba(57,255,20,0.3)" : "0 0 40px rgba(255,0,127,0.3)";
            
            modalBox.innerHTML = `
                <span class="pd-close-x" onclick="exitPdGame()">&times;</span>
                <div class="pd-end-title" style="color: ${isVictory ? '#39ff14' : '#ff007f'}">${statusTitle}</div>
                <div style="color: #6a6a7e; font-size: 0.75rem; letter-spacing:1px;">FINAL PERFORMANCE REGISTERED</div>
                <div class="pd-end-score">${pdScore}</div>
                <div class="pd-end-rating">${rating}</div>
                <button class="pd-reboot-btn" onclick="exitPdGame(); startParadoxGameStandalone();">REBOOT MATRIX</button>
            `;
        }
    }, isVictory ? 0 : 500); // Allow brief glitch vibration for loss before screen wipes
}

function exitPdGame() {
    clearInterval(pdTimer);
    const overlay = document.getElementById("pd-overlay");
    const styleTag = document.getElementById("pd-injected-styles");
    if (overlay) overlay.remove();
    if (styleTag) styleTag.remove();
}

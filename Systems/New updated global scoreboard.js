// ==========================================================================
// GB PRODUCTION STUDIOS - ULTRA REAL-TIME HIGH SCORE AUTO ENGINE (GRAND TOTAL UPGRADE)
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, setDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0iPIwr_8ImMMsNEfS-LRyiDRXBep1BSU",
  authDomain: "neofun-c1400.firebaseapp.com",
  projectId: "neofun-c1400",
  storageBucket: "neofun-c1400.firebasestorage.app",
  messagingSenderId: "426963072723",
  appId: "1:426963072723:web:b089fd57ba0e9fe1008626",
  measurementId: "G-D74TNTW27G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const scoresRef = collection(db, "cyber_scores");

// 🎮 SYSTEM GAME KEYS DIRECTORY (Para calculation matrix)
const ALL_GAMES_LIST = ['carrom', 'chess', 'circle', 'space', 'synth_runner', 'memory', 'reflex', 'catcher_tap'];

// 📊 REAL-TIME SNAPSHOT LISTENER (Displays Rank, Name, Grand Total & Last Activity)
function syncLeaderboardData() {
    // Leaderboard par unhi ko top dikhayenge jinka "score" (Grand Total) sabse zyada hai
    const q = query(scoresRef, orderBy("score", "desc"), limit(10));
    
    onSnapshot(q, (snapshot) => {
        const leaderboardList = document.getElementById("dynamic-leaderboard-rows");
        if (!leaderboardList) return;
        
        leaderboardList.innerHTML = ""; 
        let rank = 1;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement("div");
            
            let rowBorder = "rgba(57, 255, 20, 0.15)";
            let rankColor = "#6a6a7e";
            let scoreColor = "#39ff14";
            
            if (rank === 1) { rowBorder = "rgba(255, 215, 0, 0.4)"; rankColor = "#ffd700"; scoreColor = "#ffd700"; }
            else if (rank === 2) { rowBorder = "rgba(192, 192, 192, 0.3)"; rankColor = "#c0c0c0"; scoreColor = "#c0c0c0"; }
            else if (rank === 3) { rowBorder = "rgba(205, 127, 50, 0.3)"; rankColor = "#cd7f32"; scoreColor = "#cd7f32"; }

            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(13, 17, 34, 0.85);
                border: 1px solid ${rowBorder};
                border-radius: 10px;
                padding: 12px 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                box-sizing: border-box;
                font-family: 'Orbitron', sans-serif;
                margin-bottom: 8px;
            `;
            
            let rawName = data.name || "GUEST_USER";
            let formattedName = rawName.replace(/_/g, " ").toUpperCase();
            if(formattedName.length > 14) formattedName = formattedName.substring(0, 12) + "..";

            // Sahi matrix formatting to print name, Grand score and recent match stats inside rows
            let lastPlayedInfo = data.lastPlayedGame ? `${data.lastPlayedGame.toUpperCase()} (${data.lastMatchScore || 0})` : 'NONE';

            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                    <span style="font-weight: 900; width: 35px; color: ${rankColor}; font-size: 0.95rem;">#0${rank}</span>
                    <div style="display: flex; flex-direction: column; min-width: 0;">
                        <span style="color: #ffffff; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formattedName}</span>
                        <span style="color: #6a6a7e; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.5px;">LAST: ${lastPlayedInfo}</span>
                    </div>
                </div>
                <span style="color: ${scoreColor}; font-weight: 900; font-size: 0.95rem; text-shadow: 0 0 6px ${scoreColor}50; white-space: nowrap;">${data.score || 0} PTS</span>
            `;
            leaderboardList.appendChild(row);
            rank++;
        });
    });
}

// 🚀 MASTER MATRIX CORE ENGINE: Handles Individual High Score, Recent Match Tracking & Calculates Grand Total Points
window.saveGamerScore = async function(currentGameName, finalScore) {
    // Agar single element catcher se purana code direct score bhejta hai bina name ke:
    if (typeof currentGameName === "number" || !isNaN(currentGameName)) {
        finalScore = currentGameName;
        currentGameName = "legacy_game";
    }

    const playerName = localStorage.getItem("gb_player_name") || "GUEST_USER";
    const cleanScore = parseInt(finalScore, 10);
    
    if (isNaN(cleanScore) || cleanScore <= 0) return;

    // A. LocalStorage Matrix Setup: Single game wise high score check and update
    const storageKey = `high_score_${currentGameName.trim().toLowerCase()}`;
    const previousHighScore = parseInt(localStorage.getItem(storageKey), 10) || 0;

    if (cleanScore > previousHighScore) {
        localStorage.setItem(storageKey, cleanScore);
    }

    // B. Grand Total Calculation Node: Kul games ke highest scores ka addition
    let grandTotalCumulativePoints = 0;
    ALL_GAMES_LIST.forEach(game => {
        grandTotalCumulativePoints += parseInt(localStorage.getItem(`high_score_${game}`), 10) || 0;
    });

    const docId = playerName.trim().toLowerCase().replace(/\s+/g, "_");
    const playerDocRef = doc(db, "cyber_scores", docId);

    try {
        // Target base merge configuration
        await setDoc(playerDocRef, {
            name: playerName,
            lastPlayedGame: currentGameName,          // 1. Aakhiri baar kaunsa game khela
            lastMatchScore: cleanScore,                // 2. Us aakhiri game me kitna point aaya
            score: grandTotalCumulativePoints,         // 3. Sabhi game ka grand total score
            timestamp: serverTimestamp()
        }, { merge: true });

        console.log(`🔥 Master Sync Active for ${playerName} | Grand Total: ${grandTotalCumulativePoints} PTS`);
    } catch (error) {
        console.error("❌ Firebase Secure Core Error:", error);
    }
};

// 🕵️‍♂️ AUTO SCRAPER SYSTEM NODE
function startAutomaticGameTracking() {
    const originalAlert = window.alert;
    window.alert = function(message) {
        originalAlert(message); 
        if (!message) return;
        if (message.includes("Total Registered Clicks:")) {
            const match = message.match(/Total Registered Clicks:\s*(\d+)/);
            if (match) window.saveGamerScore('catcher_tap', match[1]);
        }
        else if (message.includes("SYSTEM CLEARED!") && message.includes("Moves:")) {
            const match = message.match(/Moves:\s*(\d+)/);
            if (match) {
                const moves = parseInt(match[1]);
                const memoryScore = Math.max(100, 5000 - (moves * 75));
                window.saveGamerScore('memory', memoryScore);
            }
        }
    };

    setInterval(() => {
        const runnerMsg = document.getElementById('runner-msg');
        if (runnerMsg && runnerMsg.innerText.includes("SYSTEM REBOOT")) {
            const liveScore = localStorage.getItem('synth_runner_highscore');
            if (liveScore) window.saveGamerScore('synth_runner', liveScore);
        }

        const retryBtn = document.getElementById('catcher-tap-retry');
        if (retryBtn && window.getComputedStyle(retryBtn).display === "block") {
            const catcherScoreEl = document.getElementById('catcher-score');
            if (catcherScoreEl) {
                const txt = catcherScoreEl.innerText.replace(/\D/g, "");
                if (txt) window.saveGamerScore('catcher_tap', txt);
            }
        }

        const circleModal = document.getElementById('circle-game-modal');
        if (circleModal) {
            const circleInst = document.getElementById('game-instruction');
            if (circleInst && (circleInst.innerText.includes("RETRYING") || circleInst.innerText.includes("PRECISION") || circleInst.innerText.includes("STRUCTURE"))) {
                const circleScore = localStorage.getItem('circle_high_score');
                if (circleScore) window.saveGamerScore('circle', parseFloat(circleScore) * 10);
            }
        }

        const pdEndScore = document.querySelector('.pd-end-score');
        if (pdEndScore) {
            const txt = pdEndScore.innerText.replace(/\D/g, "");
            if (txt) window.saveGamerScore('legacy_game', txt);
        }

        const reflexStatus = document.querySelector('#game-modal div[style*="font-size: 48px"]');
        if (reflexStatus && reflexStatus.innerText.includes("ms")) {
            const ms = parseInt(reflexStatus.innerText, 10);
            if (ms > 0) {
                const reflexScore = Math.max(10, 2000 - ms);
                window.saveGamerScore('reflex', reflexScore);
            }
        }
    }, 1500); 
}

document.addEventListener("DOMContentLoaded", () => {
    syncLeaderboardData();
    startAutomaticGameTracking(); 
});

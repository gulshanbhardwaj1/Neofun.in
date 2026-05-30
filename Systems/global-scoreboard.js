// ==========================================================================
// GB PRODUCTION STUDIOS - ULTRA REAL-TIME HIGH SCORE AUTO ENGINE (FIXED MULTI-ENTRY)
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

// 📊 REAL-TIME SNAPSHOT LISTENER (Duplicates completely avoided here)
function syncLeaderboardData() {
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
            `;
            
            let rawName = data.name || "GUEST_USER";
            let formattedName = rawName.replace(/_/g, " ").toUpperCase();
            if(formattedName.length > 14) formattedName = formattedName.substring(0, 12) + "..";

            row.innerHTML = `
                <span style="font-weight: 900; width: 45px; color: ${rankColor}; font-size: 0.95rem;">#0${rank}</span>
                <span style="flex: 1; color: #ffffff; text-align: left; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 10px;">${formattedName}</span>
                <span style="color: ${scoreColor}; font-weight: 900; font-size: 0.95rem; text-shadow: 0 0 6px ${scoreColor}50;">${data.score} PTS</span>
            `;
            leaderboardList.appendChild(row);
            rank++;
        });
    });
}

// 🚀 SMART UPDATE OVERRIDE ENGINE: Only updates if score is higher!
window.saveGamerScore = async function(finalScore) {
    // LocalStorage se unique name nikalo, space ko safe format me convert karo
    const playerName = localStorage.getItem("gb_player_name") || "GUEST_USER";
    const cleanScore = parseInt(finalScore, 10);
    
    if (isNaN(cleanScore) || cleanScore <= 0) return;

    // Player ka data store karne ke liye ek fixed Document reference create karo name ke basis par
    const docId = playerName.trim().toLowerCase().replace(/\s+/g, "_");
    const playerDocRef = doc(db, "cyber_scores", docId);

    try {
        // Pehle check karo ki is unique id se entry bani hai ya nahi
        const docSnap = await getDoc(playerDocRef);

        if (docSnap.exists()) {
            const currentScore = docSnap.data().score || 0;
            // High Score check: Agar naya score purane score se jyada hai tabhi database touch hoga
            if (cleanScore > currentScore) {
                await setDoc(playerDocRef, {
                    name: playerName,
                    score: cleanScore,
                    timestamp: serverTimestamp()
                }, { merge: true });
                console.log(`🔥 New HighScore Updated for ${playerName}: ${cleanScore}`);
            } else {
                console.log(`🛡️ Score (${cleanScore}) is lower than current HighScore (${currentScore}). Skipped.`);
            }
        } else {
            // First time entry create ho rahi hai
            await setDoc(playerDocRef, {
                name: playerName,
                score: cleanScore,
                timestamp: serverTimestamp()
            });
            console.log(`🆕 Master Entry Created for ${playerName}: ${cleanScore}`);
        }
    } catch (error) {
        console.error("❌ Firebase Secure Core Error:", error);
    }
};

function startAutomaticGameTracking() {
    const originalAlert = window.alert;
    window.alert = function(message) {
        originalAlert(message); 
        if (!message) return;
        if (message.includes("Total Registered Clicks:")) {
            const match = message.match(/Total Registered Clicks:\s*(\d+)/);
            if (match) window.saveGamerScore(match[1]);
        }
        else if (message.includes("SYSTEM CLEARED!") && message.includes("Moves:")) {
            const match = message.match(/Moves:\s*(\d+)/);
            if (match) {
                const moves = parseInt(match[1]);
                const memoryScore = Math.max(100, 5000 - (moves * 75));
                window.saveGamerScore(memoryScore);
            }
        }
    };

    setInterval(() => {
        const runnerMsg = document.getElementById('runner-msg');
        if (runnerMsg && runnerMsg.innerText.includes("SYSTEM REBOOT")) {
            const liveScore = localStorage.getItem('synth_runner_highscore');
            if (liveScore) window.saveGamerScore(liveScore);
        }

        const retryBtn = document.getElementById('catcher-tap-retry');
        if (retryBtn && window.getComputedStyle(retryBtn).display === "block") {
            const catcherScoreEl = document.getElementById('catcher-score');
            if (catcherScoreEl) {
                const txt = catcherScoreEl.innerText.replace(/\D/g, "");
                if (txt) window.saveGamerScore(txt);
            }
        }

        const circleModal = document.getElementById('circle-game-modal');
        if (circleModal) {
            const circleInst = document.getElementById('game-instruction');
            if (circleInst && (circleInst.innerText.includes("RETRYING") || circleInst.innerText.includes("PRECISION") || circleInst.innerText.includes("STRUCTURE"))) {
                const circleScore = localStorage.getItem('circle_high_score');
                if (circleScore) window.saveGamerScore(parseFloat(circleScore) * 10);
            }
        }

        const pdEndScore = document.querySelector('.pd-end-score');
        if (pdEndScore) {
            const txt = pdEndScore.innerText.replace(/\D/g, "");
            if (txt) window.saveGamerScore(txt);
        }

        const reflexStatus = document.querySelector('#game-modal div[style*="font-size: 48px"]');
        if (reflexStatus && reflexStatus.innerText.includes("ms")) {
            const ms = parseInt(reflexStatus.innerText);
            if (ms > 0) {
                const reflexScore = Math.max(10, 2000 - ms);
                window.saveGamerScore(reflexScore);
            }
        }
    }, 1500); 
}

document.addEventListener("DOMContentLoaded", () => {
    syncLeaderboardData();
    startAutomaticGameTracking(); 
});
              

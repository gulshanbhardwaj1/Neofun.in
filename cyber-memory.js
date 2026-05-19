// ===================================================
// CYBER MEMORY FLIP - BULLETPROOF INITIALIZATION
// ===================================================

function initCyberMemoryGame() {
    console.log("Checking for Cyber Memory Flip Button...");
    
    // 1. Aapke index.html ke trending section se game title dhoondhna
    const allCards = document.querySelectorAll('.game-card');
    let targetButton = null;

    allCards.forEach(card => {
        const title = card.querySelector('.game-title');
        // Check text content matches 'Cyber Memory Flip'
        if (title && title.textContent.trim().includes('Cyber Memory Flip')) {
            targetButton = card.querySelector('.btn-play');
        }
    });

    // Fallback: Agar card class kaam na kare toh poore page par buttons dhoondho
    if (!targetButton) {
        const allButtons = document.querySelectorAll('.btn-play');
        allButtons.forEach(btn => {
            if (btn.closest('.game-card') && btn.closest('.game-card').innerHTML.includes('Cyber Memory Flip')) {
                targetButton = btn;
            }
        });
    }

    if (targetButton) {
        console.log("🎯 Cyber Memory Flip Button Found! Attaching Event Listener.");
        
        // Purane bache-kuche events ko clear karke fresh click listener lagana
        targetButton.replaceWith(targetButton.cloneNode(true));
        const freshButton = document.querySelectorAll('.game-card');
        
        // Re-locate the fresh button to bind action safely
        let finalBtn = null;
        freshButton.forEach(card => {
            if (card.innerHTML.includes('Cyber Memory Flip')) finalBtn = card.querySelector('.btn-play');
        });

        if (finalBtn) {
            finalBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Stop page refreshing or jumping
                setupCyberGameBoardOverlay();
            });
        }
    } else {
        console.log("⚠️ Button not found yet, retrying in 500ms...");
        setTimeout(initCyberMemoryGame, 500); // Agar page slow hai toh 0.5 sec baad fir try karega
    }
}

// 2. Fullscreen Cyber Popup Matrix Dashboard Generator
function setupCyberGameBoardOverlay() {
    const existing = document.getElementById('cyber-memory-popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cyber-memory-popup';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(7, 11, 25, 0.99); z-index: 99999;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-family: 'Orbitron', sans-serif; color: #ffffff; padding: 20px; box-sizing: border-box;
    `;

    overlay.innerHTML = `
        <div style="position: absolute; top: 20px; right: 25px; font-size: 2.5rem; color: #ff007f; cursor: pointer; font-weight: bold; user-select:none;" id="close-memory-game">×</div>
        <h2 style="color: #00f0ff; text-shadow: 0 0 10px rgba(0,240,255,0.5); margin-bottom: 5px; font-size: 1.6rem; letter-spacing:1px; font-weight:900; text-align:center;">CYBER MEMORY</h2>
        <h3 id="memory-score" style="color: #39ff14; text-shadow: 0 0 5px #39ff14; margin-bottom: 25px; font-size: 1rem; letter-spacing:1px;">MATCHES: 0 / 8</h3>
        
        <div class="popup-memory-grid" style="
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
            width: 100%; max-width: 350px; aspect-ratio: 1; margin-bottom: 30px;
        "></div>

        <button id="reset-memory-btn" style="
            background: rgba(0, 240, 255, 0.05); border: 1px solid #00f0ff; color: #00f0ff;
            padding: 12px 30px; border-radius: 6px; font-family: 'Orbitron', sans-serif;
            font-weight: bold; cursor: pointer; box-shadow: 0 0 10px rgba(0,240,255,0.2); letter-spacing: 1px;
        ">RESET MATRIX</button>
    `;

    document.body.appendChild(overlay);

    // Matrix Engine Core Variables
    const cyberIcons = ['🤖', '💻', '⚡', '📐', '🐍', '👑', '🌌', '👾'];
    let gameDeck = [...cyberIcons, ...cyberIcons];
    let firstCard = null, secondCard = null, lockBoard = false, matchesFound = 0;

    const gameGrid = overlay.querySelector('.popup-memory-grid');
    const scoreDisplay = overlay.getElementById('memory-score');
    const resetBtn = overlay.getElementById('reset-memory-btn');
    const closeBtn = overlay.getElementById('close-memory-game');

    closeBtn.addEventListener('click', () => overlay.remove());

    function shuffle() {
        for (let i = gameDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameDeck[i], gameDeck[j]] = [gameDeck[j], gameDeck[i]];
        }
    }

    function initBoard() {
        gameGrid.innerHTML = '';
        shuffle();
        firstCard = null; secondCard = null; lockBoard = false; matchesFound = 0;
        scoreDisplay.innerText = 'MATCHES: 0 / 8';

        gameDeck.forEach((icon) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: #0b0b14; border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 8px;
                display: flex; align-items: center; justify-content: center; font-size: 1.6rem;
                cursor: pointer; user-select: none; transition: all 0.2s ease; position: relative;
            `;
            card.dataset.icon = icon;
            card.innerText = '?';
            card.style.color = 'rgba(0, 240, 255, 0.4)';

            card.addEventListener('click', () => {
                if (lockBoard || card === firstCard || card.classList.contains('matched')) return;

                card.innerText = card.dataset.icon;
                card.style.background = 'rgba(0, 240, 255, 0.15)';
                card.style.borderColor = '#00f0ff';
                card.style.color = '#ffffff';

                if (!firstCard) {
                    firstCard = card;
                    return;
                }

                secondCard = card;
                lockBoard = true;

                if (firstCard.dataset.icon === secondCard.dataset.icon) {
                    firstCard.classList.add('matched');
                    secondCard.classList.add('matched');
                    firstCard.style.borderColor = '#39ff14';
                    secondCard.style.borderColor = '#39ff14';
                    firstCard.style.background = 'rgba(57, 255, 20, 0.15)';
                    secondCard.style.background = 'rgba(57, 255, 20, 0.15)';
                    
                    matchesFound++;
                    scoreDisplay.innerText = `MATCHES: ${matchesFound} / 8`;
                    firstCard = null; secondCard = null; lockBoard = false;

                    if (matchesFound === cyberIcons.length) {
                        setTimeout(() => alert('👑 MATRIX SOLVED! Cyber Memory Matrix Cleared! 💥'), 300);
                    }
                } else {
                    setTimeout(() => {
                        firstCard.innerText = '?'; secondCard.innerText = '?';
                        firstCard.style.background = '#0b0b14'; secondCard.style.background = '#0b0b14';
                        firstCard.style.borderColor = 'rgba(0, 240, 255, 0.3)'; secondCard.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                        firstCard.style.color = 'rgba(0, 240, 255, 0.4)'; secondCard.style.color = 'rgba(0, 240, 255, 0.4)';
                        firstCard = null; secondCard = null; lockBoard = false;
                    }, 700);
                }
            });
            gameGrid.appendChild(card);
        });
    }

    resetBtn.addEventListener('click', initBoard);
    initBoard();
}

// Dom Loading aur safe triggers triggers logic execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCyberMemoryGame);
} else {
    initCyberMemoryGame();
}
window.addEventListener('load', initCyberMemoryGame);

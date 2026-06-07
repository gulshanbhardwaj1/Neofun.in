/**
 * NEO.FUN - Reflex Test Game Module
 */

document.addEventListener("DOMContentLoaded", () => {
    initReflexGame(); 
});

function initReflexGame() {
    const modal = document.createElement("div");
    modal.id = "game-modal";
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(5, 5, 8, 0.95); z-index: 2000;
        display: flex; justify-content: center; align-items: center;
        opacity: 0; visibility: hidden; transition: all 0.4s ease;
    `;
    
    const gameBox = document.createElement("div");
    gameBox.style.cssText = `
        width: 90%; max-width: 600px; height: 400px;
        background: #0f0f1a; border: 2px solid var(--neon-blue);
        border-radius: 16px; display: flex; flex-direction: column;
        justify-content: center; align-items: center; cursor: pointer;
        user-select: none; position: relative; text-align: center; padding: 20px;
    `;
    
    gameBox.innerHTML = `
        <div style="position: absolute; top: 15px; right: 20px; font-size: 24px; color: #fff; cursor: pointer; z-index: 10;" id="close-game">×</div>
        <h2 id="game-status-text" style="font-family: var(--font-display); color: #fff; font-size: 1.8rem; pointer-events: none;">REFLEX TEST</h2>
        <p id="game-sub-text" style="color: var(--text-muted); margin-top: 15px; pointer-events: none;">Click anywhere inside this box to start.</p>
    `;
    
    modal.appendChild(gameBox);
    document.body.appendChild(modal);

    const playButtons = document.querySelectorAll(".btn-play");
    const reflexPlayBtn = playButtons[1]; 

    if(reflexPlayBtn) {
        reflexPlayBtn.addEventListener("click", () => {
            modal.style.opacity = "1";
            modal.style.visibility = "visible";
            resetGame();
        });
    }

    document.getElementById("close-game").addEventListener("click", (e) => {
        e.stopPropagation();
        modal.style.opacity = "0";
        modal.style.visibility = "hidden";
        clearTimeout(gameTimeout);
    });

    let gameState = "IDLE"; 
    let startTime = 0;
    let gameTimeout = null;
    const statusText = document.getElementById("game-status-text");
    const subText = document.getElementById("game-sub-text");

    function resetGame() {
        gameState = "IDLE";
        gameBox.style.background = "#0f0f1a";
        gameBox.style.borderColor = "var(--neon-blue)";
        statusText.innerText = "REFLEX TEST";
        statusText.style.color = "#fff";
        subText.innerText = "Click anywhere inside this box to start.";
        subText.style.color = "var(--text-muted)";
    }

    gameBox.addEventListener("click", () => {
        if (gameState === "IDLE") {
            gameState = "WAITING";
            gameBox.style.background = "#ff3333"; 
            gameBox.style.borderColor = "#ff3333";
            statusText.innerText = "WAIT FOR GREEN...";
            subText.innerText = "Don't click yet!";
            
            const randomDelay = Math.random() * 3000 + 2000;
            gameTimeout = setTimeout(() => {
                gameState = "READY";
                gameBox.style.background = "var(--neon-green)"; 
                gameBox.style.borderColor = "var(--neon-green)";
                statusText.innerText = "CLICK NOW!!!";
                statusText.style.color = "#000";
                subText.style.color = "#000";
                startTime = performance.now();
            }, randomDelay);

        } else if (gameState === "WAITING") {
            clearTimeout(gameTimeout);
            gameState = "IDLE";
            gameBox.style.background = "#0f0f1a";
            gameBox.style.borderColor = "var(--neon-red)";
            statusText.innerText = "TOO EARLY!";
            statusText.style.color = "#fff";
            subText.innerText = "Click to try again.";
            subText.style.color = "var(--text-muted)";

        } else if (gameState === "READY") {
            const endTime = performance.now();
            const reactionTime = Math.round(endTime - startTime);
            gameState = "IDLE";
            gameBox.style.background = "#0f0f1a";
            gameBox.style.borderColor = "var(--neon-cyan)";
            statusText.innerText = `${reactionTime} ms`;
            statusText.style.color = "#fff";
            subText.innerText = reactionTime < 250 ? "⚡ Godlike reflexes!" : "Not bad, click to try again.";
            subText.style.color = "var(--text-muted)";
        }
    });
}

// ===================================================
// CYBER MEMORY FLIP - GAME MATRIX LOGIC
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    // Cyber/Matrix themed symbols for cards (Total 8 pairs = 16 cards)
    const cyberIcons = ['🤖', '💻', '⚡', '📐', '🐍', '👑', '🌌', '👾'];
    // Do baar icons ko merge karke deck banaya taaki pairs ban sakein
    let gameDeck = [...cyberIcons, ...cyberIcons];
    
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;
    let matchesFound = 0;
    
    const gameGrid = document.querySelector('.memory-grid');
    const resetBtn = document.getElementById('reset-memory-btn');
    const scoreDisplay = document.getElementById('memory-score');

    // 1. SHUFFLE SYSTEM (Deck ko random mix karne ke liye)
    function shuffleDeck() {
        for (let i = gameDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameDeck[i], gameDeck[j]] = [gameDeck[j], gameDeck[i]];
        }
    }

    // 2. CREATE BOARD SYSTEM (HTML Cards dynamic generate karne ke liye)
    function createBoard() {
        if (!gameGrid) return;
        gameGrid.innerHTML = ''; // Purana board saaf karne ke liye
        shuffleDeck();
        
        matchesFound = 0;
        if (scoreDisplay) scoreDisplay.innerText = 'Matches: 0 / 8';

        gameDeck.forEach((icon, index) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.icon = icon;
            card.dataset.index = index;

            // Inside HTML structure for 3D flip effect
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">?</div>
                    <div class="card-back">${icon}</div>
                </div>
            `;

            card.addEventListener('click', flipCard);
            gameGrid.appendChild(card);
        });
    }

    // 3. FLIP CARD LOGIC
    function flipCard() {
        if (lockBoard) return; // Agar matching chal rahi hai toh click block karo
        if (this === firstCard) return; // Same card par double click check

        this.classList.add('flipped');

        if (!firstCard) {
            // Pehla card touch hua
            firstCard = this;
            return;
        }

        // Doosra card touch hua
        secondCard = this;
        checkForMatch();
    }

    // 4. MATCH CHECKING SYSTEM
    function checkForMatch() {
        let isMatch = firstCard.dataset.icon === secondCard.dataset.icon;
        
        if (isMatch) {
            disableCards();
        } else {
            unflipCards();
        }
    }

    // 5. IF CARDS MATCH (Dono barabar hain)
    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');

        matchesFound++;
        if (scoreDisplay) scoreDisplay.innerText = `Matches: ${matchesFound} / 8`;

        resetTurn();

        // Check if game completed
        if (matchesFound === cyberIcons.length) {
            setTimeout(() => {
                alert('💥 MATRIX SOLVED! Cyber Memory Matrix Cleared! 👑');
            }, 500);
        }
    }

    // 6. IF CARDS DON'T MATCH (Galat guess par wapas palatna)
    function unflipCards() {
        lockBoard = true;

        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetTurn();
        }, 1000); // 1 second tak card dikhega phir wapas band ho jayega
    }

    // 7. RESET TURN VARIABLES
    function resetTurn() {
        [firstCard, secondCard] = [null, null];
        lockBoard = false;
    }

    // Reset Button Event Listener
    if (resetBtn) {
        resetBtn.addEventListener('click', createBoard);
    }

    // Start Game on Load
    createBoard();
});
          

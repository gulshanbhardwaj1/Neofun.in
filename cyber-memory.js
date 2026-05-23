// ===============================
// CYBER MEMORY FLIP GAME
// FINAL SOFT NEON VERSION
// FILE: cyber-memory.js
// ===============================

(() => {

const memoryCard = [...document.querySelectorAll('.game-card')]
.find(card =>
card.querySelector('.game-title')?.textContent
.includes('Cyber Memory Flip')
);

if (!memoryCard) return;

const playBtn = memoryCard.querySelector('.btn-play');

playBtn.addEventListener('click', openMemoryGame);

function openMemoryGame() {

if (document.querySelector('.memory-game-overlay')) return;

const overlay = document.createElement('div');
overlay.className = 'memory-game-overlay';

overlay.innerHTML = `
<div class="memory-game-box">

<div class="memory-topbar">
<h2>🧩 CYBER MEMORY FLIP</h2>
<button class="memory-close">✕</button>
</div>

<div class="memory-stats">
<div>Moves: <span id="memory-moves">0</span></div>
<div>Pairs: <span id="memory-pairs">0</span>/8</div>
</div>

<div class="memory-grid"></div>

<div class="memory-bottom">
<button class="memory-restart">RESTART</button>
</div>

</div>
`;

document.body.appendChild(overlay);

const style = document.createElement('style');

style.innerHTML = `

.memory-game-overlay{
position:fixed;
inset:0;
background:rgba(0,0,0,0.88);
backdrop-filter:blur(8px);
display:flex;
justify-content:center;
align-items:center;
z-index:99999;
padding:20px;
animation:fadeIn .3s ease;
}

.memory-game-box{
width:100%;
max-width:430px;
background:#070b19;
border:1px solid rgba(0,255,255,0.4);
border-radius:18px;
padding:20px;
box-shadow:0 0 22px rgba(0,255,255,0.18);
}

.memory-topbar{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:18px;
}

.memory-topbar h2{
font-family:'Orbitron',sans-serif;
font-size:1rem;
color:#00ffff;
letter-spacing:1px;
}

.memory-close{
background:none;
border:none;
color:#fff;
font-size:1.4rem;
cursor:pointer;
}

.memory-stats{
display:flex;
justify-content:space-between;
margin-bottom:18px;
font-size:.9rem;
color:#39ff14;
font-family:'Orbitron',sans-serif;
}

.memory-grid{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:12px;
}

.memory-card{
aspect-ratio:1/1;
background:#111827;
border:1px solid rgba(255,255,255,0.08);
border-radius:12px;
display:flex;
justify-content:center;
align-items:center;
font-size:2rem;
cursor:pointer;
position:relative;
transform-style:preserve-3d;
transition:transform .4s;
}

.memory-card.flip{
transform:rotateY(180deg);
}

.memory-front,
.memory-back{
position:absolute;
inset:0;
display:flex;
justify-content:center;
align-items:center;
border-radius:12px;
backface-visibility:hidden;
}

.memory-front{
background:linear-gradient(135deg,#00f0ff,#ff007f);
font-size:1.5rem;
font-weight:bold;
}

.memory-back{
background:#0f172a;
transform:rotateY(180deg);
color:#fff;
border:1px solid rgba(255,255,255,0.06);
}

/* MATCHED CARD SOFT VERSION */
.memory-card.matched .memory-back{
background:#16241a;
color:#8dff8d;
border:1px solid rgba(57,255,20,0.22);

box-shadow:
0 0 6px rgba(57,255,20,0.12),
0 0 12px rgba(57,255,20,0.06);
}

.memory-bottom{
margin-top:20px;
text-align:center;
}

.memory-restart{
padding:10px 20px;
background:transparent;
border:1px solid rgba(0,255,255,0.5);
color:#00ffff;
border-radius:10px;
cursor:pointer;
font-family:'Orbitron',sans-serif;
font-size:.8rem;
letter-spacing:1px;
transition:.3s;
}

.memory-restart:hover{
background:#00ffff;
color:#000;
}

@keyframes fadeIn{
from{
opacity:0;
transform:scale(.96);
}
to{
opacity:1;
transform:scale(1);
}
}

@media(max-width:500px){

.memory-grid{
gap:8px;
}

.memory-card{
font-size:1.5rem;
}

}

`;

document.head.appendChild(style);

const grid = overlay.querySelector('.memory-grid');

const icons = [
'⚡','👾','🤖','💎',
'🛸','🔮','💠','☢️'
];

let cards = [...icons, ...icons];

cards.sort(() => Math.random() - 0.5);

let firstCard = null;
let secondCard = null;
let lock = false;
let moves = 0;
let pairs = 0;

cards.forEach(icon => {

const card = document.createElement('div');

card.className = 'memory-card';

card.innerHTML = `
<div class="memory-front">?</div>
<div class="memory-back">${icon}</div>
`;

grid.appendChild(card);

card.addEventListener('click', () => {

if (
lock ||
card.classList.contains('flip') ||
card.classList.contains('matched')
) return;

card.classList.add('flip');

if (!firstCard) {
firstCard = card;
return;
}

secondCard = card;
lock = true;
moves++;

document.getElementById('memory-moves').textContent = moves;

const firstIcon =
firstCard.querySelector('.memory-back').textContent;

const secondIcon =
secondCard.querySelector('.memory-back').textContent;

if (firstIcon === secondIcon) {

firstCard.classList.add('matched');
secondCard.classList.add('matched');

pairs++;

document.getElementById('memory-pairs').textContent = pairs;

firstCard = null;
secondCard = null;
lock = false;

if (pairs === 8) {

setTimeout(() => {

alert(
'🏆 SYSTEM CLEARED!\n\nMoves: ' + moves
);

}, 300);

}

} else {

setTimeout(() => {

firstCard.classList.remove('flip');
secondCard.classList.remove('flip');

firstCard = null;
secondCard = null;
lock = false;

}, 700);

}

});

});

overlay.querySelector('.memory-close')
.addEventListener('click', () => {

overlay.remove();
style.remove();

});

overlay.querySelector('.memory-restart')
.addEventListener('click', () => {

overlay.remove();
style.remove();
openMemoryGame();

});

}

})();

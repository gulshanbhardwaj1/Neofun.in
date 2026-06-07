// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyA0iPIwr_8ImMMsNEfS-LRyiDRXBep1BSU",
  authDomain: "neofun-c1400.firebaseapp.com",
  databaseURL: "https://neofun-c1400-default-rtdb.firebaseio.com",
  projectId: "neofun-c1400",
  storageBucket: "neofun-c1400.firebasestorage.app",
  messagingSenderId: "426963072723",
  appId: "1:426963072723:web:b089fd57ba0e9fe1008626",
  measurementId: "G-D74TNTW27G"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let chessInstance = new Chess();

// DOM References
const boardElement = document.getElementById('chessboard');
const pWhite = document.getElementById('p-white');
const pBlack = document.getElementById('p-black');
const menuPopup = document.getElementById('menu-popup');
const onlinePopup = document.getElementById('online-popup');
const gameOverPopup = document.getElementById('gameover-popup');
const gameArea = document.getElementById('game-area');
const gameModeTitle = document.getElementById('game-mode-title');
const roomIdInput = document.getElementById('room-id-input');
const onlineStatusText = document.getElementById('online-status-text');
const gameOverMsg = document.getElementById('gameover-msg');
const copyLinkBtn = document.getElementById('copy-link-btn');

// Audio Dom Links
const sfxMove = document.getElementById('sfx-move');
const sfxCapture = document.getElementById('sfx-capture');
const sfxLoser = document.getElementById('sfx-loser');
const sfxVictory = document.getElementById('sfx-victory');

// 🎚️ SOUND BOOSTER ENGINE
function maximizeAudioLevels() {
    if(sfxMove) sfxMove.volume = 1.0;
    if(sfxCapture) sfxCapture.volume = 1.0;
    if(sfxLoser) sfxLoser.volume = 1.0;
    if(sfxVictory) sfxVictory.volume = 1.0;
}

// App State Engine Arrays
let selectedSquareName = null;
let validSquares = [];
let gameMode = 'offline'; 
let myColor = 'white'; 
let currentRoomId = null;
let isRoomActive = false;
let lastMoveSquares = [];

// --- ADVANCED BOT ALGORITHM ENGINE ---
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PAWN_PST = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];
const KNIGHT_PST = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];
const BISHOP_PST = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];
const ROOK_PST = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
];
const QUEEN_PST = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];
const KING_PST = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20], // 🛠️ FIXED COMMA HERE
    [20, 30, 10,  0,  0, 10, 30, 20]
];
const PSTs = { p: PAWN_PST, n: KNIGHT_PST, b: BISHOP_PST, r: ROOK_PST, q: QUEEN_PST, k: KING_PST };

function evaluateBoard(game) {
    let totalEvaluation = 0;
    const board = game.board();
    const activeColor = game.turn();
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = board[r][c];
            if (square) {
                const type = square.type;
                const color = square.color;
                let value = PIECE_VALUES[type];
                const tableRow = (color === 'b') ? (7 - r) : r;
                value += PSTs[type][tableRow][c];
                if (color === activeColor) totalEvaluation += value;
                else totalEvaluation -= value;
            }
        }
    }
    return totalEvaluation;
}

function negamax(game, depth, alpha, beta) {
    if (game.in_checkmate()) return -Infinity + (3 - depth);
    if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) return 0;
    if (depth === 0) return evaluateBoard(game);

    const moves = game.moves({ verbose: true });
    moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));
    let maxEval = -Infinity;

    for (const move of moves) {
        game.move(move);
        const evaluation = -negamax(game, depth - 1, -beta, -alpha);
        game.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (alpha >= beta) break;
    }
    return maxEval;
}

function getBestMove(game, depth = 3) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    let bestMove = null;
    let bestValue = -Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of moves) {
        game.move(move);
        const boardValue = -negamax(game, depth - 1, -beta, -alpha);
        game.undo();
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move; 
        }
        alpha = Math.max(alpha, boardValue);
    }
    return bestMove;
}

// --- SOUND DISPATCH PIPELINE ---
function playSoundFeedback(moveResult) {
    maximizeAudioLevels();
    if (!sfxCapture || !sfxMove) return;
    
    if (moveResult && (moveResult.captured || moveResult.san.includes('x'))) {
        sfxCapture.currentTime = 0;
        sfxCapture.play().catch(e => console.log("Audio waiting for interaction"));
    } else {
        sfxMove.currentTime = 0;
        sfxMove.play().catch(e => console.log("Audio waiting for interaction"));
    }
}

// --- PREMIUM ASSETS AS DATA DICTIONARY ---
const ASSET_PIECES = {
    'wp': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'wr': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'wn': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'wb': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'wq': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'wk': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    'bp': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    'br': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'bn': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'bb': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'bq': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'bk': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
};

function goToGrid() { window.location.href = "../../../index.html"; }

function selectMode(mode) {
    maximizeAudioLevels(); 
    gameMode = mode;
    if(menuPopup) menuPopup.classList.add('hidden');
    if(gameArea) gameArea.classList.remove('hidden');
    if(onlineStatusText) onlineStatusText.innerText = "";
    if(copyLinkBtn) copyLinkBtn.classList.add('hidden');
    lastMoveSquares = [];
    
    if (mode === 'offline' && gameModeTitle) gameModeTitle.innerText = "LOCAL VS";
    if (mode === 'bot' && gameModeTitle) gameModeTitle.innerText = "VS PRO BOT (AI)";
    
    resetGame();
    if(sfxMove) sfxMove.play().then(() => { sfxMove.pause(); }).catch(e => {});
}

function showOnlineMenu() { 
    if(menuPopup) menuPopup.classList.add('hidden'); 
    if(onlinePopup) onlinePopup.classList.remove('hidden'); 
}
function backToMainMenu() { 
    if(onlinePopup) onlinePopup.classList.add('hidden'); 
    if(menuPopup) menuPopup.classList.remove('hidden'); 
}

function backToMenu() {
    if (gameMode === 'online' && currentRoomId) database.ref('chess_rooms/' + currentRoomId).off();
    window.history.replaceState({}, document.title, window.location.pathname);
    if(menuPopup) menuPopup.classList.remove('hidden');
    if(onlinePopup) onlinePopup.classList.add('hidden');
    if(gameArea) gameArea.classList.add('hidden');
    if(gameOverPopup) gameOverPopup.classList.add('hidden');
}

function resetGame() {
    chessInstance.reset();
    selectedSquareName = null;
    validSquares = [];
    lastMoveSquares = [];
    renderBoard();
}

function checkGameStatus() {
    if (chessInstance.game_over()) {
        maximizeAudioLevels();
        let message = "MATCH DRAW!";
        let isCheckmate = chessInstance.in_checkmate();
        let losingSide = chessInstance.turn(); 

        if (isCheckmate) {
            if (gameMode === 'bot') {
                if (losingSide === 'w') {
                    message = "BOT WINS! YOU ARE A LOSER 🤖😂";
                    if(sfxLoser) { sfxLoser.currentTime = 0; sfxLoser.play().catch(e => {}); }
                } else {
                    message = "VICTORY! YOU BEAT THE MATRIX 🏆🔥";
                    if(sfxVictory) { sfxVictory.currentTime = 0; sfxVictory.play().catch(e => {}); }
                }
            } else {
                message = losingSide === 'w' ? "BLACK WINS! (CHECKMATE)" : "WHITE WINS! (CHECKMATE)";
                if(sfxVictory) { sfxVictory.currentTime = 0; sfxVictory.play().catch(e => {}); }
            }
        } else {
            if(sfxMove) { sfxMove.currentTime = 0; sfxMove.play().catch(e => {}); }
        }
        
        if(gameOverMsg) gameOverMsg.innerText = message;
        if(gameOverPopup) gameOverPopup.classList.remove('hidden');
        return true;
    }
    return false;
}

function restartFromGameOver() {
    if(gameOverPopup) gameOverPopup.classList.add('hidden');
    lastMoveSquares = [];
    if (gameMode === 'online') {
        database.ref('chess_rooms/' + currentRoomId).update({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' });
    } else { resetGame(); }
}

function exitToMenuFromGameOver() { 
    if(gameOverPopup) gameOverPopup.classList.add('hidden'); 
    backToMenu(); 
}

// --- ADVANCED RENDER ENGINE ---
function renderBoard() {
    if(!boardElement) return;
    boardElement.innerHTML = '';
    const boardState = chessInstance.board();
    let isFlipped = (gameMode === 'online' && myColor === 'black');

    const colNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {
        let row = isFlipped ? (7 - r) : r;
        for (let c = 0; c < 8; c++) {
            let col = isFlipped ? (7 - c) : c;
            
            const squareObj = boardState[row][col];
            const squareName = colNames[col] + (8 - row);
            
            const squareSquare = document.createElement('div');
            const isEven = (row + col) % 2 === 0;
            squareSquare.className = `square ${isEven ? 'white-square' : 'black-square'}`;
            
            if (squareObj) {
                const lookupKey = squareObj.color + squareObj.type;
                const imgNode = document.createElement('img');
                imgNode.src = ASSET_PIECES[lookupKey];
                imgNode.className = "chess-piece";
                squareSquare.appendChild(imgNode);
            }

            if (selectedSquareName === squareName) {
                const color = squareObj ? squareObj.color : 'w';
                squareSquare.classList.add(color === 'w' ? 'selected-white' : 'selected-black');
            }

            if (validSquares.includes(squareName)) {
                squareSquare.classList.add('valid-move');
            }

            if (lastMoveSquares.includes(squareName)) {
                squareSquare.classList.add('last-move-highlight');
            }

            squareSquare.addEventListener('click', () => handleSquareInteraction(squareName));
            boardElement.appendChild(squareSquare);
        }
    }
    
    if(pWhite && pBlack) {
        if (chessInstance.turn() === 'w') {
            pWhite.classList.add('active'); pBlack.classList.remove('active');
        } else {
            pBlack.classList.add('active'); pWhite.classList.remove('active');
        }
    }
}

// --- INTERACTION PIPELINE MANAGER ---
function handleSquareInteraction(squareName) {
    if (chessInstance.game_over()) return;
    if (gameMode === 'bot' && chessInstance.turn() === 'b') return;
    if (gameMode === 'online' && (!isRoomActive || chessInstance.turn() !== myColor)) return;

    const piece = chessInstance.get(squareName);

    if (selectedSquareName === null) {
        if (piece && piece.color === chessInstance.turn()) {
            selectedSquareName = squareName;
            const moves = chessInstance.moves({ square: squareName, verbose: true });
            validSquares = moves.map(m => m.to);
            renderBoard();
        }
    } else {
        if (validSquares.includes(squareName)) {
            let opMove = chessInstance.move({ from: selectedSquareName, to: squareName, promotion: 'q' });
            
            if (opMove) {
                lastMoveSquares = [opMove.from, opMove.to];
                playSoundFeedback(opMove);
            }

            selectedSquareName = null;
            validSquares = [];
            const over = checkGameStatus();
            
            if (gameMode === 'online') {
                database.ref('chess_rooms/' + currentRoomId).update({ fen: chessInstance.fen() });
            } else if (!over && gameMode === 'bot' && chessInstance.turn() === 'b') {
                renderBoard();
                setTimeout(triggerBotTurn, 550);
            } else {
                renderBoard();
            }
        } else {
            if (piece && piece.color === chessInstance.turn()) {
                selectedSquareName = squareName;
                const moves = chessInstance.moves({ square: squareName, verbose: true });
                validSquares = moves.map(m => m.to);
            } else {
                selectedSquareName = null;
                validSquares = [];
            }
            renderBoard();
        }
    }
}

function triggerBotTurn() {
    if (chessInstance.game_over()) return;
    
    const bestMove = getBestMove(chessInstance, 3);
    if (bestMove) {
        let aiMoveResult = chessInstance.move(bestMove);
        if (aiMoveResult) {
            lastMoveSquares = [aiMoveResult.from, aiMoveResult.to];
            playSoundFeedback(aiMoveResult);
        }
        checkGameStatus();
        renderBoard();
    }
}

// --- CLOUD INTERFACE MULTIPLAYER SYNC ---
function copyInviteLink() {
    if (!currentRoomId || !copyLinkBtn) return;
    const inviteLink = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
        const txt = copyLinkBtn.innerText; copyLinkBtn.innerText = "✅ Link Copied!";
        setTimeout(() => { copyLinkBtn.innerText = txt; }, 2000);
    });
}

function createNewRoom() {
    gameMode = 'online'; myColor = 'w';
    currentRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    lastMoveSquares = [];
    
    database.ref('chess_rooms/' + currentRoomId).set({
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        status: 'waiting', player2: 'none'
    }).then(() => {
        if(onlinePopup) onlinePopup.classList.add('hidden'); 
        if(gameArea) gameArea.classList.remove('hidden');
        if(copyLinkBtn) copyLinkBtn.classList.remove('hidden'); 
        if(gameModeTitle) gameModeTitle.innerText = "ONLINE MATCH";
        if(onlineStatusText) onlineStatusText.innerText = `Room ID: ${currentRoomId}`;
        resetGame(); listenToRoomUpdates();
    });
}

function joinRoomById(enteredId) {
    gameMode = 'online'; myColor = 'b'; currentRoomId = enteredId;
    lastMoveSquares = [];
    database.ref('chess_rooms/' + currentRoomId).once('value', (snap) => {
        if (!snap.exists()) { alert("Room not found!"); backToMenu(); return; }
        const data = snap.val();
        if (data.status === 'active' && data.player2 !== 'connected') { alert("Room full!"); backToMenu(); return; }
        
        database.ref('chess_rooms/' + currentRoomId).update({ status: 'active', player2: 'connected' }).then(() => {
            if(menuPopup) menuPopup.classList.add('hidden'); 
            if(onlinePopup) onlinePopup.classList.add('hidden');
            if(gameArea) gameArea.classList.remove('hidden'); 
            if(copyLinkBtn) copyLinkBtn.classList.add('hidden');
            if(gameModeTitle) gameModeTitle.innerText = "ONLINE MATCH"; 
            if(onlineStatusText) onlineStatusText.innerText = `Room ID: ${currentRoomId} (Black)`;
            listenToRoomUpdates();
        });
    });
}

function joinExistingRoom() {
    if(!roomIdInput) return;
    const code = roomIdInput.value.trim().toUpperCase();
    if (code) joinRoomById(code);
}

function listenToRoomUpdates() {
    database.ref('chess_rooms/' + currentRoomId).on('value', (snap) => {
        const data = snap.val(); if (!data) return;
        
        if (chessInstance.fen() !== data.fen && chessInstance.fen() !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            const tempChess = new Chess(chessInstance.fen());
            const evaluatedMove = tempChess.move(data.fen); 
            maximizeAudioLevels();
            if(evaluatedMove) {
                playSoundFeedback(evaluatedMove);
            } else {
                if(sfxMove) { sfxMove.currentTime = 0; sfxMove.play().catch(e => {}); }
            }
        }
        
        chessInstance.load(data.fen);
        if (data.status === 'active') {
            isRoomActive = true;
            if (myColor === 'w' && onlineStatusText) { onlineStatusText.innerText = "Friend Connected! Play your move."; if(copyLinkBtn) copyLinkBtn.classList.add('hidden'); }
        }
        checkGameStatus();
        renderBoard();
    });
}

function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) joinRoomById(room.toUpperCase());
}

renderBoard();
checkUrlParams();

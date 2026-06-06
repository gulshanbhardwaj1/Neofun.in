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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Chess.js Instance Create Kiya
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

// App Variables
let selectedSquareName = null;
let validSquares = [];
let gameMode = 'offline'; 
let myColor = 'white'; 
let currentRoomId = null;
let isRoomActive = false;

// --- ADVANCED BOT ALGORITHM ENGINE (Aapka Code) ---
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PAWN_PST = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [100, 10, 20, 30, 30, 20, 10, 100],
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
    [20, 20,  0,  0,  0,  0, 20, 20],
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
    if (game.isCheckmate()) return -Infinity + (3 - depth);
    if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;
    if (depth === 0) return evaluateBoard(game);

    const moves = game.moves({ verbose: true });
    moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));
    let maxEval = -Infinity;

    for (const move of moves) {
        game.move(move.san);
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
        game.move(move.san);
        const boardValue = -negamax(game, depth - 1, -beta, -alpha);
        game.undo();
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move.san;
        }
        alpha = Math.max(alpha, boardValue);
    }
    return bestMove;
}

// --- CORE LAYOUT MANAGERS ---
function goToGrid() { window.location.href = "../../../index.html"; }

function selectMode(mode) {
    gameMode = mode;
    menuPopup.classList.add('hidden');
    gameArea.classList.remove('hidden');
    onlineStatusText.innerText = "";
    copyLinkBtn.classList.add('hidden');
    
    if (mode === 'offline') gameModeTitle.innerText = "LOCAL VS";
    if (mode === 'bot') gameModeTitle.innerText = "VS PRO BOT (AI)";
    
    resetGame();
}

function showOnlineMenu() { menuPopup.classList.add('hidden'); onlinePopup.classList.remove('hidden'); }
function backToMainMenu() { onlinePopup.classList.add('hidden'); menuPopup.classList.remove('hidden'); }

function backToMenu() {
    if (gameMode === 'online' && currentRoomId) database.ref('chess_rooms/' + currentRoomId).off();
    window.history.replaceState({}, document.title, window.location.pathname);
    menuPopup.classList.remove('hidden');
    onlinePopup.classList.add('hidden');
    gameArea.classList.add('hidden');
    gameOverPopup.classList.add('hidden');
}

function resetGame() {
    chessInstance.reset();
    selectedSquareName = null;
    validSquares = [];
    renderBoard();
}

// Check End Conditions using Library APIs
function checkGameStatus() {
    if (chessInstance.game_over()) {
        let message = "MATCH DRAW!";
        if (chessInstance.in_checkmate()) {
            message = chessInstance.turn() === 'w' ? "BLACK WINS! (CHECKMATE)" : "WHITE WINS! (CHECKMATE)";
        } else if (chessInstance.in_stalemate()) {
            message = "DRAW BY STALEMATE!";
        }
        gameOverMsg.innerText = message;
        gameOverPopup.classList.remove('hidden');
        return true;
    }
    return false;
}

function restartFromGameOver() {
    gameOverPopup.classList.add('hidden');
    if (gameMode === 'online') {
        database.ref('chess_rooms/' + currentRoomId).update({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' });
    } else { resetGame(); }
}

function exitToMenuFromGameOver() { gameOverPopup.classList.add('hidden'); backToMenu(); }

// --- RENDER MATRIX GRAPHICS ---
const UNICODE_PIECES = {
    'wp': '♙', 'wr': '♖', 'wn': '♘', 'wb': '♗', 'wq': '♕', 'wk': '♔',
    'bp': '♟', 'br': '♜', 'bn': '♞', 'bb': '♝', 'bq': '♛', 'bk': '♚'
};

function renderBoard() {
    boardElement.innerHTML = '';
    const boardState = chessInstance.board();
    
    // 🔀 UPDATE HERE: 'black' ki jagah sirf 'b' check karna hai!
    let isFlipped = (gameMode === 'online' && myColor === 'b');

    const colNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {
        // Flipped board ke liye rows ko invert karne ka sahi tarika
        let row = isFlipped ? (7 - r) : r;
        
        for (let c = 0; c < 8; c++) {
            // Flipped board ke liye columns ko invert karne ka sahi tarika
            let col = isFlipped ? (7 - c) : c;
            
            const squareObj = boardState[row][col];
            const squareName = colNames[col] + (8 - row);
            
            const squareSquare = document.createElement('div');
            const isEven = (row + col) % 2 === 0;
            squareSquare.className = `square ${isEven ? 'white-square' : 'black-square'}`;
            
            if (squareObj) {
                const lookupKey = squareObj.color + squareObj.type;
                squareSquare.innerText = UNICODE_PIECES[lookupKey] || '';
            } else {
                squareSquare.innerText = '';
            }

            if (selectedSquareName === squareName) {
                const color = squareObj ? squareObj.color : 'w';
                squareSquare.classList.add(color === 'w' ? 'selected-white' : 'selected-black');
            }

            if (validSquares.includes(squareName)) {
                squareSquare.classList.add('valid-move');
            }

            squareSquare.addEventListener('click', () => handleSquareInteraction(squareName));
            boardElement.appendChild(squareSquare);
        }
    }

    
    // Status Bar Highlights Updates
    if (chessInstance.turn() === 'w') {
        pWhite.classList.add('active'); pBlack.classList.remove('active');
    } else {
        pBlack.classList.add('active'); pWhite.classList.remove('active');
    }
}

// --- INTERACTION HANDLING LOGIC ---
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
            // Move Execute execute kiya
            chessInstance.move({ from: selectedSquareName, to: squareName, promotion: 'q' });
            selectedSquareName = null;
            validSquares = [];
            
            const over = checkGameStatus();
            
            if (gameMode === 'online') {
                database.ref('chess_rooms/' + currentRoomId).update({ fen: chessInstance.fen() });
            } else if (!over && gameMode === 'bot' && chessInstance.turn() === 'b') {
                renderBoard();
                setTimeout(triggerBotTurn, 400);
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
    // Calculation with Negamax depth 3
    const bestMove = getBestMove(chessInstance, 3);
    if (bestMove) {
        chessInstance.move(bestMove);
        checkGameStatus();
        renderBoard();
    }
}

// --- CLOUD INTERFACE MULTIPLAYER SYNC ---
function copyInviteLink() {
    if (!currentRoomId) return;
    const inviteLink = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
        const txt = copyLinkBtn.innerText; copyLinkBtn.innerText = "✅ Link Copied!";
        setTimeout(() => { copyLinkBtn.innerText = txt; }, 2000);
    });
}

function createNewRoom() {
    gameMode = 'online'; myColor = 'w';
    currentRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    database.ref('chess_rooms/' + currentRoomId).set({
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        status: 'waiting', player2: 'none'
    }).then(() => {
        onlinePopup.classList.add('hidden'); gameArea.classList.remove('hidden');
        copyLinkBtn.classList.remove('hidden'); gameModeTitle.innerText = "ONLINE MATCH";
        onlineStatusText.innerText = `Room ID: ${currentRoomId}`;
        resetGame(); listenToRoomUpdates();
    });
}

function joinRoomById(enteredId) {
    gameMode = 'online'; myColor = 'b'; currentRoomId = enteredId;
    database.ref('chess_rooms/' + currentRoomId).once('value', (snap) => {
        if (!snap.exists()) { alert("Room not found!"); backToMenu(); return; }
        const data = snap.val();
        if (data.status === 'active' && data.player2 !== 'connected') { alert("Room full!"); backToMenu(); return; }
        
        database.ref('chess_rooms/' + currentRoomId).update({ status: 'active', player2: 'connected' }).then(() => {
            menuPopup.classList.add('hidden'); onlinePopup.classList.add('hidden');
            gameArea.classList.remove('hidden'); copyLinkBtn.classList.add('hidden');
            gameModeTitle.innerText = "ONLINE MATCH"; onlineStatusText.innerText = `Room ID: ${currentRoomId} (Black)`;
            listenToRoomUpdates();
        });
    });
}

function joinExistingRoom() {
    const code = roomIdInput.value.trim().toUpperCase();
    if (code) joinRoomById(code);
}

function listenToRoomUpdates() {
    database.ref('chess_rooms/' + currentRoomId).on('value', (snap) => {
        const data = snap.val(); if (!data) return;
        chessInstance.load(data.fen);
        if (data.status === 'active') {
            isRoomActive = true;
            if (myColor === 'w') { onlineStatusText.innerText = "Friend Connected! Play your move."; copyLinkBtn.classList.add('hidden'); }
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

// Initialization Start
renderBoard();
checkUrlParams();

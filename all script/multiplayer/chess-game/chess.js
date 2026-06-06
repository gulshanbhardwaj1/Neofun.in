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

// State Variables
let initialBoard = [];
let selectedSquare = null;
let validMoves = [];
let currentTurn = 'white';
let gameMode = 'offline'; 
let isGameOver = false;

// Live State System
let currentRoomId = null;
let myColor = null; 
let isRoomActive = false;

const defaultLayout = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

// 🏠 Back to Grid Main Website Control
function goToGrid() {
    // Agar aapka koi homepage link hai (jaise index.html), toh yahan uska naam likh dein
    window.location.href = "../index.html"; 
}

function selectMode(mode) {
    gameMode = mode;
    menuPopup.classList.add('hidden');
    gameArea.classList.remove('hidden');
    onlineStatusText.innerText = "";
    
    if (mode === 'offline') gameModeTitle.innerText = "LOCAL VS";
    if (mode === 'bot') gameModeTitle.innerText = "VS BOT (AI)";

    resetGame();
}

function showOnlineMenu() {
    menuPopup.classList.add('hidden');
    onlinePopup.classList.remove('hidden');
}

function backToMainMenu() {
    onlinePopup.classList.add('hidden');
    menuPopup.classList.remove('hidden');
}

function backToMenu() {
    if (gameMode === 'online' && currentRoomId) {
        database.ref('chess_rooms/' + currentRoomId).off();
    }
    menuPopup.classList.remove('hidden');
    onlinePopup.classList.add('hidden');
    gameArea.classList.add('hidden');
    gameOverPopup.classList.add('hidden');
}

function resetGame() {
    initialBoard = JSON.parse(JSON.stringify(defaultLayout));
    selectedSquare = null;
    validMoves = [];
    currentTurn = 'white';
    isGameOver = false;
    createBoard();
}

// --- GAME OVER TRIGGERS ---
function checkKingDeath() {
    let whiteKingAlive = false;
    let blackKingAlive = false;

    // Poore board par dono rajaon ko dhoondho
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (initialBoard[r][c] === '♔') whiteKingAlive = true;
            if (initialBoard[r][c] === '♚') blackKingAlive = true;
        }
    }

    // Agar White Raja mar gaya
    if (!whiteKingAlive) {
        triggerGameOver("BLACK WINS!");
        return true;
    }
    // Agar Black Raja mar gaya
    if (!blackKingAlive) {
        triggerGameOver("WHITE WINS!");
        return true;
    }
    return false;
}

function triggerGameOver(winnerMessage) {
    isGameOver = true;
    gameOverMsg.innerText = winnerMessage;
    gameOverPopup.classList.remove('hidden'); // Game Over Screen dikhao
}

function restartFromGameOver() {
    gameOverPopup.classList.add('hidden');
    if (gameMode === 'online') {
        // Online mode mein database reset karo
        database.ref('chess_rooms/' + currentRoomId).update({
            board: defaultLayout,
            turn: 'white'
        });
    } else {
        resetGame();
    }
}

function exitToMenuFromGameOver() {
    gameOverPopup.classList.add('hidden');
    backToMenu();
}

// --- ONLINE LIVE CLOUD ENGINE ---
function createNewRoom() {
    gameMode = 'online';
    myColor = 'white';
    currentRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const roomStructure = {
        board: defaultLayout,
        turn: 'white',
        status: 'waiting',
        player1: 'connected',
        player2: 'none'
    };

    database.ref('chess_rooms/' + currentRoomId).set(roomStructure)
        .then(() => {
            onlinePopup.classList.add('hidden');
            gameArea.classList.remove('hidden');
            gameModeTitle.innerText = "ONLINE MATCH";
            onlineStatusText.innerText = `Room ID: ${currentRoomId} (Share with friend)`;
            resetGame();
            listenToRoomUpdates();
        })
        .catch(err => alert("Error setting up room: " + err.message));
}

function joinExistingRoom() {
    const enteredId = roomIdInput.value.trim().toUpperCase();
    if (!enteredId) {
        alert("Please enter a Room ID!");
        return;
    }

    gameMode = 'online';
    myColor = 'black';
    currentRoomId = enteredId;

    database.ref('chess_rooms/' + currentRoomId).once('value', (snapshot) => {
        if (!snapshot.exists()) {
            alert("Room not found! Double check the code.");
            return;
        }
        
        const data = snapshot.val();
        if (data.status === 'active') {
            alert("Room is already full!");
            return;
        }

        database.ref('chess_rooms/' + currentRoomId).update({
            status: 'active',
            player2: 'connected'
        }).then(() => {
            onlinePopup.classList.add('hidden');
            gameArea.classList.remove('hidden');
            gameModeTitle.innerText = "ONLINE MATCH";
            onlineStatusText.innerText = `Connected Room: ${currentRoomId} (Your Turn: Black)`;
            listenToRoomUpdates();
        });
    });
}

function listenToRoomUpdates() {
    database.ref('chess_rooms/' + currentRoomId).on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        initialBoard = data.board;
        currentTurn = data.turn;

        if (data.status === 'active') {
            isRoomActive = true;
            if (myColor === 'white') {
                onlineStatusText.innerText = "Friend Connected! Start playing.";
            }
        } else if (data.status === 'waiting') {
            isRoomActive = false;
        }

        // Har cloud update par check karo koi jeeta toh nahi
        if (!checkKingDeath()) {
            createBoard();
        }
    });
}

// Render Board
function createBoard() {
    boardElement.innerHTML = '';
    let isFlipped = (gameMode === 'online' && myColor === 'black');

    for (let r = 0; r < 8; r++) {
        let row = isFlipped ? (7 - r) : r;
        for (let c = 0; c < 8; c++) {
            let col = isFlipped ? (7 - c) : c;
            
            const square = document.createElement('div');
            const isEven = (row + col) % 2 === 0;
            square.className = `square ${isEven ? 'white-square' : 'black-square'}`;
            
            const piece = initialBoard[row][col];
            square.innerText = piece;
            
            if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
                square.classList.add(selectedSquare.color === 'white' ? 'selected-white' : 'selected-black');
            }
            
            const isValid = validMoves.some(m => m.row === row && m.col === col);
            if (isValid && !isGameOver) {
                square.classList.add('valid-move');
            }

            square.addEventListener('click', () => handleSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
    updateTurnLayout();
}

function getPieceColor(piece) {
    if (!piece) return null;
    return ['♙', '♖', '♘', '♗', '♕', '♔'].includes(piece) ? 'white' : 'black';
}

function updateTurnLayout() {
    if (currentTurn === 'white') {
        pWhite.classList.add('active');
        pBlack.classList.remove('active');
    } else {
        pBlack.classList.add('active');
        pWhite.classList.remove('active');
    }
}

// Move Engine Rules Matrix
function calculateValidMoves(row, col, piece) {
    if (isGameOver) return [];
    let moves = [];
    let color = getPieceColor(piece);

    // Pawn Mechanics
    if (piece === '♙' || piece === '♟') {
        let dir = (color === 'white') ? -1 : 1;
        let startRow = (color === 'white') ? 6 : 1;
        if (row + dir >= 0 && row + dir < 8 && initialBoard[row + dir][col] === '') {
            moves.push({row: row + dir, col: col});
            if (row === startRow && initialBoard[row + (dir * 2)][col] === '') {
                moves.push({row: row + (dir * 2), col: col});
            }
        }
        for (let side of [-1, 1]) {
            let nextCol = col + side;
            if (nextCol >= 0 && nextCol < 8 && row + dir >= 0 && row + dir < 8) {
                let targetPiece = initialBoard[row + dir][nextCol];
                if (targetPiece !== '' && getPieceColor(targetPiece) !== color) {
                    moves.push({row: row + dir, col: nextCol});
                }
            }
        }
    }

    // Straight vectors (Rook / Queen)
    if (piece === '♖' || piece === '♜' || piece === '♕' || piece === '♛') {
        let directions = [[1,0], [-1,0], [0,1], [0,-1]];
        for (let d of directions) {
            let r = row + d[0], c = col + d[1];
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (initialBoard[r][c] === '') { moves.push({row: r, col: c}); }
                else {
                    if (getPieceColor(initialBoard[r][c]) !== color) moves.push({row: r, col: c});
                    break;
                }
                r += d[0]; c += d[1];
            }
        }
    }

    // Diagonal vectors (Bishop / Queen)
    if (piece === '♗' || piece === '♝' || piece === '♕' || piece === '♛') {
        let directions = [[1,1], [1,-1], [-1,1], [-1,-1]];
        for (let d of directions) {
            let r = row + d[0], c = col + d[1];
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (initialBoard[r][c] === '') { moves.push({row: r, col: c}); }
                else {
                    if (getPieceColor(initialBoard[r][c]) !== color) moves.push({row: r, col: c});
                    break;
                }
                r += d[0]; c += d[1];
            }
        }
    }

    // Knight jumps
    if (piece === '♘' || piece === '♞') {
        let knightMoves = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
        for (let m of knightMoves) {
            let r = row + m[0], c = col + m[1];
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (initialBoard[r][c] === '' || getPieceColor(initialBoard[r][c]) !== color) {
                    moves.push({row: r, col: c});
                }
            }
        }
    }

    // King controls
    if (piece === '♔' || piece === '♚') {
        let kingMoves = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
        for (let m of kingMoves) {
            let r = row + m[0], c = col + m[1];
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (initialBoard[r][c] === '' || getPieceColor(initialBoard[r][c]) !== color) {
                    moves.push({row: r, col: c});
                }
            }
        }
    }
    return moves;
}

function handleSquareClick(row, col) {
    if (isGameOver) return;
    if (gameMode === 'bot' && currentTurn === 'black') return;
    if (gameMode === 'online' && (!isRoomActive || currentTurn !== myColor)) return;

    const clickedPiece = initialBoard[row][col];
    const clickedColor = getPieceColor(clickedPiece);

    if (selectedSquare === null) {
        if (clickedPiece !== '' && clickedColor === currentTurn) {
            selectedSquare = { row, col, piece: clickedPiece, color: clickedColor };
            validMoves = calculateValidMoves(row, col, clickedPiece);
            createBoard();
        }
    } else {
        const isMoveValid = validMoves.some(m => m.row === row && m.col === col);
        
        if (isMoveValid) {
            executeMove(selectedSquare.row, selectedSquare.col, row, col);
        } else {
            if (clickedPiece !== '' && clickedColor === currentTurn) {
                selectedSquare = { row, col, piece: clickedPiece, color: clickedColor };
                validMoves = calculateValidMoves(row, col, clickedPiece);
            } else {
                selectedSquare = null;
                validMoves = [];
            }
        }
        createBoard();
    }
}

function executeMove(fromRow, fromCol, toRow, toCol) {
    initialBoard[toRow][toCol] = initialBoard[fromRow][fromCol];
    initialBoard[fromRow][fromCol] = '';
    
    // Move chalte hi pehle check karo ki kya koi Raja mara?
    const kingDied = checkKingDeath();

    if (kingDied) {
        if (gameMode === 'online') {
            database.ref('chess_rooms/' + currentRoomId).update({ board: initialBoard });
        }
        return; 
    }

    let nextTurn = (currentTurn === 'white') ? 'black' : 'white';

    if (gameMode === 'online') {
        database.ref('chess_rooms/' + currentRoomId).update({
            board: initialBoard,
            turn: nextTurn
        });
    } else {
        currentTurn = nextTurn;
        selectedSquare = null;
        validMoves = [];
        
        if (gameMode === 'bot' && currentTurn === 'black') {
            setTimeout(makeBotMove, 600);
        }
    }
}

function makeBotMove() {
    if (isGameOver) return;
    let allBlackMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            let piece = initialBoard[r][c];
            if (piece && getPieceColor(piece) === 'black') {
                let moves = calculateValidMoves(r, c, piece);
                if (moves.length > 0) {
                    allBlackMoves.push({ from: {row: r, col: c}, options: moves });
                }
            }
        }
    }
    if (allBlackMoves.length > 0) {
        let randomPieceMove = allBlackMoves[Math.floor(Math.random() * allBlackMoves.length)];
        let randomTargetSquare = randomPieceMove.options[Math.floor(Math.random() * randomPieceMove.options.length)];
        executeMove(randomPieceMove.from.row, randomPieceMove.from.col, randomTargetSquare.row, randomTargetSquare.col);
        createBoard();
    }
}

createBoard();

import React, { useMemo, useState } from "react";

// const parameters
const EMPTY = 0, BLACK = 1, WHITE = 2;
const PIECE_CHAR = { [EMPTY]: "", [BLACK]: "🐮", [WHITE]: "🐷" };

const DIRS = [
    [0, 1],   // →
    [1, 0],   // ↓
    [1, 1],   // ↘
    [1, -1],  // ↙
];

// create the chesse board
function createEmptyBoard(n) {
    return Array.from({ length: n }, () => Array(n).fill(EMPTY));
}

// check if out of the board bundary
function inBounds(board, r, c) {
    const rows = board.length;
    const cols = rows > 0 ? board[0].length : 0;
    return r >= 0 && r < rows && c >= 0 && c < cols;
}

function collectLine(board, r, c, dr, dc) {
    const color = board[r][c];
    if (color === EMPTY) return [];

    const line = [[r, c]];

    // forward
    let rr = r + dr, cc = c + dc;
    while (inBounds(board, rr, cc) && board[rr][cc] === color) {
        line.push([rr, cc]);
        rr += dr; cc += dc;
    }

    // reverse
    rr = r - dr; cc = c - dc;
    while (inBounds(board, rr, cc) && board[rr][cc] === color) {
        line.unshift([rr, cc]);
        rr -= dr; cc -= dc;
    }

    return line;
}

function checkWinner(r, c, board) {
    const color = board[r][c];
    if (color === EMPTY) return null;

    for (const [dr, dc] of DIRS) {
        const line = collectLine(board, r, c, dr, dc, color);

        if (line.length >= 5) return { winner: color, line }; // highlight the line of 5
    }
    return null;
}

/**
 * @param {number} size - size of the board
 * @param {number} cell - pixiel per block
 */

export default function Gomoku({ size = 19, cell = 36 }) {
    const [board, setBoard] = useState(() => createEmptyBoard(size));
    const [current, setCurrent] = useState(BLACK); // black first
    const [winner, setWinner] = useState(null);
    const [winningLine, setWinningLine] = useState([]);
    const [lastSnapshot, setLastSnapshot] = useState(null); // board, current
    const [canUndo, setCanUndo] = useState(false);

    function handleCellClick(r, c) {
        if (winner || board[r][c] !== EMPTY) return;

        // save last board snapshot
        const snapshot = {
            board: board.map(row => row.slice()),
            current: current,
        };
        setLastSnapshot(snapshot);
        setCanUndo(true);

        // copy board and place chess
        const next = board.map(row => row.slice());
        next[r][c] = current;

        // update the board and check winner
        const result = checkWinner(r, c, next);
        setBoard(next);

        if (result) {
            setWinner(result.winner);
            setWinningLine(result.line);
            return;
        }

        setCurrent(p => (p === BLACK ? WHITE : BLACK));
    }

    function handleUndo() {
        if (!canUndo || !lastSnapshot) return;

        setBoard(lastSnapshot.board);
        setCurrent(lastSnapshot.current);
        setWinner(null);
        setWinningLine([]);

        setCanUndo(false);
        setLastSnapshot(null);
    }

    function handleReset() {
        setBoard(createEmptyBoard(size));
        setCurrent(BLACK);
        setWinner(null);
        setWinningLine([]);
        setCanUndo(false);
        setLastSnapshot(null);
    }

    return (
        <div className="gomoku">
            <div className="gomoku_panel">
                <strong>Gomoku</strong>
                <span>
                    Turn: {current === BLACK ? <b>🐮</b> : <b>🐷</b>}
                </span>
                {winner && (
                    <span>
                        Winner: {winner === BLACK ? <b>Player 🐮</b> : <b>Player 🐷</b>}
                    </span>
                )}
            </div>

            <div className="gomoku_operation">
                <button onClick={handleUndo} disabled={!canUndo}>Undo</button>
                <button onClick={handleReset}>Reset</button>
            </div>

            <div
                className="gomoku_board"
                style={{
                    gridTemplateColumns: `repeat(${size}, ${cell}px)`,
                    gridTemplateRows: `repeat(${size}, ${cell}px)`,
                }}
            >
                {board.map((row, r) =>
                    row.map((val, c) => {
                        const isWinCell = winningLine.some(
                            ([rr, cc]) => rr === r && cc === c
                        );
                        return (
                            <button
                                key={`${r}-${c}`}
                                className={`gomoku_cell ${isWinCell ? "win" : ""}`}
                                onClick={() => handleCellClick(r, c)}
                                aria-label={`row ${r + 1}, col ${c + 1}, ${val === EMPTY ? "empty" : val === BLACK ? "black" : "white"
                                    }`}
                                style={{ fontSize: `${Math.floor(cell * 0.7)}px` }}
                            >
                                {PIECE_CHAR[val]}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

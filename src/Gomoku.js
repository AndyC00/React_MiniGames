import React, { useMemo, useState } from "react";

// const parameters
const EMPTY = 0, BLACK = 1, WHITE = 2;
const PIECE_CHAR = { [EMPTY]: "", [BLACK]: "●", [WHITE]: "○" };

// create the chesse board
function createEmptyBoard(n) {
    return Array.from({ length: n }, () => Array(n).fill(EMPTY));
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

    // TODO: place chesse and next round
    function handleCellClick(r, c) {
        console.log(`clicked cell -> row:${r}, col:${c}`);

    }

    return (
        <div className="gomoku">
            <div className="gomoku-panel">
                <strong>Gomoku</strong>
                <span>
                    Turn: {current === BLACK ? <b>Black ●</b> : <b>White ○</b>}
                </span>
                {winner && (
                    <span>
                        Winner: {winner === BLACK ? <b>Player 1 Black ●</b> : <b>Player 2: White ○</b>}
                    </span>
                )}
            </div>

            <div
                className="gomoku-board"
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
                                className={`gomoku-cell ${isWinCell ? "win" : ""}`}
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

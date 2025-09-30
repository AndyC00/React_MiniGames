import {useState} from "react";

const SIZE = 4;

// helper functions:
function emptyBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function getEmptyCells(board) {
  const cells = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomTile(board) {
  const empties = getEmptyCells(board);
  if (empties.length === 0) return board;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const next = board.map(row => row.slice());
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function initBoard() {
  let b = emptyBoard(SIZE);
  b = addRandomTile(b);
  b = addRandomTile(b);
  return b;
}

function tileStyle(v) {
  const palette = {
    0: { background: '#cdc1b4', color: '#776e65' },
    2: { background: '#eee4da', color: '#776e65' },
    4: { background: '#ede0c8', color: '#776e65' },
    8: { background: '#f2b179', color: '#f9f6f2' },
    16: { background: '#f59563', color: '#f9f6f2' },
    32: { background: '#f67c5f', color: '#f9f6f2' },
    64: { background: '#f65e3b', color: '#f9f6f2' },
    128: { background: '#edcf72', color: '#f9f6f2' },
    256: { background: '#edcc61', color: '#f9f6f2' },
    512: { background: '#edc850', color: '#f9f6f2' },
    1024: { background: '#edc53f', color: '#f9f6f2' },
    2048: { background: '#edc22e', color: '#f9f6f2' },
  };
  return palette[v] || palette[2048];
}

export default function Game2048() {
  // inner const:
  const [board, setBoard] = useState(() => initBoard());

  // inner functions:
  function handleNewGame() {
    setBoard(initBoard());
  }

  return (
  <>
    <div className="header2048">
      <h2>2048</h2>
      <button className="btn2048" onClick={handleNewGame}>New Game</button>
    </div>

    <div className="grid2048" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
      {board.map((row, r) =>
        row.map((value, c) => (
          <div key={`${r}-${c}`} className="cell2048" style={tileStyle(value)}>
            {value || ""}
          </div>
        ))
      )}
    </div>
  </>
);

}
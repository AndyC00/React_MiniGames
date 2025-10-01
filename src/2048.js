import { useState, useEffect } from "react";

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
  next[r][c] = Math.random() < 0.9 ? 2 : 4; // 10% chance to be 4
  return next;
}

function initBoard() {
  let b = emptyBoard(SIZE);
  b = addRandomTile(b);
  b = addRandomTile(b);
  return b;
}

function mergeLineLeft(line) {
  const nums = line.filter(v => v !== 0);
  const merged = [];
  let gained = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i < nums.length - 1 && nums[i] === nums[i + 1]) {
      const val = nums[i] * 2;
      merged.push(val);
      gained += val;
      i++;
    }
    else {
      merged.push(nums[i]);
    }
  }
  while (merged.length < line.length) {
    merged.push(0);
  }
  const moved = merged.some((v, i) => v !== line[i]);

  return { merged, moved, gained };
}

function rotateBoardLeft(board) {
  const N = board.length;
  const res = emptyBoard(N);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      res[N - 1 - c][r] = board[r][c];
    }
  }
  return res;
}

function rotateBoardRight(board) {
  const N = board.length;
  const res = emptyBoard(N);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      res[c][N - 1 - r] = board[r][c];
    }
  }
  return res;
}

function flipBoard(board) {
  return board.map(row => row.slice().reverse());
}

function moveBoard(board, dir) {
  let working = board.map(row => row.slice());

  if (dir === "up") {
    working = rotateBoardLeft(working);
  }
  else if (dir === "down") {
    working = rotateBoardRight(working);
  }
  else if (dir === "right") {
    working = flipBoard(working);
  }

  let movedAny = false;
  let gainedTotal = 0;
  const mergedRows = working.map(row => {
    const { merged, moved, gained } = mergeLineLeft(row);
    if (moved) movedAny = true;
    gainedTotal += gained;
    return merged;
  });

  let next =
    dir === "up"
      ? rotateBoardRight(mergedRows)
      : dir === "down"
        ? rotateBoardLeft(mergedRows)
        : dir === "right"
          ? flipBoard(mergedRows)
          : mergedRows;

  return { next, moved: movedAny, gained: gainedTotal };
}

function isGameOver(board) {
  if (getEmptyCells(board).length > 0) return false;

  const N = board.length;

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = board[r][c];

      if ((r + 1 < N && board[r + 1][c] === v) || (c + 1 < N && board[r][c + 1] === v)) {
        return false;
      }
    }
  }

  return true;
}

function tileClass(v) {
  return `cell2048 v${v || 0}`;
}

export default function Game2048() {
  // inner const:
  const [board, setBoard] = useState(() => initBoard());
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  // inner functions:
  function handleNewGame() {
    setBoard(initBoard());
    setScore(0);
    setOver(false);
  }

  function handleMove(dir) {
    if (over) return;
    setBoard(prev => {
      const { next, moved, gained } = moveBoard(prev, dir);
      if (!moved) return prev;

      setScore(s => s + gained);
      const withTile = addRandomTile(next);

      if (isGameOver(withTile)) setOver(true);

      return withTile;
    });
  }

  useEffect(() => {
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      const map = {
        arrowup: "up",
        arrowdown: "down",
        arrowleft: "left",
        arrowright: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const dir = map[key];
      if (!dir) return;
      e.preventDefault();
      handleMove(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [over]);

  return (
   <>
      <div className="header2048">
        <h2 style={{ margin: 0 }}>2048</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontWeight: 700 }}>Score: {score}</span>
          <button className="btn2048" onClick={handleNewGame}>New Game</button>
        </div>
      </div>

      <div className="grid2048" style={{ "--cols": SIZE }}>
        {board.map((row, r) =>
          row.map((value, c) => (
            <div key={`${r}-${c}`} className={tileClass(value)}>
              {value || ""}
            </div>
          ))
        )}
      </div>

      <div className="controls2048" role="group" aria-label="Move controls">
        <div />
        <button className="btn2048 arrowBtn2048" onClick={() => handleMove("up")} aria-label="Up">↑</button>
        <div />

        <button className="btn2048 arrowBtn2048" onClick={() => handleMove("left")} aria-label="Left">←</button>
        <div />
        <button className="btn2048 arrowBtn2048" onClick={() => handleMove("right")} aria-label="Right">→</button>

        <div />
        <button className="btn2048 arrowBtn2048" onClick={() => handleMove("down")} aria-label="Down">↓</button>
        <div />
      </div>

      {over && (
        <p className = "GameOver2048"> Game Over </p>
      )}
    </>
  );
}
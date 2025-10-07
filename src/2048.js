import { useState, useEffect } from "react";

const SIZE = 4;
const WILDCARD = -1;

const CELL_PX = 80; // height and width for .cell2048 (css modify needed if changed)
const GAP_PX = 10;  // gap for .grid2048
const PAD_PX = 10;  // padding for .grid2048 (css modify needed if changed)

// ------------------ helper functions ------------------
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

  if (Math.random() < 0.3) next[r][c] = WILDCARD;  // 30% chance to generate ??
  else next[r][c] = Math.random() < 0.9 ? 2 : 4; // then the lefting 10% chance to be 4

  return next;
}

function initBoard() {
  let b = emptyBoard(SIZE);
  b = addRandomTile(b);
  b = addRandomTile(b);
  return b;
}

function canMerge(a, b) {
  const aWild = a === WILDCARD;
  const bWild = b === WILDCARD;
  return (a === b && !aWild) || (aWild !== bWild);
}

function mergedValue(a, b) {
  const aWild = a === WILDCARD;
  const bWild = b === WILDCARD;
  if (aWild && bWild) return 0;
  const num = aWild ? b : a;
  return num * 2;
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

function findSpawnKeys(before, after) {
  const keys = [];
  for (let r = 0; r < before.length; r++) {
    for (let c = 0; c < before[r].length; c++) {
      if (before[r][c] === 0 && after[r][c] !== 0) {
        keys.push(`${r}-${c}`);
      }
    }
  }
  return keys;
}

// ------------------ major merge logic ------------------
function traceLineLeftWithMoves(line) {
  const entries = [];  // all non-null elements and their buffers
  for (let c = 0; c < line.length; c++) if (line[c] !== 0)
    entries.push({ v: line[c], fromC: c });

  const merged = [];
  const moves = [];
  const mergedDestCols = [];
  let gained = 0;
  let target = 0;

  for (let i = 0; i < entries.length; i++) {
    const a = entries[i];
    const b = entries[i + 1];

    if (b && canMerge(a.v, b.v)) {
      const val = mergedValue(a.v, b.v);
      merged.push(val);
      moves.push({ fromC: a.fromC, toC: target, v: a.v, willMerge: true });
      moves.push({ fromC: b.fromC, toC: target, v: b.v, willMerge: true });
      mergedDestCols.push(target);
      gained += val;
      target++;
      i++;
    }
    else {
      merged.push(a.v);
      moves.push({ fromC: a.fromC, toC: target, v: a.v, willMerge: false });
      target++;
    }
  }

  while (merged.length < line.length) merged.push(0);
  const moved = moves.some(m => m.fromC !== m.toC);

  return { merged, moves, mergedDestCols, moved, gained };
}

function computeMoveWithTrace(board, dir) {
  const N = board.length;

  let working = board.map(r => r.slice());
  if (dir === "up") working = rotateBoardLeft(working);
  else if (dir === "down") working = rotateBoardRight(working);
  else if (dir === "right") working = flipBoard(working);

  const mergedRows = [];
  const rowMoves = [];
  const mergedDestsWorking = [];
  let gainedTotal = 0;
  let movedAny = false;

  for (let r = 0; r < N; r++) {
    const { merged, moves, mergedDestCols, moved, gained } = traceLineLeftWithMoves(working[r]);
    mergedRows.push(merged);
    rowMoves.push({ r, moves });
    mergedDestCols.forEach(c => mergedDestsWorking.push({ r, c }));
    if (moved) movedAny = true;
    gainedTotal += gained;
  }

  let next =
    dir === "up" ? rotateBoardRight(mergedRows) :
      dir === "down" ? rotateBoardLeft(mergedRows) :
        dir === "right" ? flipBoard(mergedRows) :
          mergedRows;

  function fromWorkingToOriginal_src(rw, cw) {
    if (dir === "left") return { r: rw, c: cw };
    if (dir === "up") return { r: cw, c: N - 1 - rw };
    if (dir === "down") return { r: N - 1 - cw, c: rw };

    return { r: rw, c: N - 1 - cw };
  }
  function fromWorkingToOriginal_dst(rw, cw) {

    if (dir === "left") return { r: rw, c: cw };
    if (dir === "up") return { r: cw, c: N - 1 - rw };
    if (dir === "down") return { r: N - 1 - cw, c: rw };

    return { r: rw, c: N - 1 - cw };
  }

  const moves = [];
  rowMoves.forEach(({ r: rw, moves: ms }) => {
    ms.forEach(m => {
      const src = fromWorkingToOriginal_src(rw, m.fromC);
      const dst = fromWorkingToOriginal_dst(rw, m.toC);
      moves.push({ fromR: src.r, fromC: src.c, toR: dst.r, toC: dst.c, v: m.v, willMerge: m.willMerge });
    });
  });

  const mergedDest = mergedDestsWorking.map(({ r: rw, c: cw }) => fromWorkingToOriginal_dst(rw, cw));

  return { next, movedAny, gainedTotal, moves, mergedDest };
}

function isGameOver(board) {
  if (getEmptyCells(board).length > 0) return false;

  const N = board.length;

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = board[r][c];

      if (c + 1 < N) {
        const w = board[r][c + 1];
        const canMergeRight = (v === w && v !== WILDCARD) || ((v === WILDCARD) !== (w === WILDCARD));
        if (canMergeRight) return false;
      }

      if (r + 1 < N) {
        const w = board[r + 1][c];
        const canMergeDown = (v === w && v !== WILDCARD) || ((v === WILDCARD) !== (w === WILDCARD));
        if (canMergeDown) return false;
      }
    }
  }

  return true;
}

// ------------------ style & render ------------------
function tileClass(v) {
  return v === WILDCARD ? "cell2048 wild2048" : `cell2048 v${v || 0}`;
}

function keyOf(r, c) { return `${r}-${c}`; }

function cellXY(r, c) {
  const x = c * (CELL_PX + GAP_PX);
  const y = r * (CELL_PX + GAP_PX);
  return { x, y };
}

// ------------------ result to return ------------------
export default function Game2048() {
  // inner const:
  const [board, setBoard] = useState(() => initBoard());
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [prevBoard, setPrevBoard] = useState(null);
  const [prevScore, setPrevScore] = useState(0);
  const [prevOver,  setPrevOver]  = useState(false);
  const [canUndo,   setCanUndo]   = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [animTiles, setAnimTiles] = useState([]);
  const [animPlay, setAnimPlay] = useState(false);
  const [movingFrom, setMovingFrom] = useState(() => new Set());
  const [flashCells, setFlashCells] = useState(() => new Set());
  const [spawnCells, setSpawnCells] = useState(() => new Set());

  const SPAWN_MS = 140; // the time for spawn animation
  const MOVE_MS = 65;  // the time for move animation
  const FLASH_MS = 140;

  // inner functions:
  function handleNewGame() {
    const b = initBoard();
    setBoard(b);
    setScore(0);
    setOver(false);

    // clear animation
    setAnimTiles([]);
    setMovingFrom(new Set());
    setFlashCells(new Set());
    setSpawnCells(new Set());
    setAnimPlay(false);
    setIsAnimating(false);

    // clear undo
    setPrevBoard(null);
    setPrevScore(0);
    setPrevOver(false);
    setCanUndo(false);

    // 2 nums spawn when start new
    const initSpawn = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] !== 0) initSpawn.push(`${r}-${c}`);
      }
    }
    setSpawnCells(new Set(initSpawn));
    window.setTimeout(() => setSpawnCells(new Set()), SPAWN_MS);
  }

  function handleMove(dir) {
    if (over || isAnimating) return;

    const { next, movedAny, gainedTotal, moves, mergedDest } = computeMoveWithTrace(board, dir);
    if (!movedAny) return;

    // save snapshot for undo
    setPrevBoard(board.map(row => row.slice()));
    setPrevScore(score);
    setPrevOver(over);
    setCanUndo(true);

    // play moving animation
    setIsAnimating(true);
    setAnimTiles(moves);
    setMovingFrom(new Set(moves.map(m => keyOf(m.fromR, m.fromC))));
    setAnimPlay(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimPlay(true)));

    window.setTimeout(() => {
      const withTile = addRandomTile(next);

      const spawn = findSpawnKeys(next, withTile);
      if (spawn.length) {
        setSpawnCells(new Set(spawn));
        window.setTimeout(() => setSpawnCells(new Set()), SPAWN_MS);
      }

      setBoard(withTile);
      setScore(s => s + gainedTotal);
      setAnimTiles([]);
      setMovingFrom(new Set());
      setFlashCells(new Set(mergedDest.map(p => keyOf(p.r, p.c))));
      if (isGameOver(withTile)) setOver(true);

      window.setTimeout(() => setFlashCells(new Set()), FLASH_MS);
      setIsAnimating(false);
    }, MOVE_MS);
  }

  function handleUndo() {
    if (!canUndo || isAnimating) return;
    if (!prevBoard) return;

    // back to last snapshot
    setBoard(prevBoard);
    setScore(prevScore);
    setOver(prevOver);

    // clear
    setAnimTiles([]);
    setMovingFrom(new Set());
    setFlashCells(new Set());
    setSpawnCells(new Set());
    setAnimPlay(false);

    // allow only one undo at a time
    setCanUndo(false);
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
  }, [board, over]);

  return (
    <div className="container2048">

      <div className="instruction2048">
        <p>Control Keys:</p>
        <p>Buttons below or "AWSD" on your keyboard</p>
        <p>Note:</p>
        <p>?? can merge with any numbers but itself</p>
      </div>

      <div className="header2048">
        <h2 className="title2048">2048</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="score2048">Score: {score}</span>
          <button className="btn2048" onClick={handleNewGame}>New Game</button>
        </div>
      </div>

      {over && (<p className="GameOver2048"> Game Over </p>)}

      <div className="undoButton2048wapper">
        <button 
          className="btn2048 undoButton2048"
          onClick={handleUndo}
          disabled={!canUndo || isAnimating}>
            Undo
        </button>
      </div>

      <div className="boardWrap2048">
        <div className="grid2048" style={{ "--cols": SIZE }}>
          {board.map((row, r) =>
            row.map((value, c) => {
              const k = keyOf(r, c);
              const hide = movingFrom.has(k);
              const flash = flashCells.has(k);
              const isSpawn = spawnCells.has(k);

              const cls = tileClass(value) + 
                (hide     ? " movingOut2048"  : "") +
                (flash    ? " flash2048"      : "") +
                (isSpawn  ? " spawn2048"      : "");

              return (
                <div key={k} className={cls}>
                  {value === WILDCARD ? "??" : (value || "")}
                </div>
              );
            })
          )}
        </div>
        {/* render the moving nums */}
        <div className="animLayer2048">
          {animTiles.map((m, idx) => {
            const from = cellXY(m.fromR, m.fromC);
            const to = cellXY(m.toR, m.toC);
            const dx = to.x - from.x;
            const dy = to.y - from.y;

            const style = {
              left: from.x,
              top: from.y,
              transform: `translate3d(${animPlay ? dx : 0}px, ${animPlay ? dy : 0}px, 0)`,
              transitionDuration: `${MOVE_MS}ms`,
            };

            return (
              <div key={idx} className="movingTile2048">
                <div className={`movingInner2048 ${tileClass(m.v)}`} style={style}>
                  {m.v === WILDCARD ? "??" : m.v}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="controls2048" role="group" aria-label="Move controls">
        <div />
        <button className="btn2048 arrowBtn2048" onClick={() => handleMove("up")} aria-label="Up">🔼</button>
        <div />

        <button className="btn2048 arrowBtn2048" onClick={() => handleMove("left")} aria-label="Left">◀️</button>
        <div />
        <button className="btn2048 arrowBtn2048" onClick={() => handleMove("right")} aria-label="Right">▶️</button>

        <div />
        <button className="btn2048 arrowBtn2048" onClick={() => handleMove("down")} aria-label="Down">🔽</button>
        <div />
      </div>

    </div>
  );
}
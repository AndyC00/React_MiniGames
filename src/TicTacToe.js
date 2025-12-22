import { useState } from "react";

const STAR = "⭐️";
const CROSS = "❌";

function Square({ value, onSquareClick, highlight }) {
  const label = value
    ? `Square filled with ${value === STAR ? "star" : "cross"}`
    : "Empty square";

  return (
    <button
      type="button"
      className={`square ${highlight ? "win" : ""}`}
      onClick={onSquareClick}
      aria-label={label}
    >
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay, winner, winningLine = [] }) {
  function handleClick(i) {
    if (squares[i] || winner) {
      return;
    }

    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? STAR : CROSS;
    onPlay(nextSquares);
  }

  return (
    <div className="ticGrid" role="grid" aria-label="Tic Tac Toe board">
      {squares.map((square, idx) => (
        <Square
          key={idx}
          value={square}
          onSquareClick={() => handleClick(idx)}
          highlight={winningLine.includes(idx)}
        />
      ))}
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i += 1) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }

  return null;
}

export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);

  const currentSquares = history[currentMove];
  const xIsNext = currentMove % 2 === 0;

  const result = calculateWinner(currentSquares);
  const winner = result?.winner ?? null;
  const winningLine = result?.line ?? [];
  const isDraw = !winner && currentSquares.every((sq) => sq !== null);

  const status = winner
    ? `Winner: ${winner} (${winner === STAR ? "first" : "second"} player)`
    : isDraw
      ? "Draw!"
      : `Next player: ${xIsNext ? STAR : CROSS}`;

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  const moves = history.map((_, move) => {
    const description = move > 0 ? `Move #${move}` : "Restart";

    return (
      <li key={move}>
        <button
          type="button"
          className={`ticHistoryBtn ${move === 0 ? "ticRestartBtn" : ""}`}
          onClick={() => jumpTo(move)}
        >
          {description}
        </button>
      </li>
    );
  });

  return (
    <div className="ticGame">
      <div className="ticCard">
        <div className="ticHeaderRow">
          <div className="ticTitleGroup">
            <h2 className="ticHeader">Tic Tac Toe</h2>
          </div>
          <div className="ticStatusBadge">{status}</div>
        </div>

        <div className="ticSurface">
          <div className="ticBoardArea">
            <div className="ticBoardPanel">
              <Board
                xIsNext={xIsNext}
                squares={currentSquares}
                onPlay={handlePlay}
                winner={winner}
                winningLine={winningLine}
              />
            </div>
          </div>

          <div className="ticHistoryPanel">
            <div className="ticHistoryTitle">Moves</div>
            <ol className="ticHistoryList">{moves}</ol>
          </div>
        </div>
      </div>
    </div>
  );
}

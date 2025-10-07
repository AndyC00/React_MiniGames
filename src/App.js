import { useMemo, useState, Suspense, lazy } from "react";

const gameRegistry = {
  game2048: { label: "2048 Plus", loader: () => import("./2048") },
  gomoku:    { label: "Gomoku", loader: () => import("./Gomoku") },
  diceRoller: { label: "Table Game Dice", loader: () => import("./Dice") },
  ticTacToe: { label: "TicTacToe", loader: () => import("./TicTacToe") },
};

export default function App() {
  const [selectedGame, setSelectedGame] = useState("");
  const SelectedGame = useMemo(() => {
    if (!selectedGame) return null;
    return lazy(gameRegistry[selectedGame].loader);
  }, [selectedGame]);

  return (
    <div className="app">
      <label>
        Please select: 
        <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)}>
          <option value=""> Selecting Page </option>
          {Object.entries(gameRegistry).map(([key, game]) => (
            <option key={key} value={key}>{game.label}</option>
          ))}
        </select>
      </label>

      {SelectedGame ? (
        <Suspense fallback={<div>Loading…</div>}>
          <SelectedGame />
        </Suspense>
      ) : (
        <p>🌟Please select a project to play🌟</p>
      )}
    </div>
  );
}

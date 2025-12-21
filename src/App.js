import { useMemo, useState, Suspense, lazy } from "react";
import "./style/App.css";

const assetBase = process.env.PUBLIC_URL || "";

const gameRegistry = {
  game2048: {
    label: "2048 Plus",
    description: "Classic 2048 with some extra polish.",
    image: `${assetBase}/image/2048.jpeg`,
    loader: () => import("./2048"),
  },
  diceRoller: {
    label: "Table Game Dice",
    description: "Roll dice quickly for board/table games.",
    image: `${assetBase}/image/2048.jpeg`,
    loader: () => import("./Dice"),
  },
  gomoku: {
    label: "Gomoku",
    description: "Five in a row on a bigger board.",
    image: `${assetBase}/image/2048.jpeg`,
    loader: () => import("./Gomoku"),
  },
  ticTacToe: {
    label: "TicTacToe",
    description: "Simple classic, quick rounds.",
    image: `${assetBase}/image/2048.jpeg`,
    loader: () => import("./TicTacToe"),
  },
};

export default function App() {
  const [selectedGame, setSelectedGame] = useState("");

  // tooltip state
  const [hoveredKey, setHoveredKey] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false });

  const SelectedGame = useMemo(() => {
    if (!selectedGame) return null;
    const meta = gameRegistry[selectedGame];

    if (!meta) return null;
    return lazy(meta.loader);

  }, [selectedGame]);

  const hoveredMeta = hoveredKey ? gameRegistry[hoveredKey] : null;

  return (
    <div className="app">

      <div className="topbar">
        <label className="selector">
          Please select:
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
          >
            <option value="">Selecting Page</option>
            {Object.entries(gameRegistry).map(([key, game]) => (
              <option key={key} value={key}>
                {game.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* display 4 game buttons when not in game */}
      {!selectedGame && (
        <section className="gameGrid">
          {Object.entries(gameRegistry).map(([key, game]) => (
            <div key={key} className="tileWrapper">
              <button
                type="button"
                className="gameTile"
                onClick={() => setSelectedGame(key)} // open selected game
                onMouseEnter={() => {
                  setHoveredKey(key);
                  setTooltip((t) => ({ ...t, visible: true }));
                }}
                onMouseMove={(e) => {
                  setTooltip({ x: e.clientX, y: e.clientY, visible: true });
                }}
                onMouseLeave={() => {
                  setHoveredKey(null);
                  setTooltip((t) => ({ ...t, visible: false }));
                }}
              >
                <img src={game.image} alt={game.label} />
              </button>

              {/* display game title */}
              <div className="tileLabel">{game.label}</div>
            </div>
          ))}
        </section>
      )}

      {/* tooltip to display when hover */}
      {hoveredMeta && tooltip.visible && (
        <div
          className="tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <div className="tooltipTitle">{hoveredMeta.label}</div>
          <div className="tooltipBody">{hoveredMeta.description}</div>
        </div>
      )}

      {SelectedGame ? (
        <div className="gameStage">
          <Suspense fallback={<div>Loading…</div>}>
            <SelectedGame />
          </Suspense>
        </div>
      ) : (
        <p className="hint">🌟Please select a project to play🌟</p>
      )}
    </div>
  );
}

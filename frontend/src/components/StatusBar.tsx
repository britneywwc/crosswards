import type { CrosswordEngine } from "../engine/CrosswordEngine";

interface StatusBarProps {
  engine: CrosswordEngine;
}

export function StatusBar({ engine }: StatusBarProps) {
  const active = engine.getActiveClue();
  const direction = engine.getDirection();

  return (
    <div className="status-bar">
      <div className="status-bar__clue">
        {active ? (
          <>
            <span className="status-bar__label">
              {active.number} {direction === "across" ? "Across" : "Down"}
            </span>
            <span className="status-bar__text">{active.clue}</span>
          </>
        ) : (
          <span className="status-bar__text">Select a cell to begin.</span>
        )}
      </div>
    </div>
  );
}

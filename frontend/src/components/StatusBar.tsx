import type { CrosswordEngine } from "../engine/CrosswordEngine";

interface StatusBarProps {
  engine: CrosswordEngine;
  onCheck: () => void;
  message: string | null;
  solved: boolean;
}

export function StatusBar({ engine, onCheck, message, solved }: StatusBarProps) {
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
      <div className="status-bar__actions">
        {message && (
          <span
            className={
              "status-bar__message" +
              (solved ? " status-bar__message--success" : "")
            }
          >
            {message}
          </span>
        )}
        <button type="button" className="button" onClick={onCheck}>
          Check puzzle
        </button>
      </div>
    </div>
  );
}

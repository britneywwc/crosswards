import type { CrosswordEngine } from "../engine/CrosswordEngine";

interface StatusBarProps {
  engine: CrosswordEngine;
  onPrevClue: () => void;
  onNextClue: () => void;
}

export function StatusBar({ engine, onPrevClue, onNextClue }: StatusBarProps) {
  const active = engine.getActiveClue();
  const direction = engine.getDirection();

  return (
    <div className="status-bar">
      <button
        type="button"
        className="status-bar__nav"
        aria-label="Previous clue"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onPrevClue}
      >
        <ChevronIcon direction="left" />
      </button>

      <div className="status-bar__clue">
        {active ? (
          <>
            <span className="status-bar__label">
              {active.number}
              {direction === "across" ? "A" : "D"}
            </span>
            <span className="status-bar__text">{active.clue}</span>
          </>
        ) : (
          <span className="status-bar__text">Select a cell to begin.</span>
        )}
      </div>

      <button
        type="button"
        className="status-bar__nav"
        aria-label="Next clue"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onNextClue}
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "left" ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}

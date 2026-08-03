import type { CrosswordEngine } from "../engine/CrosswordEngine";

interface PuzzleToolbarProps {
  engine: CrosswordEngine;
  onCheck: () => void;
  onToggleAutoCheck: () => void;
}

export function PuzzleToolbar({
  engine,
  onCheck,
  onToggleAutoCheck,
}: PuzzleToolbarProps) {
  const autoCheck = engine.isAutoCheck();

  return (
    <div className="toolbar" role="toolbar" aria-label="Puzzle actions">
      <button
        type="button"
        className={"icon-button" + (autoCheck ? " icon-button--active" : "")}
        aria-pressed={autoCheck}
        aria-label="Toggle always check"
        onClick={onToggleAutoCheck}
      >
        <EyeIcon />
      </button>

      <button
        type="button"
        className="icon-button"
        aria-label="Check puzzle"
        onClick={onCheck}
      >
        <CheckIcon />
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

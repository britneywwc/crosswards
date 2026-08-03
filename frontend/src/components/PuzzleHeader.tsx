import type { ReactNode } from "react";
import type { Puzzle } from "../types";

interface PuzzleHeaderProps {
  puzzle: Puzzle;
  onReset: () => void;
  actions?: ReactNode;
}

export function PuzzleHeader({ puzzle, onReset, actions }: PuzzleHeaderProps) {
  return (
    <header className="puzzle-header">
      <h1 className="puzzle-header__title">{puzzle.title}</h1>
      <div className="puzzle-header__meta">
        <p className="puzzle-header__author">
          {puzzle.author ? `by ${puzzle.author}` : ""}
        </p>
        <div className="puzzle-header__actions">
          {actions}
          <button
            type="button"
            className="icon-button"
            aria-label="Load another puzzle"
            onClick={onReset}
          >
            <BackspaceIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

function BackspaceIcon() {
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
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
  );
}

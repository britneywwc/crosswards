import type { Puzzle } from "../types";

interface PuzzleHeaderProps {
  puzzle: Puzzle;
  onReset: () => void;
}

export function PuzzleHeader({ puzzle, onReset }: PuzzleHeaderProps) {
  return (
    <header className="puzzle-header">
      <h1 className="puzzle-header__title">{puzzle.title}</h1>
      <div className="puzzle-header__meta">
        <p className="puzzle-header__author">
          {puzzle.author ? `by ${puzzle.author}` : ""}
        </p>
        <button type="button" className="button" onClick={onReset}>
          Load another
        </button>
      </div>
    </header>
  );
}

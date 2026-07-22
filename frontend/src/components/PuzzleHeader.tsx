import type { Puzzle } from "../types";

interface PuzzleHeaderProps {
  puzzle: Puzzle;
  onReset: () => void;
}

export function PuzzleHeader({ puzzle, onReset }: PuzzleHeaderProps) {
  return (
    <header className="puzzle-header">
      <div>
        <h1 className="puzzle-header__title">{puzzle.title}</h1>
        {puzzle.author && (
          <p className="puzzle-header__author">by {puzzle.author}</p>
        )}
      </div>
      <button type="button" className="button" onClick={onReset}>
        Load another
      </button>
    </header>
  );
}

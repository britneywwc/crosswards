import type { CSSProperties } from "react";
import type { CrosswordEngine } from "../engine/CrosswordEngine";
import { Cell } from "./Cell";

interface CrosswordGridProps {
  engine: CrosswordEngine;
  /** Called after a cell is selected (used to focus the keyboard input). */
  onCellSelect?: () => void;
}

export function CrosswordGrid({ engine, onCellSelect }: CrosswordGridProps) {
  const puzzle = engine.getPuzzle();

  return (
    <div
      className="grid"
      style={{ "--cols": puzzle.width } as CSSProperties}
      role="grid"
      aria-label={`${puzzle.title} crossword grid`}
    >
      {puzzle.grid.map((row) =>
        row.map((cell) => (
          <Cell
            key={`${cell.row}-${cell.col}`}
            cell={cell}
            isCursor={engine.isCursor(cell.row, cell.col)}
            isHighlighted={engine.isHighlighted(cell.row, cell.col)}
            onSelect={(r, c) => {
              engine.selectCell(r, c);
              onCellSelect?.();
            }}
          />
        ))
      )}
    </div>
  );
}

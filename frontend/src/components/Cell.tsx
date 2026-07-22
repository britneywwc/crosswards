import { memo } from "react";
import type { Cell as CellModel } from "../types";

interface CellProps {
  cell: CellModel;
  isCursor: boolean;
  isHighlighted: boolean;
  onSelect: (row: number, col: number) => void;
}

function CellComponent({ cell, isCursor, isHighlighted, onSelect }: CellProps) {
  if (cell.isBlack) {
    return <div className="cell cell--black" aria-hidden="true" />;
  }

  const className = [
    "cell",
    isHighlighted ? "cell--highlighted" : "",
    isCursor ? "cell--cursor" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      onMouseDown={(e) => {
        // Prevent the grid wrapper from losing keyboard focus.
        e.preventDefault();
        onSelect(cell.row, cell.col);
      }}
      aria-label={`Row ${cell.row + 1}, column ${cell.col + 1}`}
    >
      {cell.clueNumber !== undefined && (
        <span className="cell__number">{cell.clueNumber}</span>
      )}
      <span className="cell__letter">{cell.current}</span>
    </button>
  );
}

export const Cell = memo(CellComponent);

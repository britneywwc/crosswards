import type { Puzzle } from "../types";
import { formatDuration } from "../utils/time";

interface CompletionModalProps {
  puzzle: Puzzle;
  timeMs: number;
  onClose: () => void;
  onNewPuzzle: () => void;
}

export function CompletionModal({
  puzzle,
  timeMs,
  onClose,
  onNewPuzzle,
}: CompletionModalProps) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Puzzle complete"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="modal__title">Solved!</h2>
        <p className="modal__time">
          Your time: <strong>{formatDuration(timeMs)}</strong>
        </p>

        <div
          className="mini-grid"
          style={{
            gridTemplateColumns: `repeat(${puzzle.width}, 1fr)`,
          }}
          aria-hidden="true"
        >
          {puzzle.grid.map((row) =>
            row.map((cell) =>
              cell.isBlack ? (
                <div
                  key={`${cell.row}-${cell.col}`}
                  className="mini-cell mini-cell--black"
                />
              ) : (
                <div key={`${cell.row}-${cell.col}`} className="mini-cell">
                  {cell.current}
                </div>
              )
            )
          )}
        </div>

        <div className="modal__actions">
          <button type="button" className="button" onClick={onClose}>
            View puzzle
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={onNewPuzzle}
          >
            Load another
          </button>
        </div>
      </div>
    </div>
  );
}

import type { Clue } from "../types";

interface ClueListProps {
  title: string;
  clues: Clue[];
  activeClueId?: number;
  onSelect: (clue: Clue) => void;
}

export function ClueList({ title, clues, activeClueId, onSelect }: ClueListProps) {
  return (
    <div className="clue-list">
      <h2 className="clue-list__title">{title}</h2>
      <ul className="clue-list__items">
        {clues.map((clue) => (
          <li key={clue.id}>
            <button
              type="button"
              className={
                "clue-list__item" +
                (clue.id === activeClueId ? " clue-list__item--active" : "")
              }
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(clue);
              }}
            >
              <span className="clue-list__number">{clue.number}</span>
              <span className="clue-list__text">{clue.clue}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

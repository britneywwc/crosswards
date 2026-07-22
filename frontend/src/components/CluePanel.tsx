import type { CrosswordEngine } from "../engine/CrosswordEngine";
import { ClueList } from "./ClueList";

interface CluePanelProps {
  engine: CrosswordEngine;
}

export function CluePanel({ engine }: CluePanelProps) {
  const puzzle = engine.getPuzzle();
  const active = engine.getActiveClue();
  const direction = engine.getDirection();

  return (
    <div className="clue-panel">
      <ClueList
        title="Across"
        clues={puzzle.across}
        activeClueId={direction === "across" ? active?.id : undefined}
        onSelect={(clue) => engine.goToClue(clue)}
      />
      <ClueList
        title="Down"
        clues={puzzle.down}
        activeClueId={direction === "down" ? active?.id : undefined}
        onSelect={(clue) => engine.goToClue(clue)}
      />
    </div>
  );
}

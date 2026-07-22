import { useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { Puzzle } from "../types";
import { CrosswordEngine } from "../engine/CrosswordEngine";
import { useCrosswordEngine } from "../hooks/useCrosswordEngine";
import { PuzzleHeader } from "./PuzzleHeader";
import { CrosswordGrid } from "./CrosswordGrid";
import { CluePanel } from "./CluePanel";
import { StatusBar } from "./StatusBar";
import { PuzzleToolbar } from "./PuzzleToolbar";

interface CrosswordSolverProps {
  puzzle: Puzzle;
  onReset: () => void;
}

export function CrosswordSolver({ puzzle, onReset }: CrosswordSolverProps) {
  // One engine instance per puzzle.
  const engine = useMemo(() => new CrosswordEngine(puzzle), [puzzle]);
  useCrosswordEngine(engine);

  const boardRef = useRef<HTMLDivElement>(null);

  // Keep keyboard focus on the board so typing always works.
  useEffect(() => {
    boardRef.current?.focus();
  }, [puzzle]);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const { key } = e;

    if (key === "ArrowUp") return move(e, "up");
    if (key === "ArrowDown") return move(e, "down");
    if (key === "ArrowLeft") return move(e, "left");
    if (key === "ArrowRight") return move(e, "right");

    if (key === "Backspace") {
      e.preventDefault();
      engine.deleteLetter();
      return;
    }
    if (key === "Delete") {
      e.preventDefault();
      engine.clearCell();
      return;
    }
    if (key === "Tab") {
      e.preventDefault();
      engine.nextClue(e.shiftKey);
      return;
    }
    if (key === "Enter") {
      e.preventDefault();
      engine.nextClue();
      return;
    }
    if (key === " ") {
      e.preventDefault();
      engine.toggleDirection();
      return;
    }
    if (/^[a-zA-Z]$/.test(key)) {
      e.preventDefault();
      engine.enterLetter(key);
      return;
    }
  }

  function move(
    e: KeyboardEvent<HTMLDivElement>,
    dir: "up" | "down" | "left" | "right"
  ) {
    e.preventDefault();
    engine.moveCursor(dir);
  }

  function handleCheck() {
    engine.markCheck();
    // Return focus to the board so keyboard editing keeps working.
    boardRef.current?.focus();
  }

  function handleToggleAutoCheck() {
    engine.setAutoCheck(!engine.isAutoCheck());
    boardRef.current?.focus();
  }

  return (
    <div className="solver">
      <PuzzleHeader puzzle={puzzle} onReset={onReset} />

      <PuzzleToolbar
        engine={engine}
        onCheck={handleCheck}
        onToggleAutoCheck={handleToggleAutoCheck}
      />

      <div
        className="solver__board"
        ref={boardRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="application"
        aria-label="Crossword board — use arrow keys and letters to solve"
      >
        <CrosswordGrid engine={engine} />
        <CluePanel engine={engine} />
      </div>

      <StatusBar engine={engine} />
    </div>
  );
}

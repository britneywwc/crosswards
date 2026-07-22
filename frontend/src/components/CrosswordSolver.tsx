import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Puzzle } from "../types";
import { CrosswordEngine } from "../engine/CrosswordEngine";
import { useCrosswordEngine } from "../hooks/useCrosswordEngine";
import { PuzzleHeader } from "./PuzzleHeader";
import { CrosswordGrid } from "./CrosswordGrid";
import { CluePanel } from "./CluePanel";
import { StatusBar } from "./StatusBar";

interface CrosswordSolverProps {
  puzzle: Puzzle;
  onReset: () => void;
}

export function CrosswordSolver({ puzzle, onReset }: CrosswordSolverProps) {
  // One engine instance per puzzle.
  const engine = useMemo(() => new CrosswordEngine(puzzle), [puzzle]);
  useCrosswordEngine(engine);

  const boardRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  // Keep keyboard focus on the board so typing always works.
  useEffect(() => {
    boardRef.current?.focus();
  }, [puzzle]);

  // Automatically celebrate when the puzzle is completed correctly.
  useEffect(() => {
    if (engine.checkPuzzle().complete) {
      setSolved(true);
      setMessage("Solved! Nicely done.");
    }
  });

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
      if (message) setMessage(null);
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
    const result = engine.markCheck();
    if (result.complete) {
      setSolved(true);
      setMessage("Solved! Nicely done.");
    } else if (!result.filled) {
      setSolved(false);
      setMessage("Not finished yet — keep going.");
    } else {
      setSolved(false);
      setMessage("All filled, but something's not right.");
    }
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

      <StatusBar
        engine={engine}
        onCheck={handleCheck}
        onToggleAutoCheck={handleToggleAutoCheck}
        message={message}
        solved={solved}
      />
    </div>
  );
}

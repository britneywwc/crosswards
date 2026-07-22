import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Puzzle } from "../types";
import { CrosswordEngine } from "../engine/CrosswordEngine";
import { useCrosswordEngine } from "../hooks/useCrosswordEngine";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { formatDuration } from "../utils/time";
import { PuzzleHeader } from "./PuzzleHeader";
import { CrosswordGrid } from "./CrosswordGrid";
import { CluePanel } from "./CluePanel";
import { StatusBar } from "./StatusBar";
import { PuzzleToolbar } from "./PuzzleToolbar";
import { CompletionModal } from "./CompletionModal";

interface CrosswordSolverProps {
  puzzle: Puzzle;
  onReset: () => void;
}

export function CrosswordSolver({ puzzle, onReset }: CrosswordSolverProps) {
  // One engine instance per puzzle.
  const engine = useMemo(() => new CrosswordEngine(puzzle), [puzzle]);
  const version = useCrosswordEngine(engine);

  useKeyboardInset();

  const boardRef = useRef<HTMLDivElement>(null);

  // Timer: starts when the first cell is filled, stops when solved correctly.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [modalOpen, setModalOpen] = useState(false);

  const solved = finishedAt !== null;
  const elapsedMs = Math.max(
    0,
    startedAt === null ? 0 : (finishedAt ?? now) - startedAt
  );

  // Keep keyboard focus on the board so typing always works.
  useEffect(() => {
    boardRef.current?.focus();
  }, [puzzle]);

  // After each engine change, start the timer on first input and stop it when
  // the puzzle is completed correctly.
  useEffect(() => {
    if (finishedAt !== null) return;

    if (startedAt === null && engine.hasAnyInput()) {
      const startTime = Date.now();
      setStartedAt(startTime);
      setNow(startTime);
    }

    if (engine.checkPuzzle().complete) {
      setFinishedAt(Date.now());
      setModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  // Tick the clock every second while the timer is running.
  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (solved) return; // grid is locked once completed
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

  function handlePrevClue() {
    engine.nextClue(true);
    boardRef.current?.focus();
  }

  function handleNextClue() {
    engine.nextClue();
    boardRef.current?.focus();
  }

  return (
    <div className="solver">
      <PuzzleHeader puzzle={puzzle} onReset={onReset} />

      <div className="solver__topbar">
        <PuzzleToolbar
          engine={engine}
          onCheck={handleCheck}
          onToggleAutoCheck={handleToggleAutoCheck}
        />
        <div className="timer" role="timer" aria-label="Elapsed time">
          {formatDuration(elapsedMs)}
        </div>
      </div>

      <div
        className={"solver__board" + (solved ? " solver__board--locked" : "")}
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
        onPrevClue={handlePrevClue}
        onNextClue={handleNextClue}
      />

      {solved && modalOpen && (
        <CompletionModal
          puzzle={puzzle}
          timeMs={elapsedMs}
          onClose={() => setModalOpen(false)}
          onNewPuzzle={onReset}
        />
      )}
    </div>
  );
}

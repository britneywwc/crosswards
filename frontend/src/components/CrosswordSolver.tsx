import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { Puzzle } from "../types";
import { CrosswordEngine } from "../engine/CrosswordEngine";
import { useCrosswordEngine } from "../hooks/useCrosswordEngine";
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

  const boardRef = useRef<HTMLDivElement>(null);
  // Hidden text input that holds focus so mobile browsers show the on-screen
  // keyboard. All typing is captured here and forwarded to the engine.
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the hidden input to summon the mobile keyboard. Must be called from
  // within a user gesture (e.g. tapping a cell) for the keyboard to appear.
  function focusInput() {
    inputRef.current?.focus();
  }

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

  // Keep keyboard focus on the hidden input so typing always works.
  useEffect(() => {
    inputRef.current?.focus();
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

  // Fallback for mobile/IME keyboards that don't emit usable `keydown` letters:
  // read whatever was typed into the hidden input and forward it to the engine.
  function handleInput(e: FormEvent<HTMLInputElement>) {
    const target = e.currentTarget;
    const value = target.value;
    target.value = ""; // reset so the next keystroke is captured fresh
    if (solved) return;
    for (const ch of value) {
      if (/^[a-zA-Z]$/.test(ch)) engine.enterLetter(ch);
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
    // Return focus to the input so keyboard editing keeps working.
    focusInput();
  }

  function handleToggleAutoCheck() {
    engine.setAutoCheck(!engine.isAutoCheck());
    focusInput();
  }

  function handlePrevClue() {
    engine.nextClue(true);
    focusInput();
  }

  function handleNextClue() {
    engine.nextClue();
    focusInput();
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

      <StatusBar
        engine={engine}
        onPrevClue={handlePrevClue}
        onNextClue={handleNextClue}
      />

      <div
        className={"solver__board" + (solved ? " solver__board--locked" : "")}
        ref={boardRef}
        role="application"
        aria-label="Crossword board — use arrow keys and letters to solve"
      >
        {/* Visually hidden input: holds focus to summon the mobile keyboard and
            captures all typing, which is forwarded to the engine. */}
        <input
          ref={inputRef}
          className="solver__input"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-hidden="true"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
        />
        <CrosswordGrid engine={engine} onCellSelect={focusInput} />
        <CluePanel engine={engine} />
      </div>

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

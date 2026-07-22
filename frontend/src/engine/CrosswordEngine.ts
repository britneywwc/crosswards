// The crossword engine owns all solving behavior and is the single source of
// truth for puzzle state. It is deliberately framework-agnostic: no React here.
// React subscribes to change notifications via `subscribe` and reads state
// through the getter methods.

import type {
  CheckResult,
  Cell,
  Clue,
  Direction,
  Position,
  Puzzle,
} from "../types";

type Listener = () => void;

export class CrosswordEngine {
  private puzzle: Puzzle;
  private cursor: Position;
  private direction: Direction = "across";

  private version = 0;
  private listeners = new Set<Listener>();

  constructor(puzzle: Puzzle) {
    this.puzzle = puzzle;
    this.cursor = this.firstWhiteCell();
    // Prefer starting on a cell that begins an across word.
    this.direction = this.hasWord(this.cursor, "across") ? "across" : "down";
  }

  // --- External store plumbing for React (useSyncExternalStore) -------------

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;

  private notify(): void {
    this.version += 1;
    this.listeners.forEach((l) => l());
  }

  // --- Public read API ------------------------------------------------------

  getPuzzle(): Puzzle {
    return this.puzzle;
  }

  getCursor(): Position {
    return this.cursor;
  }

  getDirection(): Direction {
    return this.direction;
  }

  getCell(row: number, col: number): Cell {
    return this.puzzle.grid[row][col];
  }

  /** The clue currently being solved, based on cursor + direction. */
  getActiveClue(): Clue | undefined {
    const cell = this.current();
    const id = this.direction === "across" ? cell.acrossId : cell.downId;
    if (id === undefined) return undefined;
    const list = this.direction === "across" ? this.puzzle.across : this.puzzle.down;
    return list.find((c) => c.id === id);
  }

  /** Cells belonging to the active word (for highlighting). */
  getHighlightedCells(): Position[] {
    const cell = this.current();
    const id = this.direction === "across" ? cell.acrossId : cell.downId;
    if (id === undefined) return [{ row: cell.row, col: cell.col }];

    const result: Position[] = [];
    for (const row of this.puzzle.grid) {
      for (const c of row) {
        const cellId = this.direction === "across" ? c.acrossId : c.downId;
        if (cellId === id) result.push({ row: c.row, col: c.col });
      }
    }
    return result;
  }

  isHighlighted(row: number, col: number): boolean {
    const cell = this.current();
    const activeId = this.direction === "across" ? cell.acrossId : cell.downId;
    if (activeId === undefined) return false;
    const target = this.puzzle.grid[row][col];
    const targetId =
      this.direction === "across" ? target.acrossId : target.downId;
    return targetId === activeId;
  }

  isCursor(row: number, col: number): boolean {
    return this.cursor.row === row && this.cursor.col === col;
  }

  // --- Public mutation API --------------------------------------------------

  /** Select a cell by click. Clicking the active cell toggles direction. */
  selectCell(row: number, col: number): void {
    const cell = this.puzzle.grid[row][col];
    if (cell.isBlack) return;

    if (this.isCursor(row, col)) {
      this.toggleDirection();
      return;
    }

    this.cursor = { row, col };
    // Keep current direction if the cell has a word in it, else flip.
    if (!this.hasWord(this.cursor, this.direction)) {
      this.direction = this.direction === "across" ? "down" : "across";
    }
    this.notify();
  }

  toggleDirection(): void {
    const next: Direction = this.direction === "across" ? "down" : "across";
    if (this.hasWord(this.cursor, next)) {
      this.direction = next;
      this.notify();
    }
  }

  setDirection(direction: Direction): void {
    if (this.direction !== direction && this.hasWord(this.cursor, direction)) {
      this.direction = direction;
      this.notify();
    }
  }

  /** Handle an arrow key. Perpendicular arrows switch direction (NYT-style). */
  moveCursor(arrow: "up" | "down" | "left" | "right"): void {
    const axis: Direction =
      arrow === "left" || arrow === "right" ? "across" : "down";

    if (this.direction !== axis) {
      if (this.hasWord(this.cursor, axis)) {
        this.direction = axis;
        this.notify();
        return;
      }
    }

    const delta: Position =
      arrow === "left"
        ? { row: 0, col: -1 }
        : arrow === "right"
        ? { row: 0, col: 1 }
        : arrow === "up"
        ? { row: -1, col: 0 }
        : { row: 1, col: 0 };

    const next = this.nextWhiteInDirection(this.cursor, delta);
    if (next) {
      this.cursor = next;
      this.notify();
    }
  }

  /** Type a letter into the active cell and auto-advance within the word. */
  enterLetter(letter: string): void {
    const value = letter.toUpperCase();
    if (!/^[A-Z]$/.test(value)) return;

    const cell = this.current();
    if (cell.isBlack) return;

    cell.current = value;
    this.advanceWithinWord();
    this.notify();
  }

  /** Backspace: clear the current cell, else step back and clear. */
  deleteLetter(): void {
    const cell = this.current();
    if (cell.current !== "") {
      cell.current = "";
      this.notify();
      return;
    }

    const prev = this.stepWithinWord(-1);
    if (prev) {
      this.cursor = prev;
      this.current().current = "";
      this.notify();
    }
  }

  /** Delete: clear the current cell without moving. */
  clearCell(): void {
    const cell = this.current();
    if (cell.current !== "") {
      cell.current = "";
      this.notify();
    }
  }

  /** Tab / Shift+Tab: jump to the next/previous clue's first open cell. */
  nextClue(reverse = false): void {
    const list = this.direction === "across" ? this.puzzle.across : this.puzzle.down;
    const active = this.getActiveClue();
    if (list.length === 0) return;

    let index = active ? list.findIndex((c) => c.id === active.id) : 0;
    index = (index + (reverse ? -1 : 1) + list.length) % list.length;
    const target = list[index];

    const start = this.firstCellOfClue(target);
    if (start) {
      this.cursor = this.firstOpenCellOfClue(target) ?? start;
      this.notify();
    }
  }

  /** Check the whole puzzle: filled / correct / complete. */
  checkPuzzle(): CheckResult {
    let filled = true;
    let correct = true;

    for (const row of this.puzzle.grid) {
      for (const cell of row) {
        if (cell.isBlack) continue;
        if (cell.current === "") filled = false;
        else if (cell.current !== cell.solution) correct = false;
      }
    }

    return { filled, correct, complete: filled && correct };
  }

  // --- Internal helpers -----------------------------------------------------

  private current(): Cell {
    return this.puzzle.grid[this.cursor.row][this.cursor.col];
  }

  private firstWhiteCell(): Position {
    for (const row of this.puzzle.grid) {
      for (const cell of row) {
        if (!cell.isBlack) return { row: cell.row, col: cell.col };
      }
    }
    return { row: 0, col: 0 };
  }

  private hasWord(pos: Position, direction: Direction): boolean {
    const cell = this.puzzle.grid[pos.row][pos.col];
    return (direction === "across" ? cell.acrossId : cell.downId) !== undefined;
  }

  private inBounds(row: number, col: number): boolean {
    return (
      row >= 0 &&
      row < this.puzzle.height &&
      col >= 0 &&
      col < this.puzzle.width
    );
  }

  private nextWhiteInDirection(from: Position, delta: Position): Position | null {
    let row = from.row + delta.row;
    let col = from.col + delta.col;
    while (this.inBounds(row, col)) {
      if (!this.puzzle.grid[row][col].isBlack) return { row, col };
      row += delta.row;
      col += delta.col;
    }
    return null;
  }

  /** Move one step forward/back within the current word, if possible. */
  private stepWithinWord(step: 1 | -1): Position | null {
    const delta: Position =
      this.direction === "across"
        ? { row: 0, col: step }
        : { row: step, col: 0 };
    const row = this.cursor.row + delta.row;
    const col = this.cursor.col + delta.col;
    if (!this.inBounds(row, col)) return null;
    if (this.puzzle.grid[row][col].isBlack) return null;
    return { row, col };
  }

  private advanceWithinWord(): void {
    const next = this.stepWithinWord(1);
    if (next) this.cursor = next;
  }

  private firstCellOfClue(clue: Clue): Position | null {
    for (const row of this.puzzle.grid) {
      for (const cell of row) {
        const id = clue.direction === "across" ? cell.acrossId : cell.downId;
        if (id === clue.id && cell.clueNumber === clue.number) {
          return { row: cell.row, col: cell.col };
        }
      }
    }
    // Fallback: any cell with the id.
    for (const row of this.puzzle.grid) {
      for (const cell of row) {
        const id = clue.direction === "across" ? cell.acrossId : cell.downId;
        if (id === clue.id) return { row: cell.row, col: cell.col };
      }
    }
    return null;
  }

  private firstOpenCellOfClue(clue: Clue): Position | null {
    const cells: Cell[] = [];
    for (const row of this.puzzle.grid) {
      for (const cell of row) {
        const id = clue.direction === "across" ? cell.acrossId : cell.downId;
        if (id === clue.id) cells.push(cell);
      }
    }
    cells.sort((a, b) =>
      clue.direction === "across" ? a.col - b.col : a.row - b.row
    );
    const open = cells.find((c) => c.current === "");
    return open ? { row: open.row, col: open.col } : null;
  }

  /** Move the cursor to the first cell of a given clue (used by clue clicks). */
  goToClue(clue: Clue): void {
    const start = this.firstOpenCellOfClue(clue) ?? this.firstCellOfClue(clue);
    if (start) {
      this.cursor = start;
      this.direction = clue.direction;
      this.notify();
    }
  }
}

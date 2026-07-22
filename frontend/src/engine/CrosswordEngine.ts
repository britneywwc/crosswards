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

  private autoCheck = false;

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

    // Determine where to write. In check mode, locked (blue) cells are skipped
    // so typing flows into the next editable cell of the word.
    let target: Position | null = this.cursor;
    if (this.puzzle.grid[target.row][target.col].isBlack) return;
    if (this.isLocked(this.puzzle.grid[target.row][target.col])) {
      target = this.nextEditable(this.cursor, 1);
    }
    if (!target) return; // no editable cell ahead

    const cell = this.puzzle.grid[target.row][target.col];
    cell.current = value;
    cell.checkState = this.autoCheck
      ? cell.current === cell.solution
        ? "correct"
        : "incorrect"
      : undefined;

    // If that completes the word, jump to the next unfinished clue.
    // Otherwise advance to the next editable cell, skipping locked cells.
    this.cursor = target;
    if (this.isWordFilled(target)) {
      this.goToNextIncompleteClue();
    } else {
      this.cursor = this.nextEditable(target, 1) ?? target;
    }
    this.notify();
  }

  /**
   * Backspace behavior:
   * - On a locked (blue) cell in check mode, hop left to the nearest red cell,
   *   or the nearest blue cell if there are no red cells to the left.
   * - Otherwise clear the current letter, or step back and clear the previous.
   */
  deleteLetter(): void {
    const cell = this.current();

    if (this.isLocked(cell)) {
      this.hopLeftInWord();
      return;
    }

    if (cell.current !== "") {
      cell.current = "";
      cell.checkState = undefined;
      this.notify();
      return;
    }

    const prev = this.stepWithinWord(-1);
    if (prev) {
      this.cursor = prev;
      const prevCell = this.current();
      if (this.isLocked(prevCell)) {
        // Landed on a locked cell — apply the hop-left rule from here.
        this.hopLeftInWord();
        return;
      }
      prevCell.current = "";
      prevCell.checkState = undefined;
      this.notify();
      return;
    }

    // At the start of the word: jump back to the previous clue.
    this.goToPreviousClue();
    this.notify();
  }

  /** Delete: clear the current cell without moving. */
  clearCell(): void {
    const cell = this.current();
    if (cell.current !== "" && !this.isLocked(cell)) {
      cell.current = "";
      cell.checkState = undefined;
      this.notify();
    }
  }

  /** A cell is locked once it has been checked and found correct. */
  private isLocked(cell: Cell): boolean {
    return cell.checkState === "correct";
  }

  /**
   * Tab / Shift+Tab / Enter: jump to the next (or previous) clue's first open
   * cell. Clues are ordered Across first, then Down, and wrap around — so the
   * clue after the last Across is the first Down, and vice versa.
   */
  nextClue(reverse = false): void {
    const ordered = [...this.puzzle.across, ...this.puzzle.down];
    if (ordered.length === 0) return;

    const active = this.getActiveClue();
    const index = active
      ? ordered.findIndex(
          (c) => c.id === active.id && c.direction === active.direction
        )
      : 0;
    const nextIndex =
      (index + (reverse ? -1 : 1) + ordered.length) % ordered.length;
    const target = ordered[nextIndex];

    const start =
      this.firstOpenCellOfClue(target) ?? this.firstCellOfClue(target);
    if (start) {
      this.direction = target.direction;
      this.cursor = start;
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

  /**
   * Mark every filled white cell as correct/incorrect for display, then return
   * the aggregate check result. Empty cells are left unmarked.
   */
  markCheck(): CheckResult {
    for (const row of this.puzzle.grid) {
      for (const cell of row) {
        if (cell.isBlack) continue;
        if (cell.current === "") {
          cell.checkState = undefined;
        } else {
          cell.checkState =
            cell.current === cell.solution ? "correct" : "incorrect";
        }
      }
    }
    this.notify();
    return this.checkPuzzle();
  }

  /** Whether "always check" mode is on. */
  isAutoCheck(): boolean {
    return this.autoCheck;
  }

  /**
   * Toggle "always check" mode. Turning it on marks every filled cell
   * immediately; turning it off clears all check colors.
   */
  setAutoCheck(enabled: boolean): void {
    this.autoCheck = enabled;
    if (enabled) {
      this.markCheck();
      return;
    }
    for (const row of this.puzzle.grid) {
      for (const cell of row) {
        cell.checkState = undefined;
      }
    }
    this.notify();
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

  /** Step one cell forward/back within the word from an arbitrary position. */
  private step(from: Position, step: 1 | -1): Position | null {
    const delta: Position =
      this.direction === "across"
        ? { row: 0, col: step }
        : { row: step, col: 0 };
    const row = from.row + delta.row;
    const col = from.col + delta.col;
    if (!this.inBounds(row, col)) return null;
    if (this.puzzle.grid[row][col].isBlack) return null;
    return { row, col };
  }

  /** Move one step forward/back within the current word, if possible. */
  private stepWithinWord(step: 1 | -1): Position | null {
    return this.step(this.cursor, step);
  }

  /**
   * Next editable (non-locked) cell within the word from `from` in `step`
   * direction, skipping locked (blue) cells. Returns null if none remain.
   */
  private nextEditable(from: Position, step: 1 | -1): Position | null {
    let pos = this.step(from, step);
    while (pos) {
      if (!this.isLocked(this.puzzle.grid[pos.row][pos.col])) return pos;
      pos = this.step(pos, step);
    }
    return null;
  }

  /** Nearest cell to the left within the word matching a predicate. */
  private nearestLeft(predicate: (cell: Cell) => boolean): Position | null {
    let pos = this.step(this.cursor, -1);
    while (pos) {
      if (predicate(this.puzzle.grid[pos.row][pos.col])) return pos;
      pos = this.step(pos, -1);
    }
    return null;
  }

  /** True when every cell of the word containing `pos` has a letter. */
  private isWordFilled(pos: Position): boolean {
    const cell = this.puzzle.grid[pos.row][pos.col];
    const id = this.direction === "across" ? cell.acrossId : cell.downId;
    if (id === undefined) return false;
    for (const row of this.puzzle.grid) {
      for (const c of row) {
        const cid = this.direction === "across" ? c.acrossId : c.downId;
        if (cid === id && c.current === "") return false;
      }
    }
    return true;
  }

  /**
   * Move the cursor to the first open cell of the next clue (in the current
   * direction) that still has empty cells. Wraps around; if every clue is
   * complete, the cursor is left where it is.
   */
  private goToNextIncompleteClue(): void {
    const list =
      this.direction === "across" ? this.puzzle.across : this.puzzle.down;
    const active = this.getActiveClue();
    if (!active || list.length === 0) return;

    const startIndex = list.findIndex((c) => c.id === active.id);
    for (let i = 1; i <= list.length; i++) {
      const clue = list[(startIndex + i) % list.length];
      const open = this.firstOpenCellOfClue(clue);
      if (open) {
        this.cursor = open;
        return;
      }
    }
  }

  /** Hop left to the nearest red cell, else the nearest blue cell. */
  private hopLeftInWord(): void {
    const red = this.nearestLeft((c) => c.checkState === "incorrect");
    if (red) {
      this.cursor = red;
      this.notify();
      return;
    }
    const blue = this.nearestLeft((c) => this.isLocked(c));
    if (blue) {
      this.cursor = blue;
      this.notify();
      return;
    }
    // Nothing editable to the left in this word — go to the previous clue.
    this.goToPreviousClue();
    this.notify();
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

  /** Last cell of a clue's word (rightmost for across, lowest for down). */
  private lastCellOfClue(clue: Clue): Position | null {
    const cells: Cell[] = [];
    for (const row of this.puzzle.grid) {
      for (const cell of row) {
        const id = clue.direction === "across" ? cell.acrossId : cell.downId;
        if (id === clue.id) cells.push(cell);
      }
    }
    if (cells.length === 0) return null;
    cells.sort((a, b) =>
      clue.direction === "across" ? a.col - b.col : a.row - b.row
    );
    const last = cells[cells.length - 1];
    return { row: last.row, col: last.col };
  }

  /**
   * Move the cursor to the last cell of the previous clue (in the current
   * direction). Wraps around; used by backspace at the start of a word.
   */
  private goToPreviousClue(): void {
    const list =
      this.direction === "across" ? this.puzzle.across : this.puzzle.down;
    const active = this.getActiveClue();
    if (!active || list.length === 0) return;

    const startIndex = list.findIndex((c) => c.id === active.id);
    const clue = list[(startIndex - 1 + list.length) % list.length];
    const last = this.lastCellOfClue(clue);
    if (last) this.cursor = last;
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

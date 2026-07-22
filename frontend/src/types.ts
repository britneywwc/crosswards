// Puzzle model shared with the backend JSON API. The frontend never sees the
// binary `.puz` format — only this clean model.

export type Direction = "across" | "down";

export interface Cell {
  row: number;
  col: number;

  solution: string;
  current: string;

  isBlack: boolean;

  clueNumber?: number;

  acrossId?: number;
  downId?: number;
}

export interface Clue {
  id: number;
  number: number;
  direction: Direction;
  clue: string;
}

export interface Puzzle {
  id: string;
  title: string;
  author: string;

  width: number;
  height: number;

  grid: Cell[][];

  across: Clue[];
  down: Clue[];
}

export interface Position {
  row: number;
  col: number;
}

export interface CheckResult {
  filled: boolean; // every white cell has a letter
  correct: boolean; // every filled letter matches the solution
  complete: boolean; // filled AND correct
}

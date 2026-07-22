import { useState } from "react";
import type { Puzzle } from "./types";
import { PuzzleLoader } from "./components/PuzzleLoader";
import { CrosswordSolver } from "./components/CrosswordSolver";
import "./App.css";

export default function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);

  return (
    <div className="app">
      {puzzle ? (
        <CrosswordSolver puzzle={puzzle} onReset={() => setPuzzle(null)} />
      ) : (
        <PuzzleLoader onLoaded={setPuzzle} />
      )}
    </div>
  );
}

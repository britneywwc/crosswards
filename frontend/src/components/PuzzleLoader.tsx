import { useRef, useState } from "react";
import type { Puzzle } from "../types";
import { uploadPuzzle } from "../api/client";

interface PuzzleLoaderProps {
  onLoaded: (puzzle: Puzzle) => void;
}

export function PuzzleLoader({ onLoaded }: PuzzleLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const puzzle = await uploadPuzzle(file);
      onLoaded(puzzle);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load puzzle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loader">
      <h1 className="loader__title">Crosswards</h1>
      <p className="loader__subtitle">
        Upload an Across Lite <code>.puz</code> file to start solving.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".puz"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <button
        type="button"
        className="button button--primary"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? "Loading…" : "Choose .puz file"}
      </button>

      {error && <p className="loader__error">{error}</p>}
    </div>
  );
}

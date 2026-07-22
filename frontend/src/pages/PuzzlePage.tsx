import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Puzzle } from "../types";
import { getPuzzle } from "../api/client";
import { CrosswordSolver } from "../components/CrosswordSolver";

export function PuzzlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setPuzzle(null);
    setError(null);

    if (!id) return;

    getPuzzle(id)
      .then((p) => {
        if (active) setPuzzle(p);
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load puzzle");
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="loader">
        <h1 className="loader__title">Crosswards</h1>
        <p className="loader__error">{error}</p>
        <Link className="button button--primary" to="/">
          Back to start
        </Link>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="loader">
        <p className="loader__subtitle">Loading puzzle…</p>
      </div>
    );
  }

  return <CrosswordSolver puzzle={puzzle} onReset={() => navigate("/")} />;
}

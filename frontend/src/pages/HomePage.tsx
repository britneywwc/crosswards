import { Link, useNavigate } from "react-router-dom";
import { PuzzleLoader } from "../components/PuzzleLoader";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <PuzzleLoader
      onLoaded={(puzzle) => navigate(`/puzzle/${puzzle.id}`)}
      featured={
        <div className="loader__puzzles">
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate("/puzzle/nyt")}
          >
            NYT Crossword
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate("/puzzle/nyt-mini")}
          >
            NYT Mini
          </button>
          <p className="loader__sample">
            or <Link to="/puzzle/sample">try the sample</Link>
          </p>
        </div>
      }
    />
  );
}

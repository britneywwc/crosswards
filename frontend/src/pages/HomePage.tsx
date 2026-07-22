import { Link, useNavigate } from "react-router-dom";
import { PuzzleLoader } from "../components/PuzzleLoader";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <PuzzleLoader
      onLoaded={(puzzle) => navigate(`/puzzle/${puzzle.id}`)}
      extra={
        <p className="loader__sample">
          or <Link to="/puzzle/sample">try the sample puzzle</Link>
        </p>
      }
    />
  );
}

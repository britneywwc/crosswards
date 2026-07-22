"""Crosswards backend REST API.

Phase 1 responsibility: parse uploaded `.puz` files into the clean JSON puzzle
model and serve puzzles to the frontend. No database yet — parsed puzzles are
kept in an in-memory store for the lifetime of the process.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .puz_parser import PuzParseError, Puzzle, parse_puz
from .sample_puzzle import build_sample_puzzle

app = FastAPI(title="Crosswards API", version="0.1.0")

# Allow the Vite dev server to call the API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory store: id -> Puzzle.
_PUZZLES: Dict[str, Puzzle] = {}

# Bundled sample puzzles, available under stable ids.
_SAMPLES_DIR = Path(__file__).resolve().parent.parent / "samples"
_SAMPLE_PATH = _SAMPLES_DIR / "sample.puz"

# id -> filename for the bundled NYT puzzles served on the homepage.
_BUNDLED_SAMPLES = {
    "nyt": "NY Times - 20260722.puz",
    "nyt-mini": "NY Times Mini - 20260722.puz",
}


def _load_sample() -> None:
    """Register the sample puzzle under the id "sample".

    Prefer the bundled samples/sample.puz when present (local dev); otherwise
    build it in memory so it also works in serverless deployments where data
    files may not be bundled.
    """
    try:
        if _SAMPLE_PATH.exists():
            _PUZZLES["sample"] = parse_puz(
                _SAMPLE_PATH.read_bytes(), puzzle_id="sample"
            )
            return
    except Exception:
        pass
    _PUZZLES["sample"] = build_sample_puzzle()


def _load_bundled() -> None:
    """Register the bundled NYT puzzles under their stable ids, if present."""
    for puzzle_id, filename in _BUNDLED_SAMPLES.items():
        path = _SAMPLES_DIR / filename
        try:
            if path.exists():
                _PUZZLES[puzzle_id] = parse_puz(
                    path.read_bytes(), puzzle_id=puzzle_id
                )
        except Exception:
            # Skip any puzzle that fails to parse rather than failing startup.
            pass


@app.on_event("startup")
def _on_startup() -> None:
    _load_sample()
    _load_bundled()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/puzzles")
async def upload_puzzle(file: UploadFile = File(...)) -> dict:
    """Accept a `.puz` upload, parse it, store it, and return the JSON model."""
    contents = await file.read()
    puzzle_id = uuid.uuid4().hex

    try:
        puzzle = parse_puz(contents, puzzle_id=puzzle_id)
    except PuzParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    _PUZZLES[puzzle_id] = puzzle
    return puzzle.to_dict()


@app.get("/api/puzzles/{puzzle_id}")
def get_puzzle(puzzle_id: str) -> dict:
    puzzle = _PUZZLES.get(puzzle_id)
    if puzzle is None:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return puzzle.to_dict()


@app.get("/api/puzzles")
def list_puzzles() -> list:
    return [
        {"id": p.id, "title": p.title, "author": p.author}
        for p in _PUZZLES.values()
    ]

"""Crosswards backend REST API.

Phase 1 responsibility: parse uploaded `.puz` files into the clean JSON puzzle
model and serve puzzles to the frontend. No database yet — parsed puzzles are
kept in an in-memory store for the lifetime of the process.
"""

from __future__ import annotations

import uuid
from typing import Dict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .puz_parser import PuzParseError, Puzzle, parse_puz

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

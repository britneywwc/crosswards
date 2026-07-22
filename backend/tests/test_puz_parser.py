"""Tests for the `.puz` parser."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.puz_parser import parse_puz  # noqa: E402
from tests.puz_builder import build_puz  # noqa: E402


def _sample_puz() -> bytes:
    # 5x5 grid, corners black.
    #   C A T . .
    #   A . . . .
    #   T . . . .
    #   . . . . .
    #   . . . . .
    solution = (
        "CAT.."
        "A...."
        "T...."
        "....."
        "....."
    )
    clues = [
        "Feline (across 1)",
        "Big top (down 1)",  # A start (col1) has down? A at (0,1): below is '.' -> no down.
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
        "placeholder",
    ]
    return build_puz(5, 5, solution, "Test Puzzle", "Tester", "(c) 2026", clues)


def test_dimensions_and_meta():
    puz = parse_puz(_sample_puz())
    assert puz.width == 5
    assert puz.height == 5
    assert puz.title == "Test Puzzle"
    assert puz.author == "Tester"


def test_black_squares():
    puz = parse_puz(_sample_puz())
    assert puz.grid[0][3].isBlack is True
    assert puz.grid[0][4].isBlack is True
    assert puz.grid[0][0].isBlack is False
    assert puz.grid[0][0].solution == "C"


def test_clue_numbering_first_cell():
    puz = parse_puz(_sample_puz())
    # (0,0) starts both an across and a down word -> number 1.
    assert puz.grid[0][0].clueNumber == 1
    assert puz.grid[0][0].acrossId is not None
    assert puz.grid[0][0].downId is not None


def test_across_ids_span_word():
    puz = parse_puz(_sample_puz())
    first_across = puz.grid[0][0].acrossId
    assert puz.grid[0][1].acrossId == first_across
    assert puz.grid[0][2].acrossId == first_across
    # Black cell has no across id.
    assert puz.grid[0][3].acrossId is None


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-v"]))

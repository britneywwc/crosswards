"""Builds the bundled sample puzzle in memory.

This mirrors backend/scripts/generate_sample.py but avoids depending on the
`samples/sample.puz` file being present at runtime (e.g. in a serverless
deployment where data files may not be bundled).
"""

from __future__ import annotations

from typing import List

from .puz_parser import Puzzle, parse_puz

_ENCODING = "ISO-8859-1"

# A 5x5 word square: every row and column spells a valid word.
#   H E A R T
#   E M B E R
#   A B U S E
#   R E S I N
#   T R E N D
_SOLUTION = "HEART" "EMBER" "ABUSE" "RESIN" "TREND"

# Clues appear in .puz order: for each numbered cell, across before down.
_CLUES = [
    "Symbol of love (across)",  # 1A HEART
    "Symbol of love (down)",  # 1D HEART
    "Glowing coal",  # 2D EMBER
    "Mistreat",  # 3D ABUSE
    "Pine sap",  # 4D RESIN
    "Fashion movement",  # 5D TREND
    "Glowing coal",  # 6A EMBER
    "Mistreat",  # 7A ABUSE
    "Pine sap",  # 8A RESIN
    "Fashion movement",  # 9A TREND
]


def _build_puz(
    width: int,
    height: int,
    solution: str,
    title: str,
    author: str,
    copyright_text: str,
    clues: List[str],
) -> bytes:
    state = "".join("." if ch == "." else "-" for ch in solution)

    header = bytearray(0x34)
    header[0x02:0x0E] = b"ACROSS&DOWN\x00"
    header[0x18:0x1C] = b"1.3\x00"
    header[0x2C] = width
    header[0x2D] = height
    header[0x2E:0x30] = len(clues).to_bytes(2, "little")

    body = bytearray()
    body += solution.encode(_ENCODING)
    body += state.encode(_ENCODING)
    for text in (title, author, copyright_text, *clues):
        body += text.encode(_ENCODING) + b"\x00"

    return bytes(header) + bytes(body)


def build_sample_puzzle() -> Puzzle:
    """Return the parsed sample puzzle, registered under the id "sample"."""
    data = _build_puz(
        width=5,
        height=5,
        solution=_SOLUTION,
        title="Word Square Mini",
        author="Crosswards",
        copyright_text="(c) 2026 Crosswards",
        clues=_CLUES,
    )
    return parse_puz(data, puzzle_id="sample")

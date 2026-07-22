"""Generate a sample `.puz` file for local development and demos.

Run from the backend directory:  python -m scripts.generate_sample
Outputs samples/sample.puz — a 5x5 word square.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tests.puz_builder import build_puz  # noqa: E402

# A 5x5 word square: every row and column spells a valid word.
#   H E A R T
#   E M B E R
#   A B U S E
#   R E S I N
#   T R E N D
SOLUTION = (
    "HEART"
    "EMBER"
    "ABUSE"
    "RESIN"
    "TREND"
)

# Clues appear in .puz order: for each numbered cell, across before down.
CLUES = [
    "Symbol of love (across)",   # 1A HEART
    "Symbol of love (down)",     # 1D HEART
    "Glowing coal",              # 2D EMBER
    "Mistreat",                  # 3D ABUSE
    "Pine sap",                  # 4D RESIN
    "Fashion movement",          # 5D TREND
    "Glowing coal",              # 6A EMBER
    "Mistreat",                  # 7A ABUSE
    "Pine sap",                  # 8A RESIN
    "Fashion movement",          # 9A TREND
]


def main() -> None:
    data = build_puz(
        width=5,
        height=5,
        solution=SOLUTION,
        title="Word Square Mini",
        author="Crosswards",
        copyright_text="(c) 2026 Crosswards",
        clues=CLUES,
    )
    out_dir = os.path.join(os.path.dirname(__file__), "..", "samples")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "sample.puz")
    with open(out_path, "wb") as fh:
        fh.write(data)
    print(f"Wrote {out_path} ({len(data)} bytes)")


if __name__ == "__main__":
    main()

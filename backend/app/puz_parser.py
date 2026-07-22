"""Parser for the Across Lite `.puz` binary crossword format.

This module converts a raw `.puz` byte string into a
 :class:`Puzzle` dictionary that matches the JSON model
described in the project spec.

Reference for the format:
https://code.google.com/archive/p/puz/wikis/FileFormat.wiki
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import List, Optional

# Encoding used by the classic .puz format.
_ENCODING = "ISO-8859-1"

# Offsets into the fixed-size header.
_WIDTH_OFFSET = 0x2C
_HEIGHT_OFFSET = 0x2D
_NUM_CLUES_OFFSET = 0x2E
_GRID_OFFSET = 0x34

_BLACK = "."
_EMPTY = "-"


class PuzParseError(ValueError):
    """Raised when the provided bytes are not a valid `.puz` file."""


@dataclass
class Cell:
    row: int
    col: int
    solution: str
    current: str
    isBlack: bool
    clueNumber: Optional[int] = None
    acrossId: Optional[int] = None
    downId: Optional[int] = None


@dataclass
class Clue:
    id: int
    number: int
    direction: str  # "across" | "down"
    clue: str


@dataclass
class Puzzle:
    id: str
    title: str
    author: str
    width: int
    height: int
    grid: List[List[Cell]]
    across: List[Clue] = field(default_factory=list)
    down: List[Clue] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


def _read_string(data: bytes, start: int) -> tuple[str, int]:
    """Read a NUL-terminated string starting at *start*.

    Returns the decoded string and the index just past the terminator.
    """
    end = data.find(b"\x00", start)
    if end == -1:
        raise PuzParseError("Unterminated string in puzzle data")
    return data[start:end].decode(_ENCODING), end + 1


def _starts_across(
        grid: List[List[str]],
        row: int,
        col: int,
        width: int
) -> bool:
    if grid[row][col] == _BLACK:
        return False
    left_is_edge = col == 0 or grid[row][col - 1] == _BLACK
    has_right = col + 1 < width and grid[row][col + 1] != _BLACK
    return left_is_edge and has_right


def _starts_down(
        grid: List[List[str]],
        row: int,
        col: int,
        height: int
) -> bool:
    if grid[row][col] == _BLACK:
        return False
    top_is_edge = row == 0 or grid[row - 1][col] == _BLACK
    has_below = row + 1 < height and grid[row + 1][col] != _BLACK
    return top_is_edge and has_below


def parse_puz(data: bytes, puzzle_id: str = "puzzle") -> Puzzle:
    """Parse raw `.puz` bytes into a :class:`Puzzle`."""
    if len(data) < _GRID_OFFSET:
        raise PuzParseError("File too small to be a valid .puz")

    # Validate the magic string that identifies the format version.
    if b"ACROSS&DOWN" not in data[0x02:0x18]:
        raise PuzParseError("Missing ACROSS&DOWN magic string")

    width = data[_WIDTH_OFFSET]
    height = data[_HEIGHT_OFFSET]
    num_clues = int.from_bytes(
        data[_NUM_CLUES_OFFSET:_NUM_CLUES_OFFSET + 2], "little"
    )

    if width == 0 or height == 0:
        raise PuzParseError("Puzzle has zero width or height")

    cell_count = width * height
    solution_start = _GRID_OFFSET
    state_start = solution_start + cell_count
    strings_start = state_start + cell_count

    if len(data) < strings_start:
        raise PuzParseError("File truncated: grid data incomplete")

    solution_bytes = data[solution_start:state_start].decode(_ENCODING)
    state_bytes = data[state_start:strings_start].decode(_ENCODING)

    # Build 2D character grids for numbering logic.
    solution_grid = [
        list(solution_bytes[r * width: (r + 1) * width]) for r in range(height)
    ]
    state_grid = [
        list(state_bytes[r * width: (r + 1) * width]) for r in range(height)
    ]

    # Read the variable-length string section.
    title, idx = _read_string(data, strings_start)
    author, idx = _read_string(data, idx)
    _copyright, idx = _read_string(data, idx)

    raw_clues: List[str] = []
    for _ in range(num_clues):
        clue_text, idx = _read_string(data, idx)
        raw_clues.append(clue_text)

    # Assign clue numbers and clues by scanning cells in reading order.
    cells: List[List[Cell]] = [
        [
            Cell(
                row=r,
                col=c,
                solution=(
                    ""
                    if solution_grid[r][c] == _BLACK
                    else solution_grid[r][c]
                ),
                current=(
                    ""
                    if state_grid[r][c] in (_BLACK, _EMPTY)
                    else state_grid[r][c]
                ),
                isBlack=solution_grid[r][c] == _BLACK,
            )
            for c in range(width)
        ]
        for r in range(height)
    ]

    across: List[Clue] = []
    down: List[Clue] = []
    clue_index = 0
    number = 0

    for r in range(height):
        for c in range(width):
            starts_a = _starts_across(solution_grid, r, c, width)
            starts_d = _starts_down(solution_grid, r, c, height)
            if not (starts_a or starts_d):
                continue

            number += 1
            cells[r][c].clueNumber = number

            if starts_a:
                clue_id = clue_index + 1
                text = (
                    raw_clues[clue_index]
                    if clue_index < len(raw_clues)
                    else ""
                )
                across.append(
                    Clue(
                        id=clue_id,
                        number=number,
                        direction="across",
                        clue=text,
                    )
                )
                _assign_across_ids(cells, r, c, width, clue_id)
                clue_index += 1

            if starts_d:
                clue_id = clue_index + 1
                text = (
                    raw_clues[clue_index]
                    if clue_index < len(raw_clues)
                    else ""
                )
                down.append(
                    Clue(
                        id=clue_id,
                        number=number,
                        direction="down",
                        clue=text,
                    )
                )
                _assign_down_ids(cells, r, c, height, clue_id)
                clue_index += 1

    return Puzzle(
        id=puzzle_id,
        title=title,
        author=author,
        width=width,
        height=height,
        grid=cells,
        across=across,
        down=down,
    )


def _assign_across_ids(
    cells: List[List[Cell]], row: int, col: int, width: int, clue_id: int
) -> None:
    c = col
    while c < width and not cells[row][c].isBlack:
        cells[row][c].acrossId = clue_id
        c += 1


def _assign_down_ids(
    cells: List[List[Cell]], row: int, col: int, height: int, clue_id: int
) -> None:
    r = row
    while r < height and not cells[r][col].isBlack:
        cells[r][col].downId = clue_id
        r += 1

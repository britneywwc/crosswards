"""Minimal `.puz` byte builder used for tests and generating sample puzzles."""

from __future__ import annotations

from typing import List

_ENCODING = "ISO-8859-1"


def build_puz(
    width: int,
    height: int,
    solution: str,
    title: str,
    author: str,
    copyright_text: str,
    clues: List[str],
) -> bytes:
    """Build a valid (checksum-zeroed) `.puz` byte string.

    ``solution`` is a width*height string using '.' for black squares.
    Checksums are left as zero; the parser does not validate them.
    """
    assert len(solution) == width * height, "solution length mismatch"

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

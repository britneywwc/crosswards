# Crosswards

A modern crossword platform. **Phase 1** is a polished single-player crossword
solver: upload an Across Lite `.puz` file, view the puzzle, and solve it entirely
with the keyboard.

The backend parses the binary `.puz` format into a clean JSON model — the
frontend never sees the binary format. All crossword behavior lives in a
framework-agnostic **engine**, keeping the logic testable and reusable.

```
React components  →  CrosswordEngine  →  Puzzle model
```

## Project layout

```
backend/         Python FastAPI service: .puz parsing + REST API
  app/
    puz_parser.py   Binary .puz → Puzzle model
    main.py         REST endpoints
  tests/            Parser tests + in-memory .puz builder
  scripts/          Sample puzzle generator
  samples/          sample.puz (generated)
frontend/        Vite + React + TypeScript solver
  src/
    engine/         CrosswordEngine (all solving logic)
    components/      Grid, cells, clue panel, status bar, loader
    api/             Backend client
```

## Running the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Generate the sample puzzle (optional)
python -m scripts.generate_sample

# Start the API on http://localhost:8000
uvicorn app.main:app --reload
```

### API

| Method | Path                   | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| POST   | `/api/puzzles`         | Upload a `.puz` file, get JSON model |
| GET    | `/api/puzzles/{id}`    | Fetch a parsed puzzle                |
| GET    | `/api/puzzles`         | List uploaded puzzles                |
| GET    | `/health`              | Health check                         |

Run tests: `python -m pytest tests/`

## Fetching NYT puzzles

Download the latest New York Times puzzle(s) as `.puz` files into
`backend/samples/` using [`xword-dl`](https://github.com/thisisparker/xword-dl):

```bash
# One-time: add your NYT-S subscriber token (this file is gitignored)
cp backend/config/xword-dl.yaml.example backend/config/xword-dl.yaml
# edit backend/config/xword-dl.yaml and paste your NYT-S token

# Download the daily puzzle (add outlets like `nytm` for the mini)
./scripts/fetch-nyt.sh            # or: task fetch:nyt
./scripts/fetch-nyt.sh nyt nytm   # or: task fetch:nyt -- nyt nytm
```

The token config (`backend/config/xword-dl.yaml`) is a **secret** and is never
committed. For deployments, upload it to your platform separately and point the
script at it with the `XWORD_DL_CONFIG` environment variable if it lives
elsewhere. The script uses `uvx xword-dl` when `uv` is installed, otherwise a
`xword-dl` on your `PATH` (`pip install xword-dl`).


## Running the frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

The dev server expects the API at `http://localhost:8000`. Override with a
`VITE_API_URL` environment variable if needed.

## Keyboard controls

| Key            | Action                                   |
| -------------- | ---------------------------------------- |
| A–Z            | Enter a letter (auto-advances)           |
| Arrow keys     | Move; perpendicular arrow switches axis  |
| Backspace      | Clear current cell, step back            |
| Delete         | Clear current cell                       |
| Tab / Shift+Tab| Next / previous clue                     |
| Space          | Toggle Across / Down                     |
| Click a cell   | Select; click again to toggle direction  |
| Click a clue   | Jump to that word                        |

## Roadmap

Phase 1 (this): parse `.puz`, render grid + clues, keyboard solving, highlight,
completion detection. Later phases add saved progress, accounts, multiplayer, a
puzzle editor, and generation — see `spec.md`.

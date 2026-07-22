# Crosswards – Project Plan (Phase 1)

## Overview

**Crosswards** is a modern crossword platform focused on solving, creating, and eventually collaborating on crossword puzzles.

The long-term vision includes:

* Solving crossword puzzles
* Creating crossword puzzles
* Multiplayer solving with real-time collaboration
* Importing and exporting `.puz` files
* User accounts and saved progress

Phase 1 focuses solely on building a polished single-player crossword solver.

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* CSS/Tailwind (implementation choice)

## Backend

* Python
* REST API
* PostgreSQL (later)
* Redis (later)
* WebSockets (later)

Initially, the backend's responsibility is simply serving crossword puzzles and handling file parsing.

---

# Puzzle Format

The application uses the **Across Lite `.puz` format**.

Puzzles are downloaded externally and uploaded/imported into the application.

The frontend should **never know about the `.puz` binary format**.

Instead, the backend parses the file into a clean JSON model.

Example model:

```ts
interface Puzzle {
    id: string;
    title: string;
    author: string;

    width: number;
    height: number;

    grid: Cell[][];

    across: Clue[];
    down: Clue[];
}

interface Cell {
    row: number;
    col: number;

    solution: string;
    current: string;

    isBlack: boolean;

    clueNumber?: number;

    acrossId?: number;
    downId?: number;
}

interface Clue {
    id: number;
    number: number;
    direction: "across" | "down";
    clue: string;
}
```

---

# Phase 1 Goal

A user should be able to:

* Load any valid `.puz` crossword
* View the crossword
* Solve it entirely using only the keyboard
* Navigate naturally like a professional crossword application

No multiplayer or accounts yet.

---

# Frontend Architecture

```
App

├── PuzzleHeader
├── CrosswordGrid
│      └── Cell
├── CluePanel
│      ├── AcrossList
│      └── DownList
└── StatusBar
```

Crossword logic should **not** live inside React components.

Instead:

```
React Components

↓

Crossword Engine

↓

Puzzle Model
```

The engine owns all crossword behavior.

Example API:

```ts
engine.selectCell()

engine.moveCursor()

engine.enterLetter()

engine.deleteLetter()

engine.getHighlightedCells()

engine.checkPuzzle()
```

This keeps the logic testable and reusable.

---

# Grid Representation

Internally, the crossword is represented as:

```
Cell[][]
```

Each cell stores:

* solution letter
* current entered letter
* black/white status
* clue number
* across clue ID
* down clue ID

---

# Cell UI

Each cell should display:

* Current letter
* Clue number (if applicable)
* Selection state
* Highlight state

Future additions:

* Correct/incorrect state
* Multiplayer cursor
* Other player highlights

---

# Required Keyboard Behavior

Implement:

* Letter typing
* Arrow keys
* Backspace
* Delete
* Tab
* Click to select
* Switch between Across and Down
* Auto-advance after typing

The interaction should feel similar to established crossword applications.

---

# Clue Panel

Display:

Across

```
1.
5.
8.
...
```

Down

```
2.
3.
4.
...
```

Selecting:

* a clue
* or a cell

should highlight both:

* the clue
* the corresponding word in the grid

---

# Phase Roadmap

## Phase 1

* Parse `.puz`
* Convert to JSON
* Render crossword
* Render clues
* Cell selection
* Keyboard navigation
* Word highlighting
* Puzzle completion detection

---

## Phase 2

* Save progress
* Local storage
* Import multiple puzzles
* Puzzle browser
* Check word / check puzzle
* Reveal word / reveal puzzle

---

## Phase 3

* User authentication
* Database persistence
* Puzzle library
* Favorite puzzles
* Statistics

---

## Phase 4

* Multiplayer solving
* WebSockets
* Live cursor positions
* Shared solving
* Chat
* Presence
* Race mode

---

## Phase 5

* Crossword editor
* Create puzzles
* Automatic clue numbering
* Puzzle validation
* Export `.puz`

---

## Phase 6

* Automatic crossword generation
* Search algorithms
* AI-assisted clue generation
* Daily crossword
* Public puzzle sharing

---

# Design Principles

* Separate UI from crossword logic.
* Keep the parser independent of the frontend.
* Treat the crossword engine as the single source of truth.
* Build with extensibility in mind so multiplayer and puzzle creation can be added without major refactoring.
* Prioritize keyboard-first interactions for a smooth solving experience.

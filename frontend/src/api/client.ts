import type { Puzzle } from "../types";

// In production, call the API on the same origin ("/api/…") so Vercel's rewrite
// routes it to the backend service. In dev, fall back to the local API server.
// VITE_API_URL overrides both when set.
const BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? "" : "http://localhost:8000");

/** Upload a `.puz` file to the backend and receive the parsed JSON model. */
export async function uploadPuzzle(file: File): Promise<Puzzle> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/api/puzzles`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail ?? `Upload failed (${res.status})`);
  }

  return (await res.json()) as Puzzle;
}

/** Fetch a previously uploaded puzzle by id. */
export async function getPuzzle(id: string): Promise<Puzzle> {
  const res = await fetch(`${BASE_URL}/api/puzzles/${id}`);
  if (!res.ok) {
    throw new Error(`Puzzle not found (${res.status})`);
  }
  return (await res.json()) as Puzzle;
}

async function safeDetail(res: Response): Promise<string | null> {
  try {
    const body = await res.json();
    return typeof body?.detail === "string" ? body.detail : null;
  } catch {
    return null;
  }
}

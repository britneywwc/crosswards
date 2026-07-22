import { useSyncExternalStore } from "react";
import type { CrosswordEngine } from "../engine/CrosswordEngine";

/**
 * Subscribe a React component to a CrosswordEngine instance. Any engine state
 * change triggers a re-render; components read fresh data via engine getters.
 */
export function useCrosswordEngine(engine: CrosswordEngine): number {
  return useSyncExternalStore(engine.subscribe, engine.getVersion);
}

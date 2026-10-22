import { useEffect, useRef } from 'react';
import { defaultSaveIO, type SaveIO } from './gameSave';
import { saveGameToSlot } from './gameSaveService';

export interface UseGameAutosaveOptions {
  /** Fixed at 30 s in the demo (Director, O-5): not a player option. */
  intervalMs: number;
  /** Current game-clock tick; the save is skipped while it has not moved since the last autosave. */
  getTick: () => number;
  /** Writes the in-memory gameplay state to its key before the capture. */
  flush: () => Promise<boolean> | boolean | void;
  io?: SaveIO;
  enabled?: boolean;
}

/** Refreshes the single autosave slot on a timer (rotation: one slot, PLAN-076 O-1). Manual slots are never touched. */
export function useGameAutosave({ intervalMs, getTick, flush, io = defaultSaveIO, enabled = true }: UseGameAutosaveOptions): void {
  const latest = useRef({ getTick, flush, io });
  latest.current = { getTick, flush, io };
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setInterval(() => {
      const tick = latest.current.getTick();
      if (tick === lastTick.current) return;
      void saveGameToSlot('auto', { io: latest.current.io, flush: latest.current.flush }).then((ok) => {
        if (ok) lastTick.current = tick;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);
}

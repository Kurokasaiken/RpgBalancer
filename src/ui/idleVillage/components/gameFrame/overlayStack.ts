/**
 * overlayStack — PLAN-040 T-003a: registration order of the quest overlays
 * mounted in `#game-modal-root`, and the single rule for `Escape`: only the
 * TOPMOST overlay receives it (debate r007). Each overlay keeps its own
 * "may I dismiss now" policy inside its handler — the skill check, for
 * instance, ignores Escape mid-spin and answers it once the verdict is
 * painted and armed.
 *
 * One shared `window` keydown listener is armed lazily on the first
 * registration; the handler map is re-pointed every render so closures never
 * go stale.
 */

import { useEffect, useRef } from 'react';

const overlayStack: string[] = [];
const escapeHandlers = new Map<string, () => void>();
let escapeListenerArmed = false;

function onWindowKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  const top = overlayStack[overlayStack.length - 1];
  if (!top) return;
  escapeHandlers.get(top)?.();
}

function armEscapeListener(): void {
  if (escapeListenerArmed || typeof window === 'undefined') return;
  window.addEventListener('keydown', onWindowKeydown);
  escapeListenerArmed = true;
}

/** True when `id` is the stack's topmost overlay — the only Escape receiver. */
export function isTopmostOverlay(id: string): boolean {
  return overlayStack[overlayStack.length - 1] === id;
}

/** Read-only snapshot of the current stack (tests + the toast controller). */
export function overlayStackSnapshot(): readonly string[] {
  return overlayStack;
}

/**
 * Registers `id` on the overlay stack for `onEscape`. The handler always
 * calls the latest render's closure; Escape reaches only the topmost id.
 * Unregistering restores the next id down. Registration order = visual
 * stacking order, so mount the topmost-painted overlay last.
 */
export function useOverlayEscape(id: string, onEscape: () => void): void {
  const handlerRef = useRef(onEscape);
  handlerRef.current = onEscape;
  useEffect(() => {
    escapeHandlers.set(id, () => handlerRef.current());
    overlayStack.push(id);
    armEscapeListener();
    return () => {
      escapeHandlers.delete(id);
      const at = overlayStack.lastIndexOf(id);
      if (at >= 0) overlayStack.splice(at, 1);
    };
  }, [id]);
}

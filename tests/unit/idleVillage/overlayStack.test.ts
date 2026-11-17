/**
 * overlayStack — PLAN-040 T-003a: registration order of the quest overlays and
 * the single Escape rule — only the TOPMOST overlay receives it.
 */
import { describe, expect, it } from 'vitest';
import {
  isTopmostOverlay,
  overlayStackSnapshot,
  registerOverlay,
  unregisterOverlay,
} from '@/ui/idleVillage/components/gameFrame/overlayStack';

describe('overlayStack — last registered is topmost', () => {
  // INV:overlay-stack.INV-1 — registration order IS the stacking order: only
  // the topmost overlay receives Escape; unregistering restores the next one
  // down and unregister on an absent id is a no-op.
  it('routes Escape to the topmost overlay and restores the one below on unregister', () => {
    const calls: string[] = [];
    registerOverlay('ov-a', () => calls.push('a'));
    registerOverlay('ov-b', () => calls.push('b'));
    expect(isTopmostOverlay('ov-b')).toBe(true);
    expect(isTopmostOverlay('ov-a')).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(calls).toEqual(['b']);
    unregisterOverlay('ov-b');
    expect(isTopmostOverlay('ov-a')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(calls).toEqual(['b', 'a']);
    unregisterOverlay('ov-absent');
    unregisterOverlay('ov-a');
    expect(overlayStackSnapshot()).toHaveLength(0);
  });
});

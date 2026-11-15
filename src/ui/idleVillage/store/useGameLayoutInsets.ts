/**
 * useGameLayoutInsets — the shared docked-surfaces inset ledger
 * (R-339 / PLAN-119 D4, mw-debate artifact-r004).
 *
 * Docked HUD surfaces (expedition drawer right, future roster|stash rail left,
 * future Chronicle zone top-right) publish the screen space they occupy here,
 * so the map layer and any layout consumer can derive the free rectangle
 * without peeking at component internals. This is the single source for
 * "how much viewport is still world".
 *
 * Scope note (tonight's slice): the store + the drawer's publication land now.
 * Feeding the values into `PixiWorldMap.safeFit` + the pan/zoom free-rect
 * clamp is the next step and is deliberately NOT wired yet — the mappa2 land
 * bounds for the 2752×1536 canvas and the signed cover-fit look need a
 * dedicated pass (T-01/T-04: the map's approved framing must not shift
 * silently).
 */
import { create } from 'zustand';

export interface GameLayoutInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface GameLayoutInsetsState {
  insets: GameLayoutInsets;
  /**
   * Merge a side's published inset. Publishers pass the FULL value they
   * currently occupy for the sides they own (0 when closed/collapsed) —
   * last writer wins per side, so independent surfaces must own disjoint
   * sides (drawer → right, rail → left, chrome → top/bottom).
   */
  publish: (patch: Partial<GameLayoutInsets>) => void;
}

export const useGameLayoutInsets = create<GameLayoutInsetsState>((set) => ({
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  publish: (patch) =>
    set((s) => ({ insets: { ...s.insets, ...patch } })),
}));

/**
 * The measured free-map width share the ACs check: `1 - (left+right)/viewportW`.
 * Pure so the r339 layout test can exercise it without a DOM.
 */
export function freeMapShare(insets: GameLayoutInsets, viewportW: number): number {
  if (viewportW <= 0) return 0;
  return Math.max(0, Math.min(1, (viewportW - insets.left - insets.right) / viewportW));
}

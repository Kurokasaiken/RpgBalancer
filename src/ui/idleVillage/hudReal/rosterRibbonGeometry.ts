/**
 * HudRealRosterRibbon layout constants (PLAN-112 C1): zanara kit is 1600×900 design px;
 * the HUD type floor needs ×1.25 (same ruling as the mockup).
 */
import { ZANARA_ROSTER_GEOMETRY as ZG } from '@/ui/idleVillage/zanara/zanaraRosterKit';

export const RIBBON_K = 1.25;
export const RIBBON_PITCH = ZG.pitch * RIBBON_K;             // 77.5
export const RIBBON_COL_W = ZG.columnW * RIBBON_K;           // 267.5 — the ROSTER_W=268 column
export const RIBBON_PAD = 8;
export const RIBBON_RING_CX = (ZG.ring.left + ZG.ring.outerD / 2) * RIBBON_K; // ring centre inside the column

/** Whole ribbon height for a given visible-row count: rows between two rods. */
export function ribbonHeight(rows: number): number {
  return rows * RIBBON_PITCH + 2 * RIBBON_PAD;
}

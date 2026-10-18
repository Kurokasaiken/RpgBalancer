/**
 * PLAN-043 WS-2 — BV-09 + BV-G4: the stage arithmetic invariant.
 *
 * The contract pins the budget arithmetic at the 1280px contract viewport:
 *
 *     2*E + 2*G + left.min + center.min + right.min <= 1280
 *
 * Both floor presets (floorA 236/640/340, floorB 260/616/340) are exact — the
 * committed `floorConfig` choice only decides which preset `zones.minPx`
 * mirrors. Anyone who raises a margin or a zone floor gets a failing test that
 * prints the arithmetic — the budget point is where air trades against wing
 * width, never silently.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

const { stageZones } = DEFAULT_GAME_FRAME_CONFIG;

const arithmetic = (e: number, g: number, l: number, c: number, r: number, vp: number) =>
  `2E+2G+${l}+${c}+${r} ≤ ${vp} — got ${2 * e + 2 * g + l + c + r} (E=${e}, G=${g})`;

describe('stageZones config — BV-09 arithmetic invariant', () => {
  it('committed zones fit the contract viewport exactly at budget', () => {
    const { outer, zones, contractViewportPx } = stageZones;
    const total = 2 * outer.edgePx + 2 * outer.gutterPx + zones.leftWing.minPx + zones.centerStage.minPx + zones.rightWing.minPx;
    expect(
      total <= contractViewportPx,
      // Canonical reference (floorA): `2E+2G+236+640+340 ≤ 1280` with E=24, G=8.
      `${arithmetic(outer.edgePx, outer.gutterPx, zones.leftWing.minPx, zones.centerStage.minPx, zones.rightWing.minPx, contractViewportPx)} | canonical: 2E+2G+236+640+340 ≤ 1280`,
    ).toBe(true);
  });

  it('every floor preset is 1280-exact (budgetPx + overhead)', () => {
    const { outer, floorPresets, contractViewportPx } = stageZones;
    for (const [id, f] of Object.entries(floorPresets)) {
      const total = 2 * outer.edgePx + 2 * outer.gutterPx + f.left + f.center + f.right;
      expect(total, `${id}: ${arithmetic(outer.edgePx, outer.gutterPx, f.left, f.center, f.right, contractViewportPx)}`).toBe(contractViewportPx);
    }
  });

  it('zones.minPx mirrors the committed floorConfig preset', () => {
    const f = stageZones.floorPresets[stageZones.floorConfig];
    expect(stageZones.zones.leftWing.minPx).toBe(f.left);
    expect(stageZones.zones.centerStage.minPx).toBe(f.center);
    expect(stageZones.zones.rightWing.minPx).toBe(f.right);
  });

  it('budgetPx = contractViewportPx − (2E + 2G)', () => {
    const { outer, budgetPx, contractViewportPx } = stageZones;
    expect(budgetPx).toBe(contractViewportPx - (2 * outer.edgePx + 2 * outer.gutterPx));
  });
});

// PLAN-112 F2: the type scale reaches its real-pixel floors at the game's minimum HUD zoom (1), and the contracts follow the signed blueprint.
import { describe, expect, it } from 'vitest';
import { HUD_TYPE, HUD_TYPE_FLOOR_REAL } from '@/ui/idleVillage/hudReal/hudType';
import { SLOTS_B } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';
import { HUD_SCALE_MIN } from '@/ui/idleVillage/components/gameFrame/hudScale';
import { SLOT_MODE, STATE_MATRIX, SLOT_PANELS, STAGE_PANELS, NOTIFICATION_PRIORITY } from '@/ui/idleVillage/hudReal/contracts/hudContracts';
import { HUD_PANELS } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';

describe('HUD type scale', () => {
  for (const k of Object.keys(HUD_TYPE) as Array<keyof typeof HUD_TYPE>) {
    it(`${k}: ${HUD_TYPE[k]} px on the canvas reaches ${HUD_TYPE_FLOOR_REAL[k]} real px at the game's minimum HUD zoom (1)`, () => {
      expect(HUD_TYPE[k] * HUD_SCALE_MIN).toBeGreaterThanOrEqual(HUD_TYPE_FLOOR_REAL[k] - 1e-9);
    });
  }
  it('is monotonic: caption <= secondary <= body <= name <= value <= title', () => {
    const v = HUD_TYPE;
    expect(v.caption <= v.secondary && v.secondary <= v.body && v.body <= v.name && v.name <= v.value && v.value <= v.title).toBe(true);
  });
});

describe('content contracts follow the signed blueprint', () => {
  it('every blueprint slot has a state set and the same mode as the layout contract', () => {
    for (const s of SLOTS_B) {
      expect(STATE_MATRIX, s.id).toHaveProperty(s.id);
      expect(SLOT_MODE[s.id as keyof typeof SLOT_MODE], s.id).toBe(s.mode);
    }
  });
  it('panel ids named by the exclusion rules exist in the game panel registry', () => {
    const ids = new Set(HUD_PANELS.map((p) => p.id));
    for (const id of [...SLOT_PANELS, ...STAGE_PANELS]) expect(ids.has(id), id).toBe(true);
  });
  it('notification priorities are ordered alert < outcome < narrative', () => {
    expect(NOTIFICATION_PRIORITY.alert).toBeLessThan(NOTIFICATION_PRIORITY.outcome);
    expect(NOTIFICATION_PRIORITY.outcome).toBeLessThan(NOTIFICATION_PRIORITY.narrative);
  });
});

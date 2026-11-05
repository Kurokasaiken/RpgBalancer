import { describe, expect, it } from 'vitest';
import { nextTowerLevel } from '@/balancing/config/idleVillage/villageZoneManifest';
import { villageElementList } from '@/ui/idleVillage/pixiSpike/villageZoneOverlay';

/**
 * R-313 (Director 2026-11-04: «non puoi fare ogni elemento … lo estraiamo in alfa,
 * gli diamo le giuste coordinate e basta?»): in elements mode the village is the
 * growth base + runtime elements; slot towers and free placements share one list.
 */
const up = { towers: { chain: ['none', 'wood', 'stone'] as ('none' | 'wood' | 'stone')[], requires: { stone: { defence: 'wall' } } } };
const spec = { slots: { '1': [183, 262] as [number, number], '2': [395, 262] as [number, number] } };

describe('villageElementList (R-313 prototype)', () => {
  it('maps slot towers to their canonical feet, per material', () => {
    expect(villageElementList(spec, { tower1: 'wood', tower2: 'stone', elements: [] })).toEqual([
      { kind: 'tower-wood', x: 183, y: 262 },
      { kind: 'tower-stone', x: 395, y: 262 },
    ]);
  });

  it('empty slots add nothing; free placements are appended unchanged', () => {
    const free = [{ kind: 'tower-stone', x: 40, y: 90 }];
    expect(villageElementList(spec, { tower1: 'none', tower2: 'none', elements: free })).toEqual(free);
  });

  it('stone towers need the stone wall when the rule is on; wood towers never do', () => {
    const live = { tower1: 'stone' as const, tower2: 'wood' as const, elements: [] };
    expect(villageElementList(spec, live, 'palisade', up).map((e) => e.kind)).toEqual(['tower-wood']);
    expect(villageElementList(spec, live, 'wall', up).map((e) => e.kind)).toEqual(['tower-stone', 'tower-wood']);
  });

  it('upgrade chain: wood → stone, stone only under the wall, nothing above stone', () => {
    expect(nextTowerLevel(up, 'none', 'palisade')).toBe('wood');
    expect(nextTowerLevel(up, 'wood', 'palisade')).toBeNull();
    expect(nextTowerLevel(up, 'wood', 'wall')).toBe('stone');
    expect(nextTowerLevel(up, 'stone', 'wall')).toBeNull();
  });
});

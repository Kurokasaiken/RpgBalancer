import { describe, expect, it } from 'vitest';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { zanaraRosterState } from '@/ui/idleVillage/zanara/zanaraRosterState';

const base: ResidentState = {
  id: 'r1', status: 'available', fatigue: 0, currentHp: 10, maxHp: 10,
  isHero: true, isInjured: false, survivalCount: 0, survivalScore: 0,
};

describe('zanaraRosterState', () => {
  it('available says nothing and lights the gem', () => {
    const v = zanaraRosterState(base, false);
    expect(v).toMatchObject({ state: 'available', gem: 'lit', labelKey: null, interactive: true });
  });

  it('maps every real resident status to its own state', () => {
    expect(zanaraRosterState({ ...base, status: 'away' }, false).state).toBe('away');
    expect(zanaraRosterState({ ...base, status: 'exhausted' }, false).state).toBe('exhausted');
    expect(zanaraRosterState({ ...base, status: 'injured' }, false).state).toBe('injured');
    expect(zanaraRosterState({ ...base, status: 'dead' }, false)).toMatchObject({ state: 'dead', gem: 'iron', portrait: 'fallen', interactive: false });
  });

  it('follows the production precedence: locked, then injured flag, then dead', () => {
    expect(zanaraRosterState({ ...base, status: 'dead' }, true).state).toBe('locked');
    expect(zanaraRosterState({ ...base, status: 'dead', isInjured: true }, false).state).toBe('injured');
  });

  it('every exception carries a label except locked (label comes from the caller)', () => {
    for (const status of ['away', 'exhausted', 'injured', 'dead'] as const) {
      expect(zanaraRosterState({ ...base, status }, false).labelKey).toMatch(/^gameFrame\.roster\.zanara\.state\./);
    }
    expect(zanaraRosterState(base, true).labelKey).toBeNull();
  });
});

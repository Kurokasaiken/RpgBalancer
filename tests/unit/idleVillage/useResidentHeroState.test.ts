import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResidentHeroState } from '@/ui/idleVillage/hooks/useResidentHeroState';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(async <T,>(_key: string, defaultValue: T) => defaultValue),
  saveData: vi.fn(async () => undefined),
}));

const RESIDENT: ResidentState = {
  id: 'hero-test-1',
  displayName: 'Aurora',
  status: 'available',
  fatigue: 0,
  currentHp: 80,
  maxHp: 100,
  isHero: true,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  statProfileId: 'archetype-1',
  statSnapshot: {
    strength: 10,
    equipment: { weapon: 'iron-sword' },
  },
};

describe('useResidentHeroState', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('resolves equipment names from config', async () => {
    const { result } = renderHook(() => useResidentHeroState({ resident: RESIDENT }));

    await waitFor(() => {
      expect(result.current.equipment.weapon).toBe('Iron Sword');
    });
  });

  it('equips an item and resolves its name', async () => {
    const { result } = renderHook(() => useResidentHeroState({ resident: RESIDENT }));

    act(() => {
      result.current.equip('offhand', 'steel-dagger');
    });

    await waitFor(() => {
      expect(result.current.equipment.offhand).toBe('Steel Dagger');
    });
  });

  it('rejects an item in the wrong slot', async () => {
    const { result } = renderHook(() => useResidentHeroState({ resident: RESIDENT }));

    act(() => {
      result.current.equip('weapon', 'leather-vest');
    });

    expect(result.current.equipment.armor).toBeUndefined();
    expect(result.current.equipment.weapon).toBe('Iron Sword');
  });

  it('consumes a consumable by id', async () => {
    const { result } = renderHook(() => useResidentHeroState({ resident: RESIDENT }));

    act(() => {
      result.current.useConsumable('potion');
    });

    const potion = result.current.inventory.find((i) => i.id === 'potion');
    expect(potion?.count).toBe(2);
  });

  it('equips and unequips a skill', async () => {
    const { result } = renderHook(() => useResidentHeroState({ resident: RESIDENT }));

    act(() => {
      result.current.toggleSkill('slash');
    });
    expect(result.current.skillLoadout).toContain('slash');

    act(() => {
      result.current.toggleSkill('slash');
    });
    expect(result.current.skillLoadout).not.toContain('slash');
  });
});

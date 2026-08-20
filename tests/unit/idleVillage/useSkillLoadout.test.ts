import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSkillLoadout } from '@/ui/idleVillage/hooks/useSkillLoadout';

describe('useSkillLoadout', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useSkillLoadout({ maxSlots: 3 }));
    expect(result.current.loadout).toEqual([]);
  });

  it('equips a skill when a slot is free', () => {
    const { result } = renderHook(() => useSkillLoadout({ maxSlots: 3 }));

    act(() => {
      result.current.toggleSkill('slash');
    });
    expect(result.current.loadout).toEqual(['slash']);
  });

  it('respects max slots', () => {
    const { result } = renderHook(() => useSkillLoadout({ maxSlots: 2 }));

    act(() => {
      result.current.toggleSkill('slash');
      result.current.toggleSkill('parry');
      result.current.toggleSkill('aim');
    });
    expect(result.current.loadout).toEqual(['slash', 'parry']);
  });

  it('unequips a skill when toggled again', () => {
    const { result } = renderHook(() => useSkillLoadout({ maxSlots: 3 }));

    act(() => {
      result.current.toggleSkill('slash');
      result.current.toggleSkill('slash');
    });
    expect(result.current.loadout).toEqual([]);
  });
});

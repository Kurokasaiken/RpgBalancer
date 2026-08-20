import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEquipment } from '@/ui/idleVillage/hooks/useEquipment';

describe('useEquipment', () => {
  it('starts empty by default', () => {
    const { result } = renderHook(() => useEquipment());
    expect(result.current.equipment).toEqual({});
  });

  it('loads initial equipment', () => {
    const { result } = renderHook(() => useEquipment({ initial: { weapon: 'Sword', armor: 'Plate' } }));
    expect(result.current.equipment).toEqual({ weapon: 'Sword', armor: 'Plate' });
  });

  it('equips and unequips an item', () => {
    const { result } = renderHook(() => useEquipment());

    act(() => {
      result.current.equip('weapon', 'Sword');
    });
    expect(result.current.equipment.weapon).toBe('Sword');

    act(() => {
      result.current.unequip('weapon');
    });
    expect(result.current.equipment.weapon).toBeUndefined();
  });

  it('toggles an item on the same slot', () => {
    const { result } = renderHook(() => useEquipment());

    act(() => {
      result.current.toggle('ring', 'Band');
    });
    expect(result.current.equipment.ring).toBe('Band');

    act(() => {
      result.current.toggle('ring', 'Band');
    });
    expect(result.current.equipment.ring).toBeUndefined();
  });
});

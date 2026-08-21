import { describe, it, expect } from 'vitest';
import { EquipmentCostModule } from './EquipmentCostModule';
import type { EquipmentItem } from './equipmentTypes';

const makeItem = (overrides: Partial<EquipmentItem> = {}): EquipmentItem => ({
  id: 'test-equipment',
  name: 'Test Equipment',
  type: 'weapon',
  slot: 'weapon',
  rarity: 'common',
  stats: {},
  grantedSkillIds: [],
  tags: ['weapon', 'common'],
  ...overrides,
});

describe('EquipmentCostModule', () => {
  it('returns a complete cost breakdown', () => {
    const item = makeItem({ stats: { damage: 100 } });
    const result = EquipmentCostModule.getCompleteCost(item);
    expect(result).toHaveProperty('power');
    expect(result).toHaveProperty('cost');
    expect(result).toHaveProperty('budget');
    expect(result).toHaveProperty('balance');
    expect(result).toHaveProperty('isBalanced');
    expect(result).toHaveProperty('tier');
  });

  it('calculates tier from cost', () => {
    expect(EquipmentCostModule.calculateTier(5)).toBe(1);
    expect(EquipmentCostModule.calculateTier(20)).toBe(2);
    expect(EquipmentCostModule.calculateTier(45)).toBe(3);
    expect(EquipmentCostModule.calculateTier(80)).toBe(4);
    expect(EquipmentCostModule.calculateTier(120)).toBe(5);
  });
});

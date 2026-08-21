import { describe, it, expect, vi, beforeEach } from 'vitest';

const storage = new Map<string, string>();

vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(async (key: string, data: unknown) => {
    storage.set(key, JSON.stringify(data));
  }),
  loadData: vi.fn(async (key: string, defaultValue: unknown) => {
    const raw = storage.get(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  }),
}));

import { upsertEquipment, getAllEquipment, deleteEquipment } from './equipmentStorage';
import type { EquipmentItem } from './equipmentTypes';

const makeItem = (overrides: Partial<EquipmentItem> = {}): EquipmentItem => ({
  id: 'eq-1',
  name: 'Test Item',
  type: 'weapon',
  slot: 'weapon',
  rarity: 'common',
  stats: {},
  grantedSkillIds: [],
  tags: ['weapon', 'common'],
  ...overrides,
});

describe('equipmentStorage', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('saves a new item and retrieves it', async () => {
    const item = makeItem({ id: 'eq-1', name: 'Iron Sword' });
    await upsertEquipment(item);
    const all = await getAllEquipment();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Iron Sword');
  });

  it('updates an existing item by id', async () => {
    const item = makeItem({ id: 'eq-1', name: 'Iron Sword' });
    await upsertEquipment(item);
    await upsertEquipment({ ...item, name: 'Steel Sword' });
    const all = await getAllEquipment();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Steel Sword');
  });

  it('deletes an item by id', async () => {
    const item1 = makeItem({ id: 'eq-1', name: 'Sword' });
    const item2 = makeItem({ id: 'eq-2', name: 'Shield' });
    await upsertEquipment(item1);
    await upsertEquipment(item2);
    await deleteEquipment('eq-1');
    const all = await getAllEquipment();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('eq-2');
  });
});

/**
 * Equipment Storage - Async PersistenceService-based persistence
 *
 * Mirrors spellStorage.ts for equipment items.
 */

import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { EquipmentItemSchema, type EquipmentItem } from './equipmentTypes';

const STORAGE_KEY = 'rpg_balancer_equipment';

export async function loadAllEquipment(): Promise<EquipmentItem[]> {
  try {
    const parsed = await loadData<unknown[]>(STORAGE_KEY, []);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: unknown) => {
        const result = EquipmentItemSchema.safeParse(item);
        if (!result.success) {
          console.warn('[equipmentStorage] Ignoring invalid item:', result.error);
          return null;
        }
        return result.data;
      })
      .filter((item): item is EquipmentItem => item !== null);
  } catch (error) {
    console.error('[equipmentStorage] Failed to load equipment:', error);
    return [];
  }
}

async function saveAllEquipment(items: EquipmentItem[]): Promise<void> {
  await saveData(STORAGE_KEY, items);
}

export async function upsertEquipment(item: EquipmentItem): Promise<void> {
  const items = await loadAllEquipment();
  const index = items.findIndex((i) => i.id === item.id);

  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }

  await saveAllEquipment(items);
}

export async function deleteEquipment(id: string): Promise<void> {
  const items = (await loadAllEquipment()).filter((i) => i.id !== id);
  await saveAllEquipment(items);
}

export async function getEquipment(id: string): Promise<EquipmentItem | undefined> {
  const items = await loadAllEquipment();
  return items.find((i) => i.id === id);
}

export async function getAllEquipment(): Promise<EquipmentItem[]> {
  return loadAllEquipment();
}

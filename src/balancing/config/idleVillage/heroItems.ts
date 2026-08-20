import { z } from 'zod';
import equippableItemsJson from './equippableItems.json';
import consumablesJson from './consumables.json';
import skillsJson from './skills.json';

export const equippableItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slot: z.string(),
  rarity: z.string(),
  effect: z.string(),
});

export type EquippableItem = z.infer<typeof equippableItemSchema>;

export const consumableItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number().int().min(0),
});

export type ConsumableItem = z.infer<typeof consumableItemSchema>;

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  initial: z.string(),
  effect: z.string(),
});

export type Skill = z.infer<typeof skillSchema>;

/**
 * Canonical hero item definitions loaded from JSON and validated with Zod.
 *
 * These arrays are the config-first source of truth for the hero component
 * placeholders; the UI reads them and the runtime state (equip/inventory/skills)
 * is persisted separately per resident.
 */
export const equippableItems: EquippableItem[] = equippableItemSchema
  .array()
  .parse(equippableItemsJson);

export const consumables: ConsumableItem[] = consumableItemSchema.array().parse(consumablesJson);

export const skills: Skill[] = skillSchema.array().parse(skillsJson);

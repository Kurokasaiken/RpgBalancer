import type { TFunction } from 'i18next';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { EquipmentItem } from '@/balancing/equipment/equipmentTypes';
import { resolveResidentPortrait } from '@/engine/game/idleVillage/residentVisualResolver';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getArchetypeSummary } from '@/ui/idleVillage/archetypeDirectory';
import {
  STAT_DESCRIPTORS,
  STAT_CATEGORY_ORDER,
  formatStatDisplayValue,
  type StatCategory,
} from '@/balancing/config/idleVillage/statDescriptors';
import type { StatIconType } from '@/ui/idleVillage/icons/statIcons';

/**
 * heroSheetViewModel — pure derivation layer for `HeroSheetPanel` (PLAN-032 SP-1).
 * Mirrors the field extraction `PgDetailCard` performs (statSnapshot descriptors,
 * equipment getter fallbacks, inventory tokens, vitals) so the compact HUD plaque
 * shows the same numbers as the fullscreen sheet — read-only, same data, no markup.
 */

export type HeroSheetStatus = 'alive' | 'injured' | 'dead';

export interface HeroSheetVital {
  key: 'hp' | 'stamina';
  label: string;
  value: number;
  max: number;
  /** 0..1 for the bar fill. */
  ratio: number;
}

export interface HeroSheetStatEntry {
  label: string;
  display: string;
  iconType?: StatIconType;
}

export interface HeroSheetStatCategory {
  category: StatCategory;
  label: string;
  entries: HeroSheetStatEntry[];
}

export interface HeroSheetEquipmentSlot {
  id: string;
  label: string;
  value?: string;
}

export interface HeroSheetViewModel {
  residentId: string;
  name: string;
  initials: string;
  statusLabel: string;
  status: HeroSheetStatus;
  archetypeLabel: string | null;
  archetypeCategory: string | null;
  portraitUrl: string | null;
  vitals: HeroSheetVital[];
  stats: HeroSheetStatCategory[];
  equipment: HeroSheetEquipmentSlot[];
  inventory: string[];
}

const clampRatio = (value: number, max: number): number =>
  max > 0 && Number.isFinite(value) ? Math.max(0, Math.min(1, value / max)) : 0;

/** Raw storage ids must never reach the player: `longbow_oak` reads as `Longbow Oak`. */
const humanizeId = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

/** Icon for each stat key — same map PgDetailCard uses. */
const STAT_ICON_MAP: Record<string, StatIconType> = {
  hp: 'hp',
  damage: 'damage',
  armor: 'armor',
  resistance: 'resistance',
  txc: 'accuracy',
  regen: 'regen',
  evasion: 'evasion',
  critChance: 'critChance',
  agility: 'agility',
  lifesteal: 'lifesteal',
  movementSpeed: 'movementSpeed',
  cooldownReduction: 'cooldown',
  castSpeed: 'cooldown',
};

/**
 * Derives the compact-sheet view model for one resident.
 * @param resident canonical roster state (`residentsById[id]`).
 * @param equipmentMap `equipmentId → EquipmentItem` map built from `getAllEquipment()`.
 * @param t `idleVillage` namespace translator.
 */
export function heroSheetViewModel(
  resident: ResidentState,
  equipmentMap: Record<string, EquipmentItem>,
  t: TFunction,
): HeroSheetViewModel {
  const snapshot = (resident.statSnapshot ?? {}) as Record<string, unknown>;

  const statusLabel = resident.isInjured
    ? t('pgDetailCard.status.injured')
    : t(`pgDetailCard.status.${resident.status}` as never, resident.status);
  const status: HeroSheetStatus = resident.isInjured ? 'injured' : resident.status === 'dead' ? 'dead' : 'alive';

  // Only stats with a descriptor reach the player — same rule as PgDetailCard.
  const groups: Record<StatCategory, HeroSheetStatEntry[]> = { offense: [], defense: [], utility: [] };
  for (const [key, descriptor] of Object.entries(STAT_DESCRIPTORS)) {
    const value = snapshot[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || !descriptor) continue;
    groups[descriptor.category].push({
      label: t(descriptor.labelKey),
      display: formatStatDisplayValue(descriptor.format, value),
      iconType: STAT_ICON_MAP[key],
    });
  }
  const stats: HeroSheetStatCategory[] = STAT_CATEGORY_ORDER.map((category) => ({
    category,
    label: t(`pgDetailCard.statistics.category.${category}`),
    entries: groups[category],
  })).filter((group) => group.entries.length > 0);

  const { portraitUrl } = resolveResidentPortrait(resident);

  const equipment = (snapshot.equipment as Record<string, unknown> | undefined) ?? {};
  const resolveEquipValue = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return equipmentMap[value]?.name || humanizeId(value);
    }
    if (typeof value === 'object' && value && 'id' in value) {
      const id = String((value as { id: string }).id);
      return equipmentMap[id]?.name || humanizeId(id);
    }
    return undefined;
  };
  const equipGetter = (...keys: string[]) => {
    for (const key of keys) {
      const resolved = resolveEquipValue(equipment[key] ?? snapshot[key]);
      if (resolved) return resolved;
    }
    return undefined;
  };
  const equipmentSlots: HeroSheetEquipmentSlot[] = [
    { id: 'weapon', label: t('pgDetailCard.equipment.weapon'), value: equipGetter('weapon', 'equippedWeapon', 'primaryWeapon', 'weaponName') },
    { id: 'offhand', label: t('pgDetailCard.equipment.offhand'), value: equipGetter('offhand', 'shield', 'secondaryWeapon') },
    { id: 'armor', label: t('pgDetailCard.equipment.armor'), value: equipGetter('armor', 'equippedArmor', 'plate') },
    { id: 'trinket', label: t('pgDetailCard.equipment.trinket'), value: equipGetter('trinket', 'amulet', 'relic') },
    { id: 'ring', label: t('pgDetailCard.equipment.ring'), value: equipGetter('ring', 'ringSlot', 'sigil') },
    { id: 'mount', label: t('pgDetailCard.equipment.mount'), value: equipGetter('companion', 'pet', 'mount') },
  ];

  const inventoryRaw = snapshot.inventory;
  const inventory: string[] = Array.isArray(inventoryRaw)
    ? inventoryRaw
        .map((entry) => {
          if (typeof entry === 'string') return entry;
          if (typeof entry === 'object' && entry && 'name' in entry) {
            return String((entry as { name?: string }).name ?? '');
          }
          return '';
        })
        .filter((value) => value.length > 0)
    : [];

  const archetypeSummary = getArchetypeSummary(resident.statProfileId);
  const staminaValue = 100 - Math.max(0, Math.min(100, resident.fatigue ?? 0));
  const name = formatResidentLabel(resident);

  return {
    residentId: resident.id,
    name,
    initials: name.slice(0, 2).toUpperCase(),
    statusLabel,
    status,
    archetypeLabel: archetypeSummary?.name ?? (resident.statProfileId ? humanizeId(resident.statProfileId) : null),
    archetypeCategory: archetypeSummary?.category ?? null,
    portraitUrl,
    vitals: [
      {
        key: 'hp',
        label: t('pgDetailCard.vitals.hp'),
        value: resident.currentHp,
        max: resident.maxHp,
        ratio: clampRatio(resident.currentHp, resident.maxHp),
      },
      {
        key: 'stamina',
        label: t('pgDetailCard.vitals.stamina'),
        value: staminaValue,
        max: 100,
        ratio: clampRatio(staminaValue, 100),
      },
    ],
    stats,
    equipment: equipmentSlots,
    inventory,
  };
}

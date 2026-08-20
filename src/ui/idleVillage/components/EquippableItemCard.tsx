import {
  MatericSurface,
  MatericPlaque,
  MatericField,
} from '@/ui/designSystem/primitives';
import type { EquippableItem } from '@/ui/idleVillage/types/heroComponentItems';

export interface EquippableItemCardProps {
  /** Item to display. */
  item: EquippableItem;
  /** Localized labels for the fields. */
  labels: {
    rarity: string;
    effect: string;
    slot: string;
  };
}

/**
 * EquippableItemCard — placeholder card for an equippable item.
 *
 * Shows name, rarity, effect and target slot. The caller provides localized
 * labels and the item data.
 */
export function EquippableItemCard({ item, labels }: EquippableItemCardProps): JSX.Element {
  return (
    <MatericSurface shape="card" material="bronze" style={{ padding: 12 }}>
      <MatericPlaque>{item.name}</MatericPlaque>
      <MatericField label={labels.rarity} value={item.rarity} />
      <MatericField label={labels.effect} value={item.effect} />
      <MatericField label={labels.slot} value={item.slot} />
    </MatericSurface>
  );
}

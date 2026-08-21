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
  /** Visual variant. `flat` removes the surface border. */
  variant?: 'default' | 'flat';
}

/**
 * EquippableItemCard — placeholder card for an equippable item.
 *
 * Shows name, rarity, effect and target slot. The caller provides localized
 * labels and the item data.
 */
export function EquippableItemCard({ item, labels, variant = 'default' }: EquippableItemCardProps): JSX.Element {
  const content = (
    <>
      <MatericPlaque>{item.name}</MatericPlaque>
      <MatericField label={labels.rarity} value={item.rarity} />
      <MatericField label={labels.effect} value={item.effect} />
      <MatericField label={labels.slot} value={item.slot} />
    </>
  );

  if (variant === 'flat') {
    return (
      <div style={{ padding: 12, background: 'var(--skin-surface-bg)', borderRadius: 8 }}>
        {content}
      </div>
    );
  }

  return (
    <MatericSurface shape="card" material="bronze" style={{ padding: 12 }}>
      {content}
    </MatericSurface>
  );
}

import { useCallback } from 'react';
import {
  MatericSurface,
  MatericPlaque,
  MatericBadge,
  MatericButton,
} from '@/ui/designSystem/primitives';
import type { ConsumableItem } from '@/ui/idleVillage/types/heroComponentItems';

export interface ConsumablePileProps {
  /** Available consumables. */
  items: ConsumableItem[];
  /** Label for the use action. */
  useLabel: string;
  /** Called when the user uses one unit of a consumable. */
  onUse: (itemId: string) => void;
  /** Visual variant. `flat` removes the surface border. */
  variant?: 'default' | 'flat';
}

/**
 * ConsumablePile — placeholder pile of spendable consumables.
 *
 * Renders one badge + button per item. The parent owns the count state.
 */
export function ConsumablePile({ items, useLabel, onUse, variant = 'default' }: ConsumablePileProps): JSX.Element {
  const content = (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <ConsumableToken key={item.id} item={item} useLabel={useLabel} onUse={onUse} />
      ))}
    </div>
  );

  if (variant === 'flat') {
    return (
      <div style={{ padding: 12, background: 'var(--skin-surface-bg)', borderRadius: 8 }}>
        {content}
      </div>
    );
  }

  return (
    <MatericSurface shape="card" material="jade" style={{ padding: 12 }}>
      {content}
    </MatericSurface>
  );
}

interface ConsumableTokenProps {
  item: ConsumableItem;
  useLabel: string;
  onUse: (itemId: string) => void;
}

function ConsumableToken({ item, useLabel, onUse }: ConsumableTokenProps): JSX.Element {
  const handleUse = useCallback(() => {
    if (item.count > 0) {
      onUse(item.id);
    }
  }, [item.count, item.id, onUse]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <MatericPlaque>
        {item.name} x{item.count}
      </MatericPlaque>
      <MatericButton onClick={handleUse}>{useLabel}</MatericButton>
    </div>
  );
}

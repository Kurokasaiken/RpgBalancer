import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MatericBadge } from '@/ui/designSystem/primitives';
import type { EquippableItem } from '@/ui/idleVillage/types/heroComponentItems';

export interface ItemDragTokenProps {
  /** Item definition from hero config. */
  item: EquippableItem;
}

/**
 * ItemDragToken — a small draggable token for equippable items.
 *
 * Wraps a `MatericBadge` in `dnd-kit` drag handlers and exposes the item id
 * and name in `active.data.current` for the drop target.
 */
export function ItemDragToken({ item }: ItemDragTokenProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `item-${item.id}`,
    data: { itemId: item.id, itemName: item.name },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      <MatericBadge>{item.name}</MatericBadge>
    </div>
  );
}

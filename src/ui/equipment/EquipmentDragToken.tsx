import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MatericBadge } from '@/ui/designSystem/primitives';
import type { EquipmentItem } from '@/balancing/equipment/equipmentTypes';

export interface EquipmentDragTokenProps {
  item: EquipmentItem;
}

export function EquipmentDragToken({ item }: EquipmentDragTokenProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `equipment-${item.id}`,
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

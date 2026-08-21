import { useDroppable } from '@dnd-kit/core';
import { Slot } from '@/ui/idleVillage/components/Slot';
import { MatericSurface } from '@/ui/designSystem/primitives';

export interface EquipSlot {
  /** Stable slot id (e.g. 'weapon'). */
  id: string;
  /** User-facing slot label. */
  label: string;
}

export interface EquipSlotRackProps {
  /** Ordered slot definitions. */
  slots: EquipSlot[];
  /** Current slot-to-item mapping. */
  equipment: Record<string, string | null>;
  /** Called when a slot is clicked to remove its item. */
  onUnequip: (slotId: string) => void;
  /** Optional item token tray rendered under the slots. */
  children?: React.ReactNode;
}

/**
 * EquipSlotRack — placeholder rack of equipment slots.
 *
 * Each slot is a `Slot` droppable target. The user can drag an item onto it
 * via the surrounding `DndContext`; clicking the slot clears it. The equipment
 * mapping is owned by the caller (e.g. `useResidentHeroState`).
 */
export function EquipSlotRack({ slots, equipment, onUnequip, children }: EquipSlotRackProps): JSX.Element {
  return (
    <MatericSurface shape="card" material="jade" style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {slots.map((slot) => {
          const item = equipment[slot.id] ?? null;
          return (
            <SlotDropTarget
              key={slot.id}
              slot={slot}
              item={item}
              onUnequip={onUnequip}
            />
          );
        })}
      </div>
      {children}
    </MatericSurface>
  );
}

interface SlotDropTargetProps {
  slot: EquipSlot;
  item: string | null;
  onUnequip: (slotId: string) => void;
}

const tokenStyle: React.CSSProperties = {
  fontSize: 9,
  color: 'var(--skin-label-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginTop: 4,
};

function SlotDropTarget({ slot, item, onUnequip }: SlotDropTargetProps): JSX.Element {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slot.id}`,
    data: { slotId: slot.id },
  });

  const handleClick = () => {
    if (item) {
      onUnequip(slot.id);
    }
  };

  const initial = item ? item.charAt(0).toUpperCase() : '—';

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      style={{
        outline: isOver ? '2px dashed var(--minimal-accent-color, #d4af37)' : 'none',
        outlineOffset: 4,
        borderRadius: 8,
        cursor: item ? 'pointer' : 'default',
      }}
      title={item ? `${slot.label}: ${item}` : slot.label}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Slot slotProps={{ letter: initial, state: item ? 'occupied' : 'empty', sizePx: 44 }} />
        <span style={tokenStyle}>{slot.label}</span>
      </div>
    </div>
  );
}

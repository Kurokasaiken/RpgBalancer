import type { FC, MouseEvent } from 'react';
import { EquipmentSlotIcon } from './equipmentSlotIcons';

export interface EquipmentDiabloSlot {
  id: string;
  label: string;
  value?: string;
}

interface EquipmentDiabloPanelProps {
  slots: EquipmentDiabloSlot[];
  onSlotClick?: (slotId: string) => void;
}

/**
 * Equipment socket grid.
 *
 * An empty socket is drawn, not spelled: a carved recess reads as "nothing here"
 * faster than the word "Empty" repeated six times, and keeps the eye on the
 * slots that actually carry gear.
 */
export const EquipmentDiabloPanel: FC<EquipmentDiabloPanelProps> = ({ slots, onSlotClick }) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>, slotId: string) => {
    event.stopPropagation();
    onSlotClick?.(slotId);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
      {slots.map((slot) => {
        const filled = Boolean(slot.value);
        return (
          <button
            key={slot.id}
            type="button"
            onClick={(e) => handleClick(e, slot.id)}
            data-drag-exempt="true"
            title={`${slot.label}${filled ? ` — ${slot.value}` : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              minWidth: 0,
              minHeight: 52,
              padding: '6px 4px',
              borderRadius: 5,
              cursor: onSlotClick ? 'pointer' : 'default',
              background: filled
                ? 'linear-gradient(180deg, rgba(201,162,39,0.10) 0%, rgba(10,14,16,0.85) 60%)'
                : 'radial-gradient(ellipse at 50% 15%, rgba(0,0,0,0.75), rgba(4,7,9,0.95))',
              border: `1px solid ${filled ? 'rgba(201,162,39,0.38)' : 'rgba(141,179,165,0.10)'}`,
              boxShadow: filled
                ? 'inset 0 1px 0 rgba(240,207,106,0.14), 0 0 10px rgba(201,162,39,0.12)'
                : 'inset 0 2px 6px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(141,179,165,0.05)',
              transition: 'border-color 180ms ease, box-shadow 180ms ease',
            }}
          >
            <EquipmentSlotIcon slotId={slot.id} filled={filled} />
            {filled ? (
              <span
                style={{
                  fontSize: 8,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--skin-text-primary, #f0efe4)',
                  letterSpacing: '0.02em',
                }}
              >
                {slot.value}
              </span>
            ) : (
              <span
                style={{
                  fontSize: 7,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(141,179,165,0.28)',
                }}
              >
                {slot.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default EquipmentDiabloPanel;

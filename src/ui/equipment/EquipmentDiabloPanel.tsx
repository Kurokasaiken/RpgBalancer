import type { FC, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { MatericSurface } from '@/ui/designSystem/primitives';

export interface EquipmentDiabloSlot {
  id: string;
  label: string;
  value?: string;
}

interface EquipmentDiabloPanelProps {
  slots: EquipmentDiabloSlot[];
  onSlotClick?: (slotId: string) => void;
}

const SLOT_ICONS: Record<string, string> = {
  weapon: '⚔️',
  offhand: '🛡️',
  armor: '🦺',
  trinket: '📿',
  ring: '💍',
  mount: '🐴',
};

/**
 * Diablo-like equipment grid panel.
 *
 * Renders equipment slots in a grid layout similar to classic action RPG
 * inventory screens, with clickable slots for assignment/removal.
 */
export const EquipmentDiabloPanel: FC<EquipmentDiabloPanelProps> = ({
  slots,
  onSlotClick,
}) => {
  const { t } = useTranslation('idleVillage');

  const handleClick = (event: MouseEvent<HTMLButtonElement>, slotId: string) => {
    event.stopPropagation();
    onSlotClick?.(slotId);
  };

  return (
    <MatericSurface shape="panel" material="bronze" style={{ padding: 12 }}>
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            onClick={(e) => handleClick(e, slot.id)}
            data-drag-exempt="true"
            style={{
              backgroundColor: 'var(--skin-surface-bg)',
              border: '1px solid var(--skin-surface-border)',
              borderRadius: 8,
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 64,
              cursor: onSlotClick ? 'pointer' : 'default',
              color: 'var(--skin-text-primary)',
            }}
          >
            <span style={{ fontSize: 16, marginBottom: 4 }}>
              {SLOT_ICONS[slot.id] || '◇'}
            </span>
            <span
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--skin-text-muted)',
              }}
            >
              {slot.label}
            </span>
            <span
              style={{
                fontSize: 10,
                marginTop: 4,
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: slot.value ? 'var(--skin-icon-accent)' : 'var(--skin-text-muted)',
              }}
            >
              {slot.value || t('pgDetailCard.equipment.empty', '—')}
            </span>
          </button>
        ))}
      </div>
    </MatericSurface>
  );
};

export default EquipmentDiabloPanel;

import type { ResidentSlotRackProps } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

/**
 * Maps a stat hint/label to a compact icon used inside resident slot racks.
 * Falls back to the first character of the provided label or a star glyph.
 */
export const mapStatLabelToIcon = (label?: string | null): string => {
  if (!label) return '☆';
  const normalized = label.trim().toLowerCase();
  if (normalized.includes('hp') || normalized.includes('vita')) return '❤';
  if (normalized.includes('dmg') || normalized.includes('danno')) return '⚔';
  if (normalized.includes('def')) return '🛡';
  if (normalized.includes('agi') || normalized.includes('spd')) return '➶';
  if (normalized.includes('mag') || normalized.includes('mana')) return '✷';
  return label.trim().charAt(0) || '☆';
};

export type ResidentSlotDisplayResolver = NonNullable<ResidentSlotRackProps['resolveDisplayInfo']>;

/**
 * Default resolver that converts a resident slot view-model into display metadata
 * consumed by {@link ResidentSlotRack}. Keeps iconography consistent between
 * board/detail racks and the Theater overlay.
 */
export const resolveResidentRackDisplayInfo: ResidentSlotDisplayResolver = (slot: ResidentSlotViewModel) => {
  const statLabel = slot.statHint ?? slot.requirement?.label ?? slot.label;
  return {
    icon: mapStatLabelToIcon(statLabel),
    label: slot.label,
  };
};

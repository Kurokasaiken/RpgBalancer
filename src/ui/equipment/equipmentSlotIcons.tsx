import type { FC } from 'react';

/**
 * Equipment slot glyphs.
 *
 * Vector rather than emoji: emoji are OS-rendered, so they change shape between
 * platforms and carry a fixed palette that fights the skin tokens. These inherit
 * `currentColor` and can be lit when a slot is filled.
 */
const ICON_PATHS: Record<string, string> = {
  weapon: 'M14.5 3.5 20 9l-9.5 9.5-2.5-.5-.5-2.5zM4 20l3-3M3 17l4 4',
  offhand: 'M12 3l7 2.5v5.5c0 4.2-2.9 7.7-7 9-4.1-1.3-7-4.8-7-9V5.5z',
  armor: 'M12 3l6 2v5.5c0 3.8-2.4 7-6 8.5-3.6-1.5-6-4.7-6-8.5V5zM9 9.5h6',
  trinket: 'M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM12 8.5v4l2.5 1.5',
  ring: 'M12 9.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM9.5 6.5h5l-2.5 3z',
  mount: 'M5 19l1.5-6.5L11 9l3.5 1.5L19 11l-1.5 3.5-3.5 1L12 19M11 9l1-3.5',
};

const FALLBACK_PATH = 'M12 4.5l7.5 7.5-7.5 7.5L4.5 12z';

export interface EquipmentSlotIconProps {
  slotId: string;
  filled?: boolean;
  size?: number;
}

export const EquipmentSlotIcon: FC<EquipmentSlotIconProps> = ({ slotId, filled = false, size = 17 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    aria-hidden="true"
    focusable="false"
    stroke="currentColor"
    strokeWidth={1.35}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      color: filled ? 'var(--skin-title-color, #f0cf6a)' : 'rgba(141,179,165,0.42)',
      filter: filled ? 'drop-shadow(0 0 4px rgba(201,162,39,0.45))' : 'none',
      transition: 'color 180ms ease, filter 180ms ease',
    }}
  >
    <path d={ICON_PATHS[slotId] ?? FALLBACK_PATH} />
  </svg>
);

export default EquipmentSlotIcon;

import React from 'react';
import { EngravedIcon, type EngravedIconId } from './engravedIcons';

/**
 * `questItems` icon field → engraved glyph (PLAN-032 SP-2). The catalog uses
 * both emoji literals ('🧪', '🪙') and lucide-style names ('axe', 'wind'); the
 * HUD material forbids lucide imports in this folder, so named icons resolve
 * to the engraved set and emoji render as text. Unknown names fall back to the
 * pouch glyph — a missing icon must never render the map marker's cross.
 */
const ITEM_ICON_TO_ENGRAVED: Record<string, EngravedIconId> = {
  axe: 'ico-axe',
  crosshair: 'ico-target',
  wind: 'ico-gust',
  cable: 'ico-grapnel',
  heart: 'ico-salve',
  droplets: 'ico-vial',
  flag: 'ico-banner',
};

/** The emoji fallback keeps the catalog's own face when no engraved glyph exists. */
const isEmoji = (icon: string): boolean => /\p{Extended_Pictographic}/u.test(icon);

/**
 * One item icon for a stash row — decorative (the row's name carries the
 * meaning), tinted by the container's `currentColor` like every HUD glyph.
 */
export const VillageStashItemIcon: React.FC<{ icon?: string; size?: number }> = ({ icon, size = 18 }) => {
  if (!icon) return <EngravedIcon id="ico-pouch" size={size} />;
  const engraved = ITEM_ICON_TO_ENGRAVED[icon];
  if (engraved) return <EngravedIcon id={engraved} size={size} />;
  if (isEmoji(icon)) {
    return (
      <span aria-hidden="true" style={{ fontSize: size, lineHeight: 1, width: size, textAlign: 'center' }}>
        {icon}
      </span>
    );
  }
  return <EngravedIcon id="ico-pouch" size={size} />;
};

export default VillageStashItemIcon;

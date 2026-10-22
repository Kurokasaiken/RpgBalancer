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

/** The catalog's emoji literals → the same engraved set (INV-1 = B, R-234): one item wears one engraved
 *  glyph in the tray tile, the stash row and the merchant row — never a coloured emoji. */
const EMOJI_TO_ENGRAVED: Record<string, EngravedIconId> = {
  '🐎': 'ico-banner',
  '🗡️': 'ico-axe',
  '🛡️': 'ico-grapnel',
  '🚩': 'ico-banner',
  '🧪': 'ico-vial',
  '🪙': 'ico-chest',
};

/**
 * One item icon for a stash row — decorative (the row's name carries the
 * meaning), tinted by the container's `currentColor` like every HUD glyph.
 */
export const VillageStashItemIcon: React.FC<{ icon?: string; size?: number }> = ({ icon, size = 18 }) => {
  const id = (icon && (ITEM_ICON_TO_ENGRAVED[icon] ?? EMOJI_TO_ENGRAVED[icon])) || 'ico-pouch';
  return <EngravedIcon id={id} size={size} />;
};

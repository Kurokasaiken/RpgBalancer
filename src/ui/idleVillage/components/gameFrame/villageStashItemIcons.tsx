import React from 'react';
import { EngravedIcon, type EngravedIconId } from './engravedIcons';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';

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

/** Painted art declared on the stash catalog (R-363 `iconAsset`) — the
 *  config owns which items wear painted icons; the glyph set is the fallback
 *  for catalog-less consumers (questItems catalog, unknown names). */
const ICON_TO_ASSET: Record<string, string> = Object.fromEntries(
  QUEST_STASH.items.filter((i) => i.iconAsset).map((i) => [i.icon, i.iconAsset as string]),
);

/**
 * One item icon for a stash row — decorative (the row's name carries the
 * meaning). Painted art when the catalog declares it, otherwise the engraved
 * glyph tinted by the container's `currentColor` like every HUD glyph.
 */
export const VillageStashItemIcon: React.FC<{ icon?: string; size?: number }> = ({ icon, size = 18 }) => {
  const asset = icon ? ICON_TO_ASSET[icon] : undefined;
  if (asset) {
    return <img src={asset} width={size} height={size} style={{ objectFit: 'contain' }} alt="" aria-hidden />;
  }
  const id = (icon && (ITEM_ICON_TO_ENGRAVED[icon] ?? EMOJI_TO_ENGRAVED[icon])) || 'ico-pouch';
  return <EngravedIcon id={id} size={size} />;
};

import React from 'react';
import { EngravedIcon, type EngravedIconId } from './engravedIcons';

/**
 * Offer-icon map for the merchant mock screen (PLAN-032 SP-3): the config's
 * `offers[].iconKey` keys this table — a typo fails the membership test,
 * never renders a wrong glyph. Decorative icons: the row's name carries the
 * meaning, so every glyph is `aria-hidden` by the row layout.
 */
const OFFER_ICON_TO_ENGRAVED: Record<string, EngravedIconId> = {
  vial: 'ico-vial',
  pouch: 'ico-pouch',
  gust: 'ico-gust',
  spark: 'ico-spark',
};

/** The icon keys a merchant offer may declare. */
export const MERCHANT_OFFER_ICON_KEYS = Object.keys(OFFER_ICON_TO_ENGRAVED);

/**
 * One offer icon for a merchant row — tinted by `currentColor` like every
 * HUD glyph; unknown keys fall back to the pouch glyph.
 */
export const MerchantOfferIcon: React.FC<{ iconKey: string; size?: number }> = ({ iconKey, size = 18 }) => (
  <EngravedIcon id={OFFER_ICON_TO_ENGRAVED[iconKey] ?? 'ico-pouch'} size={size} />
);

export default MerchantOfferIcon;

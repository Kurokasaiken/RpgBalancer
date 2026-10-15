/**
 * Merchant mock screen (PLAN-032 SP-3, artifact r003).
 *
 * The wares the village merchant's panel shows on `/game`. **Screen content
 * only** — no economy: nothing here can be bought, spent, decremented,
 * persisted or synced; the numbers are balancing knobs so the teaser surface
 * reads like the game will. PLAN-035 removed the continent-map marker — the
 * panel opens from the Village view's emporium tooltip (plus the Panels menu
 * and the `m` shortcut).
 *
 * Validation is binding: a duplicate `offerId` or a malformed i18n key fails
 * at module load (`parse` throws). The parsed export is deep-frozen —
 * `Object.isFrozen(offers[0])` is asserted by the unit test.
 */

import { z } from 'zod';

/** i18n key shape — dotted lower-case paths, no spaces or format chars. */
const I18N_KEY = /^[a-zA-Z0-9_.]+$/;

export const merchantSchema = z
  .object({
    /** Header line resolving to a static qualitative phrase — never a clock. */
    countdownLabelKey: z.string().regex(I18N_KEY),
    offers: z
      .array(
        z.object({
          offerId: z.string().trim().min(1),
          nameKey: z.string().regex(I18N_KEY),
          descKey: z.string().regex(I18N_KEY),
          /** Membership in the offer-icon map (`merchantOfferIcons`) — asserted by test. */
          iconKey: z.string().min(1),
          price: z.number().int().positive(),
          currencyKey: z.string().regex(I18N_KEY),
          stockLabelKey: z.string().regex(I18N_KEY),
        }),
      )
      .min(3)
      .max(4),
    /** Panel chrome: row texts wrap instead of truncating inside this width. */
    panel: z.object({ widthPx: z.number().positive() }),
  })
  .superRefine((cfg, ctx) => {
    const seen = new Set<string>();
    cfg.offers.forEach((offer, index) => {
      if (seen.has(offer.offerId)) {
        ctx.addIssue({ code: 'custom', path: ['offers', index, 'offerId'], message: `duplicate merchant offer "${offer.offerId}"` });
      }
      seen.add(offer.offerId);
    });
  });

export type MerchantConfig = z.infer<typeof merchantSchema>;

/**
 * `Object.freeze` applied recursively. Zod 4 `.readonly()` freezes only the
 * root, so the nested offers would stay mutable — the spec asks for a frozen
 * graph, so we freeze it ourselves after `parse`.
 */
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
};

const RAW_MERCHANT_CONFIG = {
  countdownLabelKey: 'gameFrame.merchant.restockNote',
  offers: [
    {
      offerId: 'healing-draught-set',
      nameKey: 'gameFrame.merchant.offers.healingDraught.name',
      descKey: 'gameFrame.merchant.offers.healingDraught.desc',
      iconKey: 'vial',
      price: 9,
      currencyKey: 'gameFrame.merchant.currency.gold',
      stockLabelKey: 'gameFrame.merchant.offers.healingDraught.stock',
    },
    {
      offerId: 'field-rations',
      nameKey: 'gameFrame.merchant.offers.fieldRations.name',
      descKey: 'gameFrame.merchant.offers.fieldRations.desc',
      iconKey: 'pouch',
      price: 4,
      currencyKey: 'gameFrame.merchant.currency.gold',
      stockLabelKey: 'gameFrame.merchant.offers.fieldRations.stock',
    },
    {
      offerId: 'smoke-bomb-pair',
      nameKey: 'gameFrame.merchant.offers.smokeBomb.name',
      descKey: 'gameFrame.merchant.offers.smokeBomb.desc',
      iconKey: 'gust',
      price: 11,
      currencyKey: 'gameFrame.merchant.currency.gold',
      stockLabelKey: 'gameFrame.merchant.offers.smokeBomb.stock',
    },
    {
      offerId: 'ward-charm',
      nameKey: 'gameFrame.merchant.offers.wardCharm.name',
      descKey: 'gameFrame.merchant.offers.wardCharm.desc',
      iconKey: 'spark',
      price: 16,
      currencyKey: 'gameFrame.merchant.currency.gold',
      stockLabelKey: 'gameFrame.merchant.offers.wardCharm.stock',
    },
  ],
  panel: { widthPx: 360 },
};

/** Validated, deep-frozen merchant configuration. */
export const MERCHANT_CONFIG = deepFreeze(merchantSchema.parse(RAW_MERCHANT_CONFIG));

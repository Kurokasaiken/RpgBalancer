import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'fs';
import path from 'path';
import { MERCHANT_CONFIG, merchantSchema } from '@/balancing/config/idleVillage/merchantConfig';
import { HUD_PANELS } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';
import { MERCHANT_OFFER_ICON_KEYS } from '@/ui/idleVillage/components/gameFrame/merchantOfferIcons';
import { MerchantPanel } from '@/ui/idleVillage/components/gameFrame/MerchantPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'gameFrame.merchant.priceLine') return `${opts?.price} ${opts?.currency}`;
      return key;
    },
  }),
}));

const CFG = MERCHANT_CONFIG;

/** Loads a locale JSON and resolves a dotted key under `gameFrame`. */
const resolveKey = (locale: 'en' | 'it-IT', key: string): string | undefined => {
  const doc = JSON.parse(
    readFileSync(path.resolve(__dirname, `../../../public/locales/${locale}/idleVillage.json`), 'utf8'),
  );
  return key.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), doc) as string | undefined;
};

/** Every i18n key the config declares — offers plus the header line. */
const declaredKeys = (): string[] => [
  CFG.countdownLabelKey,
  ...CFG.offers.flatMap((o) => [o.nameKey, o.descKey, o.currencyKey, o.stockLabelKey]),
];

describe('merchantConfig', () => {
  it('parses with unique offerIds', () => {
    const ids = CFG.offers.map((o) => o.offerId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CFG.offers.length).toBeGreaterThanOrEqual(3);
    expect(CFG.offers.length).toBeLessThanOrEqual(4);
  });

  it('rejects duplicate offerIds and malformed keys at parse time', () => {
    const base = structuredClone(CFG) as Parameters<typeof merchantSchema.parse>[0];
    expect(() =>
      merchantSchema.parse({ ...base, offers: [...base.offers, { ...base.offers[0] }] }),
    ).toThrow();
    expect(() =>
      merchantSchema.parse({ ...base, countdownLabelKey: 'not a key!!' }),
    ).toThrow();
  });

  it('exports a deep-frozen graph — offers rows are frozen too', () => {
    expect(Object.isFrozen(CFG)).toBe(true);
    expect(Object.isFrozen(CFG.offers)).toBe(true);
    expect(Object.isFrozen(CFG.offers[0])).toBe(true);
  });

  it('resolves every declared key non-empty in both locales, with en/it parity', () => {
    for (const key of declaredKeys()) {
      for (const locale of ['en', 'it-IT'] as const) {
        const value = resolveKey(locale, key);
        expect(typeof value, `${locale} missing ${key}`).toBe('string');
        expect((value as string).length, `${locale} empty ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('the restock line is a qualitative phrase — no clock pattern', () => {
    for (const locale of ['en', 'it-IT'] as const) {
      const value = resolveKey(locale, CFG.countdownLabelKey);
      expect(value).toBeTruthy();
      expect(value).not.toMatch(/\d{1,2}:\d{2}/);
    }
  });

  it('offer iconKeys ∈ the offer-icon map', () => {
    for (const offer of CFG.offers) {
      expect(MERCHANT_OFFER_ICON_KEYS, `unknown offer iconKey ${offer.iconKey}`).toContain(offer.iconKey);
    }
  });

  /* PLAN-035: no continent-map marker — the emporium tooltip inside the
   * Village view opens the panel; menu/`m` paths stay registered. */
  it('registers the merchant panel (menu path)', () => {
    const entry = HUD_PANELS.find((p) => p.id === 'merchant');
    expect(entry, 'merchant missing from HUD_PANELS — menu/shortcut would not open it').toBeTruthy();
    expect(entry?.defaultVisible).toBe(false);
  });
});

describe('MerchantPanel', () => {
  const renderPanel = () =>
    render(<MerchantPanel config={CFG} left={0} top={0} widthPx={360} zIndex={12} onClose={() => {}} />);

  it('renders every offer as a list row with name, wrapped desc, price and stock', () => {
    renderPanel();
    const list = screen.getByRole('list');
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(CFG.offers.length);
    CFG.offers.forEach((offer, i) => {
      const row = rows[i];
      expect(row).toHaveTextContent(offer.nameKey);
      expect(row).toHaveTextContent(offer.descKey);
      expect(row).toHaveTextContent(`${offer.price} ${offer.currencyKey}`);
      expect(row).toHaveTextContent(offer.stockLabelKey);
    });
  });

  it('shows the Preview badge as real text in the header', () => {
    renderPanel();
    expect(screen.getByText('gameFrame.merchant.previewBadge')).toBeInTheDocument();
    expect(screen.getByText(CFG.countdownLabelKey)).toBeInTheDocument();
  });

  it('the Buy affordance is natively inert: disabled, no handlers, activation is a no-op', () => {
    renderPanel();
    const buys = screen.getAllByRole('button', { name: 'gameFrame.merchant.buy.button' });
    expect(buys.length).toBe(CFG.offers.length);
    for (const buy of buys) {
      expect(buy).toBeDisabled();
      expect(buy).toHaveAttribute('title', 'gameFrame.merchant.buy.previewTooltip');
      fireEvent.click(buy);
      fireEvent.keyDown(buy, { key: 'Enter' });
    }
    // The panel is still rendered — synthetic activation changed nothing.
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('links the persistent preview caption via aria-describedby (label-in-name)', () => {
    renderPanel();
    const buy = screen.getAllByRole('button', { name: 'gameFrame.merchant.buy.button' })[0];
    const captionId = buy.getAttribute('aria-describedby');
    expect(captionId).toBeTruthy();
    expect(document.getElementById(captionId as string)).toHaveTextContent('gameFrame.merchant.buy.previewLabel');
  });
});

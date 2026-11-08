/**
 * HudRealMerchantPanel — PLAN-113 pilot D (commercio). Port of the /game merchant
 * surface onto the Zanara pf-3 frame: real `MERCHANT_CONFIG` offers, a kit divider
 * between rows, the enamel BUY action (disabled — mock buy stays inert as in production).
 *
 * Production parity (E-13): same data, same i18n keys as `MerchantPanel`; the only
 * change is the dressing. The medallion fills the frame's dark-glass window (no
 * merchant art exists yet — the approved emblem reads as the guild seal).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HudRealPanel } from './HudRealPanel';
import { MerchantOfferIcon } from '@/ui/idleVillage/components/gameFrame/merchantOfferIcons';
import type { MerchantConfig } from '@/balancing/config/idleVillage/merchantConfig';

const C = { ink: '#2b2118', muted: '#6b5a3e' } as const;
const GUILD_SEAL = '/assets/ui/hud-real/kit/medallion.png';

export interface HudRealMerchantPanelProps {
  config: MerchantConfig;
}

export const HudRealMerchantPanel: React.FC<HudRealMerchantPanelProps> = ({ config }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <HudRealPanel
      kicker={t(config.countdownLabelKey)}
      title={t('gameFrame.merchant.title')}
      illustration={<img src={GUILD_SEAL} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
      action={{ label: t('gameFrame.merchant.buy.button'), disabled: true }}
      ariaLabel={t('gameFrame.merchant.title')}
    >
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', maxWidth: '100%', maxHeight: '100%', overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {config.offers.map((offer, i) => (
          <li key={offer.offerId} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {i > 0 && (
              <img src="/assets/ui/hud-real/kit/divider.png" alt="" draggable={false}
                style={{ width: '100%', height: 10, objectFit: 'cover', objectPosition: 'center', display: 'block', margin: '5px 0 3px' }} />
            )}
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
              <span aria-hidden="true" style={{ color: C.muted, display: 'inline-flex', paddingTop: 2 }}>
                <MerchantOfferIcon iconKey={offer.iconKey} size={18} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>{t(offer.nameKey)}</span>
                  <span style={{ color: C.muted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginRight: 8 }}>
                    {t('gameFrame.merchant.priceLine', { price: offer.price, currency: t(offer.currencyKey) })}
                  </span>
                </span>
                <span style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>{t(offer.stockLabelKey)}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </HudRealPanel>
  );
};

export default HudRealMerchantPanel;

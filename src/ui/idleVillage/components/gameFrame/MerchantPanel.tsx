import React, { type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives/HudPlaque';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { EngravedIcon } from './engravedIcons';
import { useHudPanelDrag } from './useHudPanelDrag';
import { MerchantOfferIcon } from './merchantOfferIcons';
import { MockBuyControl } from './MockBuyControl';
import type { MerchantConfig } from '@/balancing/config/idleVillage/merchantConfig';

/**
 * MerchantPanel — the village merchant's mock storefront (PLAN-032 SP-3,
 * artifact r003).
 *
 * A modeless `HudPlaque` opened from the Director-staged building marker, the
 * Panels menu or the `m` shortcut. **Nothing in this screen mutates game or
 * persisted state**: offers are a read-only `<ul>`, the Buy control is a
 * natively disabled button with no callbacks, and the Preview badge makes
 * the mock status plain text. The panel drags by its header via
 * `useHudPanelDrag` and coexists with the quest window.
 */
export interface MerchantPanelProps {
  config: MerchantConfig;
  /** Anchored position in the free corridor (page-level geometry). */
  left: number;
  top: number;
  widthPx: number;
  zIndex: number;
  onClose: () => void;
}

const titleId = 'merchant-panel-title';

const controlButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  minHeight: 24,
  padding: 0,
};

export const MerchantPanel: React.FC<MerchantPanelProps> = ({ config, left, top, widthPx, zIndex, onClose }) => {
  const { t } = useTranslation('idleVillage');
  const { panelStyle, handleProps } = useHudPanelDrag();

  return (
    <div
      data-hud-panel="merchant"
      tabIndex={-1}
      style={{
        position: 'fixed',
        left,
        top,
        width: widthPx,
        zIndex: panelStyle.zIndex ?? zIndex,
        pointerEvents: 'auto',
        outline: 'none',
        ...panelStyle,
      }}
    >
      <SkinScope data-hud-controls="">
        <HudPlaque
          shape="panel"
          as="section"
          aria-labelledby={titleId}
          style={{ display: 'flex', flexDirection: 'column', padding: 'var(--skin-hud-panel-padding)', gap: 'var(--skin-hud-stack-gap)' }}
        >
          {/* Header: title + restock note left, Preview badge + X right. Drag handle. */}
          <div {...handleProps} style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)', ...handleProps.style }}>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                id={titleId}
                style={{
                  font: 'var(--skin-hud-name-weight) var(--skin-hud-name-size) var(--skin-font-display)',
                  letterSpacing: 'var(--skin-hud-name-tracking)',
                  color: 'var(--skin-title-color)',
                  textShadow: 'var(--skin-hud-engrave)',
                }}
              >
                {t('gameFrame.merchant.title')}
              </span>
              {/* Static qualitative restock line — never a live countdown. */}
              <span style={{ font: 'italic 12px var(--skin-font-sans)', color: 'var(--skin-text-secondary)' }}>
                {t(config.countdownLabelKey)}
              </span>
            </span>
            <span
              style={{
                font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
                letterSpacing: 'var(--skin-hud-caps-tracking)',
                textTransform: 'uppercase',
                color: 'var(--skin-icon-accent)',
                border: '1px solid color-mix(in srgb, var(--skin-icon-accent) 55%, transparent)',
                borderRadius: 'var(--skin-hud-row-radius)',
                padding: '2px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              {t('gameFrame.merchant.previewBadge')}
            </span>
            <button type="button" data-skin="close" aria-label={t('gameFrame.panels.close')} onClick={onClose} style={controlButton}>
              <EngravedIcon id="cmd-close" size={14} />
            </button>
          </div>

          {/* Offers: a native list; the scroll region stays inside the plaque and
           *  out of the drag handle, so list scroll never pans the map. */}
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--skin-hud-stack-gap)',
              maxHeight: '60vh',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            {config.offers.map((offer) => (
              <li key={offer.offerId} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--skin-hud-inline-gap)', minWidth: 0 }}>
                <span aria-hidden="true" style={{ color: 'var(--skin-icon-accent)', display: 'inline-flex', alignItems: 'center', paddingTop: 1 }}>
                  <MerchantOfferIcon iconKey={offer.iconKey} size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ font: '600 12px var(--skin-font-sans)', color: 'var(--skin-text-primary)', display: 'flex', justifyContent: 'space-between', gap: 'var(--skin-hud-inline-gap)' }}>
                    <span>{t(offer.nameKey)}</span>
                    <span style={{ color: 'var(--skin-icon-accent)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {t('gameFrame.merchant.priceLine', { price: offer.price, currency: t(offer.currencyKey) })}
                    </span>
                  </span>
                  <span style={{ font: '12px var(--skin-font-sans)', color: 'var(--skin-text-secondary)', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                    {t(offer.descKey)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--skin-hud-inline-gap)' }}>
                    <span style={{ font: 'italic 12px var(--skin-font-sans)', color: 'var(--skin-label-primary)' }}>
                      {t(offer.stockLabelKey)}
                    </span>
                    <MockBuyControl />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </HudPlaque>
      </SkinScope>
    </div>
  );
};

export default MerchantPanel;

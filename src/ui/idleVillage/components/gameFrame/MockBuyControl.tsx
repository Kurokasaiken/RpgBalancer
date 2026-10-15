import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * `MockBuyControl` — the merchant screen's inert "Buy" affordance
 * (PLAN-032 SP-3, artifact r003).
 *
 * A natively `disabled` button: no click can ever reach it, and the component
 * accepts **no callback props** — the isolation test asserts no `on*`
 * attribute in its source. The visible caption next to it says the screen is
 * a preview (`aria-describedby` links them), and `title` carries the same
 * text for sighted hover. Label-in-name: `aria-label` equals the visible
 * button text.
 */
export const MockBuyControl: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const captionId = useId();
  const label = t('gameFrame.merchant.buy.button');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)' }}>
      <button
        type="button"
        disabled
        aria-label={label}
        aria-describedby={captionId}
        title={t('gameFrame.merchant.buy.previewTooltip')}
        style={{
          minWidth: 24,
          minHeight: 24,
          padding: '0 var(--skin-hud-inline-gap)',
          font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
          letterSpacing: 'var(--skin-hud-caps-tracking)',
          textTransform: 'uppercase',
          color: 'var(--skin-label-primary)',
          opacity: 0.55,
        }}
      >
        {label}
      </button>
      <span
        id={captionId}
        style={{
          font: 'italic 12px var(--skin-font-sans)',
          color: 'var(--skin-text-secondary)',
        }}
      >
        {t('gameFrame.merchant.buy.previewLabel')}
      </span>
    </span>
  );
};

export default MockBuyControl;

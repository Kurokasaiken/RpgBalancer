import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { VillageBuildingDefinition } from '@/balancing/config/idleVillage/villageBuildingsConfig';

/**
 * `MockUpgradeControl` — the building tooltip's inert "Build/Upgrade"
 * affordance (PLAN-035, artifact r005; twin of `MockBuyControl` SP-3).
 *
 * A natively `disabled` button: no click can ever reach it, and the component
 * accepts **no callback props** — the isolation test asserts no `on*`
 * attribute in its source. The visible caption next to it says the village
 * screen is a preview (`aria-describedby` links them), and `title` carries the
 * same text for sighted hover. Label-in-name: `aria-label` equals the visible
 * button text. At max level it renders a badge, not a control.
 */
export interface MockUpgradeControlProps {
  /** The building the control belongs to (read: state, level, tier count). */
  building: VillageBuildingDefinition;
}

export const MockUpgradeControl: React.FC<MockUpgradeControlProps> = ({ building }) => {
  const { t } = useTranslation('idleVillage');
  const captionId = useId();
  const atMax = building.initialLevel >= building.tiers.length;
  const label = atMax
    ? t('gameFrame.village.upgrade.maxLevel')
    : building.initialLevel === 0
      ? t('gameFrame.village.upgrade.build')
      : t('gameFrame.village.upgrade.upgrade');

  if (atMax) {
    return (
      <span
        style={{
          font: 'var(--skin-hud-caps-weight) var(--skin-hud-caps-size) var(--skin-font-display)',
          letterSpacing: 'var(--skin-hud-caps-tracking)',
          textTransform: 'uppercase',
          color: 'var(--skin-title-color)',
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--skin-hud-inline-gap)' }}>
      <button
        type="button"
        disabled
        aria-label={label}
        aria-describedby={captionId}
        title={t('gameFrame.village.upgrade.previewTooltip')}
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
          font: 'italic 12px var(--skin-font-serif)',
          color: 'var(--skin-text-secondary)',
        }}
      >
        {t('gameFrame.village.upgrade.previewLabel')}
      </span>
    </span>
  );
};

export default MockUpgradeControl;

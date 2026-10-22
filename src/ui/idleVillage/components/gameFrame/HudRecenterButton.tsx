import { useTranslation } from 'react-i18next';
import { HudTooltip } from './HudTooltip';
import { EngravedIcon } from './engravedIcons';

/** Coin = three control icons wide (42 px at the base skin, over the 32 px hit area); the glyph is one and a half. */
const COIN = 'calc(var(--skin-hud-control-icon-size) * 3)';
const GLYPH = 'calc(var(--skin-hud-control-icon-size) * 1.5)';

export interface HudRecenterButtonProps {
  onRecenter: () => void;
}

/**
 * Re-centre the map. A small coin set into the nav plinth: it replaces the old
 * cropped compass disc, which was the brightest object on screen and sat over land.
 * Painted compass medallion later; the button, label and hit area are final.
 */
export function HudRecenterButton({ onRecenter }: HudRecenterButtonProps) {
  const { t } = useTranslation('idleVillage');
  const label = t('gameFrame.compass.recenter');
  return (
    <HudTooltip label={label} side="top">
      <button
        type="button"
        aria-label={label}
        onClick={onRecenter}
        style={{
          width: COIN,
          height: COIN,
          margin: '0 var(--skin-hud-stack-gap)',
          padding: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          border: '1px solid var(--skin-hud-row-filet)',
          cursor: 'pointer',
          color: 'var(--skin-icon-color)',
          background: 'var(--skin-surface-bg)',
          boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--skin-icon-color) 25%, transparent)',
        }}
      >
        <EngravedIcon id="cmd-recenter" size={GLYPH} />
      </button>
    </HudTooltip>
  );
}

export default HudRecenterButton;

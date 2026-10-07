import { useTranslation } from 'react-i18next';
import { HudGlyph } from './hudIcons';

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
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onRecenter}
      style={{
        width: 44,
        height: 44,
        margin: '0 8px',
        padding: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--skin-icon-color)',
        background: 'color-mix(in srgb, var(--skin-surface-base) 85%, black)',
        boxShadow: '0 0 0 1.5px var(--skin-surface-border), inset 0 1px 0 color-mix(in srgb, var(--skin-icon-color) 25%, transparent)',
      }}
    >
      <HudGlyph iconId="world" label={label} size={22} />
    </button>
  );
}

export default HudRecenterButton;

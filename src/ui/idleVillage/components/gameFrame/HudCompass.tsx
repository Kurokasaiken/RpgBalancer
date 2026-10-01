import { useTranslation } from 'react-i18next';

export interface HudCompassProps {
  onRecenter: () => void;
  size?: number;
}

const BRASS = 'var(--hud-brass, #c9a24c)';
const BRASS_DARK = 'var(--hud-brass-dark, #6e531f)';

/**
 * Compass cropped by the bottom-left corner of the screen — the map-navigation
 * instrument: click to re-centre the map. PLACEHOLDER art; placement, crop and
 * hit area are final.
 */
export function HudCompass({ onRecenter, size = 190 }: HudCompassProps) {
  const { t } = useTranslation('idleVillage');
  const r = size / 2;
  const label = t('gameFrame.compass.recenter');

  return (
    <button
      type="button"
      className="hud-compass"
      aria-label={label}
      title={label}
      onClick={onRecenter}
      style={{
        position: 'absolute',
        left: -size * 0.32,
        bottom: -size * 0.32,
        width: size,
        height: size,
        padding: 0,
        border: 'none',
        borderRadius: '50%',
        background: 'none',
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
    >
      <style>{`
        .hud-compass svg { transition: transform 400ms cubic-bezier(0.22,1,0.36,1), filter 150ms; }
        .hud-compass:hover svg { transform: rotate(-8deg); filter: brightness(1.15); }
        .hud-compass:active svg { transform: rotate(-8deg) scale(0.98); }
      `}</style>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={r} cy={r} r={r - 3} fill={BRASS_DARK} stroke={BRASS} strokeWidth="5" />
        <circle cx={r} cy={r} r={r - 16} fill="#e8dcbc" stroke={BRASS} strokeWidth="1.5" />
        <polygon points={`${r},${22} ${r + 12},${r} ${r},${size - 22} ${r - 12},${r}`} fill={BRASS_DARK} />
        <polygon points={`${22},${r} ${r},${r - 12} ${size - 22},${r} ${r},${r + 12}`} fill="#8a6a2a" opacity="0.7" />
        <polygon points={`${r},${22} ${r + 12},${r} ${r - 12},${r}`} fill="#9b2f22" />
        <circle cx={r} cy={r} r="6" fill={BRASS} />
      </svg>
    </button>
  );
}

export default HudCompass;

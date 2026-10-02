import { useTranslation } from 'react-i18next';
import { HudPanel } from '@/ui/idleVillage/skins/primitives';

export interface HudAstrolabeProps {
  speedMultiplier: number;
  availableSpeeds: number[];
  isPaused: boolean;
  onSpeedChange: (speed: number) => void;
  onTogglePause: () => void;
  /** Cord length from the top edge, px. */
  cordPx?: number;
  size?: number;
}

const BRASS = 'var(--hud-brass, #c9a24c)';
const BRASS_DARK = 'var(--hud-brass-dark, #6e531f)';
const GLASS = 'var(--hud-glass, rgba(64,190,200,0.35))';

/**
 * Hanging astrolabe — the simulation-speed instrument. The centre stone toggles
 * pause; the notches on the rim set the speed. PLACEHOLDER art (flat SVG); the
 * geometry, cord and hit areas are final.
 */
export function HudAstrolabe({
  speedMultiplier,
  availableSpeeds,
  isPaused,
  onSpeedChange,
  onTogglePause,
  cordPx = 96,
  size = 104,
}: HudAstrolabeProps) {
  const { t } = useTranslation('idleVillage');
  const r = size / 2;
  const notchR = r - 12;
  const step = 70 / Math.max(1, availableSpeeds.length - 1);
  const angleFor = (i: number) => -35 + i * step;
  const activeIdx = Math.max(0, availableSpeeds.indexOf(speedMultiplier));
  const needleAngle = isPaused ? 180 : angleFor(activeIdx);

  return (
    <div
      className="hud-astrolabe"
      role="group"
      aria-label={t('gameFrame.speed.ariaLabel')}
      style={{ position: 'absolute', top: 0, left: 34, width: size, transformOrigin: `${r}px 0`, pointerEvents: 'auto' }}
    >
      <style>{`
        @keyframes hudAstrolabeSway { 0%,100% { transform: rotate(-1deg); } 50% { transform: rotate(1deg); } }
        .hud-astrolabe { animation: hudAstrolabeSway 7s ease-in-out infinite; }
        .hud-astrolabe button { transition: transform 120ms ease-out, filter 120ms ease-out; }
        .hud-astrolabe button:hover { filter: brightness(1.25); }
        .hud-astrolabe button:active { transform: translateY(1px) scale(0.97); }
        @media (prefers-reduced-motion: reduce) { .hud-astrolabe { animation: none; } }
      `}</style>
      <div style={{ width: 2, height: cordPx, margin: '0 auto', background: BRASS_DARK }} />
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
          <circle cx={r} cy={r} r={r - 2} fill={BRASS_DARK} stroke={BRASS} strokeWidth="3" />
          <circle cx={r} cy={r} r={r - 20} fill="none" stroke={BRASS} strokeWidth="1" opacity="0.6" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={r + Math.sin(a) * (r - 4)}
                y1={r - Math.cos(a) * (r - 4)}
                x2={r + Math.sin(a) * (r - 9)}
                y2={r - Math.cos(a) * (r - 9)}
                stroke={BRASS}
                strokeWidth="1"
              />
            );
          })}
          <g transform={`rotate(${needleAngle} ${r} ${r})`} style={{ transition: 'transform 300ms ease-out' }}>
            <line x1={r} y1={r} x2={r} y2={22} stroke={BRASS} strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
        {availableSpeeds.map((speed, i) => {
          const a = (angleFor(i) * Math.PI) / 180;
          const active = !isPaused && speed === speedMultiplier;
          return (
            <button
              key={speed}
              type="button"
              aria-pressed={active}
              aria-label={`×${speed}`}
              onClick={() => onSpeedChange(speed)}
              style={{
                position: 'absolute',
                left: r + Math.sin(a) * notchR - 14,
                top: r - Math.cos(a) * notchR - 10,
                width: 28,
                height: 20,
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--skin-font-display)',
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                fontVariantNumeric: 'tabular-nums',
                color: active ? 'var(--skin-title-color, #f0cf6a)' : 'rgba(240,220,170,0.55)',
                textShadow: active ? '0 0 6px rgba(240,207,106,0.7)' : 'none',
              }}
            >
              {`×${speed}`}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={isPaused}
          aria-label={t(isPaused ? 'gameFrame.speed.resume' : 'gameFrame.speed.pause')}
          title={t(isPaused ? 'gameFrame.speed.resume' : 'gameFrame.speed.pause')}
          onClick={onTogglePause}
          style={{
            position: 'absolute',
            left: r - 15,
            top: r - 15,
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: `1px solid ${BRASS}`,
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), ${GLASS} 45%, rgba(10,40,48,0.8) 100%)`,
            boxShadow: isPaused ? '0 0 0 2px rgba(240,207,106,0.5)' : '0 0 10px rgba(64,190,200,0.45)',
            color: '#f5ecd2',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          {isPaused ? '▶' : '❚❚'}
        </button>
        <HudPanel
          cutPx={7}
          role="group"
          aria-label={t('gameFrame.speed.ariaLabel')}
          style={{
            position: 'absolute',
            left: '50%',
            top: size + 6,
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 2,
            padding: 3,
          }}
        >
          {availableSpeeds.map((speed) => {
            const active = !isPaused && speed === speedMultiplier;
            return (
              <button
                key={speed}
                type="button"
                aria-pressed={active}
                aria-label={`×${speed}`}
                onClick={() => onSpeedChange(speed)}
                style={{
                  minWidth: 26,
                  height: 20,
                  padding: '0 5px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--skin-font-display)',
                  fontSize: 11,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  background: active ? 'rgba(223,184,87,0.22)' : 'transparent',
                  color: active ? 'var(--skin-title-color, #f0cf6a)' : 'var(--skin-label-primary, rgba(240,220,170,0.7))',
                }}
              >
                {`×${speed}`}
              </button>
            );
          })}
        </HudPanel>
      </div>
    </div>
  );
}

export default HudAstrolabe;

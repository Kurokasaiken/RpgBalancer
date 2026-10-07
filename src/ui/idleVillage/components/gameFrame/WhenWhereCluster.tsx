import React from 'react';
import { useTranslation } from 'react-i18next';
import { MatericField } from '@/ui/designSystem/primitives';
import { useCompactTop } from './useCompactTop';
import DayNightPoiSkin from '@/ui/idleVillage/components/minimal/DayNightPoiSkin';

export interface WhenWhereClusterProps {
  isDayPhase: boolean;
  cycleProgress: number;
  isPaused: boolean;
  currentDay: number;
  /** Where the player is looking — already i18n-resolved. */
  placeName: string;
  /** Pause and speed strip. Omit it to leave the cluster as a read-out. */
  speed?: {
    multiplier: number;
    available: number[];
    onChange: (speed: number) => void;
    onTogglePause: () => void;
  };
}

/**
 * "When and where" — content for the top-centre ribbon.
 *
 * The reference mockup runs day · weather · place across this ribbon. We have
 * no weather system, so that cell is simply absent rather than invented
 * (Director: "la meccanica non è da prendere dal mockup"). In its place the
 * real day/night medallion (`DayNightPoiSkin`, already a certified POI-family
 * gauge with its own progress halo) does the job the mockup's sun icon was
 * doing, and actually means something: it shows how far through the phase we
 * are, not just which phase it is.
 */
/** Pause / speed chip: quiet until selected; while paused the held speed keeps a ring. */
const stripButtonStyle = (checked: boolean, held: boolean): React.CSSProperties => ({
  minWidth: 32,
  height: 28,
  padding: '0 8px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: 'var(--skin-font-display)',
  fontSize: 13,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  color: checked ? 'var(--skin-title-color)' : 'var(--skin-label-primary)',
  background: checked ? 'color-mix(in srgb, var(--skin-icon-accent) 32%, transparent)' : 'transparent',
  boxShadow: checked
    ? 'inset 0 1px 0 color-mix(in srgb, var(--skin-title-color) 35%, transparent), inset 0 -1px 0 var(--skin-title-color)'
    : held
      ? 'inset 0 0 0 1.5px var(--skin-label-primary)'
      : 'none',
});

export const WhenWhereCluster: React.FC<WhenWhereClusterProps> = ({
  isDayPhase,
  cycleProgress,
  isPaused,
  currentDay,
  placeName,
  speed,
}) => {
  const { t } = useTranslation('idleVillage');
  const compact = useCompactTop();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 34,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ transform: 'scale(0.42)', transformOrigin: 'center' }}>
          <DayNightPoiSkin isDayPhase={isDayPhase} cycleProgress={cycleProgress} isPaused={isPaused} />
        </div>
      </div>

      <MatericField
        tier="tertiary"
        orientation="horizontal"
        label={t('gameFrame.status.dayLabel')}
        // The clock starts at day 0; players count from "Day 1".
        value={currentDay + 1}
        style={{ gap: 7 }}
      />

      {!compact && (
        <>
      <span aria-hidden="true" style={{ width: 1, height: 18, background: 'var(--skin-separator)' }} />

      <span
        style={{
          fontFamily: 'var(--skin-font-serif)',
          fontSize: 13,
          color: 'var(--skin-body-color)',
          whiteSpace: 'nowrap',
        }}
      >
        {placeName}
      </span>
        </>
      )}

      {speed && (
        <>
          <span aria-hidden="true" style={{ width: 1, height: 18, background: 'var(--skin-separator)' }} />
          <div
            role="radiogroup"
            aria-label={t('gameFrame.speed.ariaLabel')}
            style={{ display: 'flex', gap: 2, alignItems: 'center' }}
          >
            <button
              type="button"
              role="radio"
              aria-checked={isPaused}
              aria-label={isPaused ? t('gameFrame.speed.resume') : t('gameFrame.speed.pause')}
              title={isPaused ? t('gameFrame.speed.resume') : t('gameFrame.speed.pause')}
              onClick={speed.onTogglePause}
              style={stripButtonStyle(isPaused, false)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor">
                {isPaused ? <path d="M2.5 1.5v9l8-4.5z" /> : <path d="M2 1.5h3v9H2zM7 1.5h3v9H7z" />}
              </svg>
            </button>
            {speed.available.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={!isPaused && value === speed.multiplier}
                aria-label={`×${value}`}
                onClick={() => speed.onChange(value)}
                style={stripButtonStyle(!isPaused && value === speed.multiplier, isPaused && value === speed.multiplier)}
              >
                {`×${value}`}
              </button>
            ))}
          </div>
        </>
      )}

      {isPaused && (
        // Hangs from the ribbon's free edge (its positioned ancestor), clear of the lozenge ornament.
        <span
          role="status"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translate(-50%, 6px)',
            padding: '3px 12px',
            borderRadius: '0 0 8px 8px',
            background: 'color-mix(in srgb, var(--skin-surface-base) 70%, black)',
            boxShadow: '0 0 0 1px var(--skin-surface-border)',
            color: 'var(--skin-title-color)',
            fontFamily: 'var(--skin-font-display)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {t('gameFrame.speed.paused')}
        </span>
      )}
    </div>
  );
};

export default WhenWhereCluster;

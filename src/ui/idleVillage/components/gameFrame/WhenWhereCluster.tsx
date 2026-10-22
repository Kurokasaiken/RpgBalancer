import React from 'react';
import { useTranslation } from 'react-i18next';
import { MatericField } from '@/ui/designSystem/primitives';
import { HudTooltip } from './HudTooltip';
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
/**
 * Pause / speed chip, measured on the Roster's header controls (PLAN-058 T1.2):
 * the button is the 32 px hit area (guide §6.4), the pill drawn inside it is the
 * Roster's control height. Quiet until selected; while paused the held speed keeps a ring.
 */
const stripButtonStyle: React.CSSProperties = {
  minWidth: 32,
  height: 32,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
};
const stripPillStyle = (checked: boolean, held: boolean): React.CSSProperties => ({
  minWidth: 'var(--skin-hud-control-height)',
  height: 'var(--skin-hud-control-height)',
  padding: '0 var(--skin-hud-inline-gap)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  fontFamily: 'var(--skin-font-display)',
  fontSize: 'var(--skin-hud-name-size)',
  fontWeight: 'var(--skin-hud-name-weight)' as React.CSSProperties['fontWeight'],
  fontVariantNumeric: 'tabular-nums',
  color: checked ? 'var(--skin-title-color)' : 'var(--skin-label-primary)',
  background: checked ? 'color-mix(in srgb, var(--skin-icon-accent) 32%, transparent)' : 'transparent',
  boxShadow: checked
    ? 'inset 0 1px 0 color-mix(in srgb, var(--skin-title-color) 35%, transparent), inset 0 -1px 0 var(--skin-title-color)'
    : held
      ? 'inset 0 0 0 1.5px var(--skin-label-primary)'
      : 'none',
  transition: 'background 140ms ease-out, color 140ms ease-out, box-shadow 140ms ease-out',
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
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--skin-hud-plaque-clearance)' }}>
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
          <DayNightPoiSkin isDayPhase={isDayPhase} cycleProgress={cycleProgress} isPaused={isPaused} nightTone="silver" />
        </div>
      </div>

      {/* HUD-3 = P1 (R-234): the region name no longer takes a slot of the tab — it is the day's tooltip. */}
      <HudTooltip label={placeName} wrap>
        <MatericField
          tier="tertiary"
          orientation="horizontal"
          label={t('gameFrame.status.dayLabel')}
          // The clock starts at day 0; players count from "Day 1".
          value={currentDay + 1}
          style={{ gap: 7 }}
          labelStyle={{ fontSize: 'var(--skin-hud-caps-size)' }}
        />
      </HudTooltip>

      {speed && (
        <>
          <span aria-hidden="true" style={{ width: 1, height: 18, background: 'var(--skin-separator)' }} />
          <div
            role="radiogroup"
            aria-label={t('gameFrame.speed.ariaLabel')}
            style={{ display: 'flex', gap: 0, alignItems: 'center' }}
          >
            <HudTooltip label={isPaused ? t('gameFrame.speed.resume') : t('gameFrame.speed.pause')} shortcut={t('gameFrame.speed.spaceKey')}>
            <button
              type="button"
              role="radio"
              aria-checked={isPaused}
              aria-label={isPaused ? t('gameFrame.speed.resume') : t('gameFrame.speed.pause')}
              onClick={speed.onTogglePause}
              style={stripButtonStyle}
            >
              <span style={stripPillStyle(isPaused, false)}>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor">
                  {isPaused ? <path d="M2.5 1.5v9l8-4.5z" /> : <path d="M2 1.5h3v9H2zM7 1.5h3v9H7z" />}
                </svg>
              </span>
            </button>
            </HudTooltip>
            {speed.available.map((value, index) => (
              <HudTooltip key={value} label={`×${value}`} shortcut={String(index + 1)}>
              <button
                type="button"
                role="radio"
                aria-checked={!isPaused && value === speed.multiplier}
                aria-label={`×${value}`}
                onClick={() => speed.onChange(value)}
                style={stripButtonStyle}
              >
                <span style={stripPillStyle(!isPaused && value === speed.multiplier, isPaused && value === speed.multiplier)}>{`×${value}`}</span>
              </button>
              </HudTooltip>
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
            padding: 'var(--skin-hud-control-gap) var(--skin-hud-plaque-clearance)',
            borderRadius: '0 0 8px 8px',
            background: 'color-mix(in srgb, var(--skin-surface-base) 70%, black)',
            boxShadow: '0 0 0 1px var(--skin-surface-border)',
            color: 'var(--skin-title-color)',
            fontFamily: 'var(--skin-font-display)',
            fontSize: 'var(--skin-hud-caps-size)',
            fontWeight: 'var(--skin-hud-caps-weight)' as React.CSSProperties['fontWeight'],
            letterSpacing: 'var(--skin-hud-caps-tracking)',
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

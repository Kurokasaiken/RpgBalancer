import type { JSX } from 'react';
import { useMemo } from 'react';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import {
  getActivityPoiSkinForPreset,
  resolveActivityPoiPresetId,
} from '@/ui/idleVillage/skins/activityPoiSkinConfig';
import { GenericPoiSkin } from './GenericPoiSkin';

/**
 * Runtime status of a one-shot activity.
 */
export type ActivityStatus = 'idle' | 'in-progress' | 'completed' | 'blocked';

/**
 * Props for ActivityPOI
 */
export interface ActivityPOIProps {
  /** Unique activity identifier. */
  activityId: string;
  /** Display label shown below the medallion. */
  label: string;
  /** Emoji or short string for the center pin. */
  icon?: string;
  /** Pillar determines color grammar. Defaults to 'frontier'. */
  pillar?: 'frontier' | 'empire';
  /** Runtime status. */
  status?: ActivityStatus;
  /** Progress 0–1. */
  progress?: number;
  /** Milliseconds remaining. Shown as countdown badge when provided. */
  timeRemainingMs?: number;
  /** Threshold for "near expiration" visual warnings in milliseconds. */
  expirationThresholdMs?: number;
  /** Whether this activity can expire and disappear (vs. countdown-only). */
  isExpirable?: boolean;
  /** Danger rating 0–10. Shown as risk badge when > 0. */
  dangerRating?: number;
  /** Override the Style Lab preset id. */
  skinPresetId?: string;
  /** Rendered size in pixels. */
  size?: number;
  /** Called when the medallion is clicked. */
  onClick?: () => void;
}

/**
 * Format milliseconds as "MMm SSs" or "SSs".
 */
function formatMs(ms: number): string {
  if (ms <= 0) return '0s';
  const totalS = Math.ceil(ms / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * ActivityPOI — typed POI medallion for one-shot timed activities.
 *
 * Wraps GenericPoiSkin with:
 * - Config-driven palettes resolved from activityPoiSkinConfig
 * - Countdown timer badge overlay
 * - Danger/risk badge overlay
 * - Status-driven palette (idle / in-progress / completed / blocked)
 * - Pillar switching: frontier (teal) or empire (bronze-indigo)
 *
 * On click → caller is responsible for opening ActivityCapsuleDetailSkinAware.
 */
export function ActivityPOI(props: ActivityPOIProps): JSX.Element {
  const {
    activityId,
    label,
    icon = '🔍',
    pillar = 'frontier',
    status = 'idle',
    progress = 0,
    timeRemainingMs,
    expirationThresholdMs,
    isExpirable,
    dangerRating = 0,
    skinPresetId,
    size,
    onClick,
  } = props;

  const { presetId: stylePref } = useSkinPreferences();

  // Resolve preset based on pillar preference
  const resolvedPresetId = useMemo(() => {
    if (skinPresetId) return resolveActivityPoiPresetId(skinPresetId);
    if (pillar === 'empire') return 'empire_activity_default';
    return resolveActivityPoiPresetId(stylePref);
  }, [skinPresetId, pillar, stylePref]);

  const preset = getActivityPoiSkinForPreset(resolvedPresetId);
  const cfg = preset.config;
  const renderSize = size ?? cfg.size;

  const palette =
    status === 'in-progress'
      ? cfg.palettes.inProgress
      : status === 'completed'
        ? cfg.palettes.completed
        : status === 'blocked'
          ? cfg.palettes.blocked
          : cfg.palettes.idle;

  // Risk badge color
  const riskColor =
    dangerRating > 6
      ? cfg.risk.highColor
      : dangerRating > 3
        ? cfg.risk.medColor
        : cfg.risk.lowColor;

  const showTimer = cfg.showTimer && timeRemainingMs != null && timeRemainingMs > 0 && status === 'in-progress';
  const showRisk = cfg.showRiskBadge && dangerRating > 0;

  return (
    <div
      className="flex flex-col items-center gap-2 select-none"
      data-activity-id={activityId}
    >
      {/* Medallion */}
      <div className="relative cursor-pointer" onClick={onClick} role="button" aria-label={`${label} — ${status}`}>
        <GenericPoiSkin
          icon={icon}
          label={undefined}
          progress={progress}
          coronaCore={palette.coronaCore}
          coronaGlow={palette.coronaGlow}
          rimColors={palette.rimColors}
          stoneColors={palette.stoneColors}
          stoneAmbient={palette.stoneAmbient}
          pinColor={palette.pinColor}
          pillar={cfg.pillar}
          size={renderSize}
          enableHover={status !== 'blocked'}
          isCompleted={status === 'completed'}
          timeRemainingMs={timeRemainingMs}
          expirationThresholdMs={expirationThresholdMs}
          isExpirable={isExpirable}
        />

        {/* Timer badge — top */}
        {showTimer && (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold leading-none whitespace-nowrap"
            style={{
              background: cfg.timer.background,
              border: `1px solid ${cfg.timer.border}`,
              color: cfg.timer.textColor,
            }}
          >
            ⏱ {formatMs(timeRemainingMs!)}
          </div>
        )}

        {/* Completed badge */}
        {status === 'completed' && (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-semibold leading-none whitespace-nowrap"
            style={{
              background: 'rgba(20,50,30,.90)',
              border: '1px solid rgba(74,222,128,.55)',
              color: 'rgba(74,222,128,.95)',
            }}
          >
            ✓ Done
          </div>
        )}

        {/* Blocked badge */}
        {status === 'blocked' && (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-semibold leading-none whitespace-nowrap"
            style={{
              background: 'rgba(40,20,20,.90)',
              border: '1px solid rgba(148,163,184,.40)',
              color: 'rgba(148,163,184,.80)',
            }}
          >
            🔒 Blocked
          </div>
        )}

        {/* Danger badge — bottom-right */}
        {showRisk && (
          <div
            className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none"
            style={{
              background: 'rgba(15,23,42,.88)',
              border: `1px solid ${riskColor}`,
              color: riskColor,
            }}
          >
            {cfg.risk.icon} {dangerRating}
          </div>
        )}
      </div>

      {/* Label */}
      <div
        className="text-xs font-semibold tracking-wider"
        style={{
          color:
            pillar === 'empire'
              ? 'rgba(251,191,36,.85)'
              : 'rgba(94,234,212,.80)',
        }}
      >
        {label}
      </div>

      {/* Pillar indicator */}
      <div
        className="text-[9px] uppercase tracking-widest"
        style={{ color: 'rgba(100,116,139,.60)' }}
      >
        {cfg.pillar}
      </div>
    </div>
  );
}

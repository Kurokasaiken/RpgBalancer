import type { JSX } from 'react';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import {
  getQuestPoiSkinForPreset,
  resolveQuestPoiPresetId,
} from '@/ui/idleVillage/skins/questPoiSkinConfig';
import { GenericPoiSkin } from './GenericPoiSkin';

/**
 * Visual state of a single quest phase.
 */
export type QuestPhaseState = 'locked' | 'active' | 'success' | 'failure';

/**
 * Minimal phase descriptor for the dot indicator row.
 */
export interface QuestPOIPhase {
  id: string;
  state: QuestPhaseState;
}

/**
 * Runtime status of the quest.
 */
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'failed';

/**
 * Props for QuestPOI
 */
export interface QuestPOIProps {
  /** Unique quest identifier. */
  questId: string;
  /** Display label shown below the medallion. */
  label: string;
  /** Emoji or short string for the center pin. */
  icon?: string;
  /** Runtime status of the quest. */
  status?: QuestStatus;
  /** Phase list for the dot indicator row. */
  phases?: QuestPOIPhase[];
  /** Index of the currently active phase (0-based). */
  currentPhaseIndex?: number;
  /** Progress 0–1 within the current active phase. */
  progress?: number;
  /** Time remaining before expiration in milliseconds (optional, for expiration visuals). */
  timeRemainingMs?: number;
  /** Threshold for "near expiration" visual warnings in milliseconds. */
  expirationThresholdMs?: number;
  /** Whether this quest can expire and disappear (vs. countdown-only). */
  isExpirable?: boolean;
  /** Danger rating 0–10 for the badge. */
  dangerRating?: number;
  /** Override Style Lab preset id. */
  skinPresetId?: string;
  /** Rendered size in pixels. */
  size?: number;
  /** Called when the medallion is clicked — caller opens QuestChronicle. */
  onClick?: () => void;
}

/**
 * QuestPOI — typed POI medallion for multi-phase narrative quests.
 *
 * Wraps GenericPoiSkin with:
 * - Config-driven palettes from questPoiSkinConfig (never raw colors)
 * - Phase dot row: one dot per phase, colored by state
 * - Danger rating badge
 * - Status-driven corona palette (available/inProgress/completed/failed)
 *
 * Always Empire pillar.
 * On click → caller is responsible for opening QuestChronicle.
 */
export function QuestPOI(props: QuestPOIProps): JSX.Element {
  const {
    questId,
    label,
    icon = '⚔️',
    status = 'available',
    phases = [],
    currentPhaseIndex = 0,
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
  const resolvedPreset = getQuestPoiSkinForPreset(resolveQuestPoiPresetId(skinPresetId ?? stylePref));
  const cfg = resolvedPreset.config;
  const renderSize = size ?? cfg.size;

  const palette =
    status === 'in_progress'
      ? cfg.palettes.inProgress
      : status === 'completed'
        ? cfg.palettes.completed
        : status === 'failed'
          ? cfg.palettes.failed
          : cfg.palettes.available;

  const dotCfg = cfg.phaseDots;
  const visiblePhases = phases.slice(0, dotCfg.maxVisible);
  const overflowCount = phases.length - dotCfg.maxVisible;

  const dangerColor =
    dangerRating > 6
      ? cfg.danger.highColor
      : dangerRating > 3
        ? cfg.danger.medColor
        : cfg.danger.lowColor;

  const showDanger = cfg.showDangerBadge && dangerRating > 0;

  const dotColorFor = (state: QuestPhaseState): string => {
    switch (state) {
      case 'active':
        return dotCfg.activeColor;
      case 'success':
        return dotCfg.successColor;
      case 'failure':
        return dotCfg.failureColor;
      default:
        return dotCfg.lockedColor;
    }
  };

  return (
    <div
      className="flex flex-col items-center gap-2 select-none"
      data-quest-id={questId}
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
          enableHover={status !== 'failed'}
          isCompleted={status === 'completed' || status === 'failed'}
          timeRemainingMs={timeRemainingMs}
          expirationThresholdMs={expirationThresholdMs}
          isExpirable={isExpirable}
        />

        {/* Status badge — top-center */}
        {status === 'completed' && (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-semibold leading-none whitespace-nowrap"
            style={{
              background: 'rgba(20,50,30,.90)',
              border: '1px solid rgba(74,222,128,.55)',
              color: 'rgba(74,222,128,.95)',
            }}
          >
            ✓ Victory
          </div>
        )}
        {status === 'failed' && (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-semibold leading-none whitespace-nowrap"
            style={{
              background: 'rgba(50,10,10,.90)',
              border: '1px solid rgba(248,113,113,.55)',
              color: 'rgba(248,113,113,.90)',
            }}
          >
            ✕ Defeat
          </div>
        )}

        {/* Danger badge — bottom-right */}
        {showDanger && (
          <div
            className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none"
            style={{
              background: 'rgba(15,23,42,.88)',
              border: `1px solid ${dangerColor}`,
              color: dangerColor,
            }}
          >
            {cfg.danger.icon} {dangerRating}
          </div>
        )}

        {/* Phase progress indicator — bottom-left (active phase index) */}
        {status === 'in_progress' && phases.length > 0 && (
          <div
            className="absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none whitespace-nowrap"
            style={{
              background: 'rgba(15,23,42,.88)',
              border: `1px solid ${dotCfg.activeColor}`,
              color: dotCfg.activeColor,
            }}
          >
            {currentPhaseIndex + 1}/{phases.length}
          </div>
        )}
      </div>

      {/* Label */}
      <div
        className="text-xs font-semibold tracking-wider"
        style={{ color: 'rgba(251,191,36,.85)' }}
      >
        {label}
      </div>

      {/* Phase dot row */}
      {cfg.showPhaseDots && phases.length > 0 && (
        <div
          className="flex items-center"
          style={{ gap: dotCfg.dotGap }}
          aria-label={`${phases.length} quest phases`}
        >
          {visiblePhases.map((phase) => (
            <div
              key={phase.id}
              className="rounded-full transition-all duration-300"
              style={{
                width: dotCfg.dotSize,
                height: dotCfg.dotSize,
                background: dotColorFor(phase.state),
                boxShadow: phase.state === 'active' ? dotCfg.activeGlow : 'none',
                opacity: phase.state === 'locked' ? 0.5 : 1,
              }}
              aria-label={`Phase ${phase.id}: ${phase.state}`}
            />
          ))}
          {overflowCount > 0 && (
            <span
              className="text-[9px]"
              style={{ color: 'rgba(100,116,139,.65)' }}
            >
              +{overflowCount}
            </span>
          )}
        </div>
      )}

      {/* Pillar label */}
      <div
        className="text-[9px] uppercase tracking-widest"
        style={{ color: 'rgba(100,116,139,.60)' }}
      >
        empire · quest
      </div>
    </div>
  );
}

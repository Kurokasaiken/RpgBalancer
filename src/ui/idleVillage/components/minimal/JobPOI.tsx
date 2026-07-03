import type { JSX } from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import {
  getJobPoiSkinForPreset,
  resolveJobPoiPresetId,
} from '@/ui/idleVillage/skins/jobPoiSkinConfig';
import { GenericPoiSkin } from './GenericPoiSkin';
import { getSlotGlowConfig } from '@/ui/idleVillage/config/minimalFeedbackConfig';

/**
 * Runtime status of the job from the engine.
 * - idle: no resident assigned, job not running.
 * - working: resident assigned and actively working.
 * - exhausted: resident's fatigue has hit the cap, job stalled.
 */
export type JobStatus = 'idle' | 'working' | 'exhausted';

/**
 * Props for JobPOI
 */
export interface JobPOIProps {
  /** Unique activity identifier. */
  activityId: string;
  /** Display label shown below the medallion. */
  label: string;
  /** Emoji or short string rendered in the center pin. */
  icon?: string;
  /** Current runtime status of the job. */
  status: JobStatus;
  /** Progress 0–1 of the current reward cycle. */
  progress?: number;
  /** Primary resource reward label (e.g. "🪵 +12/h"). */
  rewardLabel?: string;
  /** Override the Style Lab preset id for skin resolution. */
  skinPresetId?: string;
  /** Rendered size in pixels (overrides preset default). */
  size?: number;
  /** Called when the medallion or detail area is clicked. */
  onClick?: () => void;
  /** Time remaining before expiration in milliseconds (optional, for expiration visuals). */
  timeRemainingMs?: number;
  /** Threshold for "near expiration" visual warnings in milliseconds. */
  expirationThresholdMs?: number;
  /** Whether this job can expire and disappear (vs. countdown-only). */
  isExpirable?: boolean;
  /** Number of free slots available for this job. */
  freeSlots?: number;
  /** Total slot capacity for this job. */
  maxSlots?: number;
  /** Whether this job can accept drops (based on requirements, phase, etc.). */
  canAcceptDrop?: boolean;
  /** Requirements for assigning a resident (activity-level, can be overridden per-slot). */
  requirements?: {
    minStrength?: number;
    minDexterity?: number;
    maxFatigue?: number;
    requiredSkills?: string[];
  };
  /** Individual slot configurations with per-slot requirements. */
  slots?: Array<{
    id: string;
    assignedResidentId?: string;
    requirements?: {
      minStrength?: number;
      minDexterity?: number;
      maxFatigue?: number;
      requiredSkills?: string[];
    };
  }>;
}

/**
 * JobPOI — typed POI medallion for continuous village jobs.
 *
 * Wraps GenericPoiSkin with:
 * - Config-driven color palette resolved from jobPoiSkinConfig (never raw prop colors)
 * - Exhausted overlay when fatigue cap reached
 * - Status-driven palette switching (idle / working / exhausted)
 * - dnd-kit drop zone with halo/alpha feedback (same logic as ActivitySlot)
 * - Slot capacity and requirements for drag validation
 *
 * Always Wilderness pillar.
 * On click → caller is responsible for opening ActivityCapsuleDetailSkinAware.
 * Residents/PG are only visible in POI Detail, not in the JobPOI itself.
 */
export function JobPOI(props: JobPOIProps): JSX.Element {
  const {
    activityId,
    label,
    icon = '🪓',
    status = 'idle',
    progress = 0,
    rewardLabel,
    skinPresetId,
    size,
    onClick,
    timeRemainingMs,
    expirationThresholdMs,
    isExpirable,
    freeSlots = 0,
    maxSlots = 1,
    canAcceptDrop = true,
    requirements,
    slots = [],
  } = props;

  const { presetId: stylePref } = useSkinPreferences();
  const resolvedPreset = getJobPoiSkinForPreset(resolveJobPoiPresetId(skinPresetId ?? stylePref));
  const cfg = resolvedPreset.config;
  const renderSize = size ?? cfg.size;

  // Pick palette based on status
  const palette =
    status === 'working'
      ? cfg.palettes.working
      : status === 'exhausted'
        ? cfg.palettes.exhausted
        : cfg.palettes.idle;

  // dnd-kit drop zone
  const droppableId = `job-poi-drop-${activityId}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    disabled: !canAcceptDrop || freeSlots === 0,
    data: {
      accepts: ['resident'],
      activityId,
      kind: 'job',
      requirements,
      slots,
      freeSlots,
      maxSlots,
    },
  });

  // Get currently dragged resident from dnd context
  const { active } = useDndContext();
  const draggedResident = active?.data.current as { resident?: { stats?: { hp?: number } } } | undefined;
  const residentHp = draggedResident?.resident?.stats?.hp ?? 0;

  // Config-driven glow (same as ActivitySlot)
  const slotGlowConfig = getSlotGlowConfig();
  const highlightSettings = slotGlowConfig.highlight ?? {
    stabilizeMs: 0,
    focusScale: 1.04,
    hoverScale: 1.02,
    selectedScale: 1.05,
    invalidOpacity: 0.30,
    transitionMs: 200,
  };

  // Highlight state logic - bloom only when dragging pgToken AND at least one free slot AND pg meets requirements for that slot
  type HighlightState = 'idle' | 'valid' | 'invalid';
  const highlightState: HighlightState = (() => {
    // Check if there's a resident being dragged
    if (!active) return 'idle';
    // Check if POI can accept drops and has free slots
    if (!canAcceptDrop || freeSlots === 0) return 'invalid';
    // Check if dragged resident meets requirements for at least one free slot
    const hasValidSlot = slots.some(slot => {
      if (slot.assignedResidentId) return false; // slot is occupied
      const slotReq = slot.requirements || requirements;
      if (!slotReq) return true; // no requirements = valid
      // Check if resident meets slot requirements
      if (slotReq.minHp && residentHp < slotReq.minHp) return false;
      if (slotReq.minStrength && draggedResident?.resident?.stats?.strength < slotReq.minStrength) return false;
      if (slotReq.minDexterity && draggedResident?.resident?.stats?.dexterity < slotReq.minDexterity) return false;
      if (slotReq.maxFatigue && draggedResident?.resident?.fatigue > slotReq.maxFatigue) return false;
      return true;
    });
    return hasValidSlot ? 'valid' : 'invalid';
  })();

  // Glow styles based on state
  const getGlowStyles = (state: HighlightState) => {
    switch (state) {
      case 'valid':
        return slotGlowConfig.valid;
      case 'invalid':
        return slotGlowConfig.invalid;
      case 'idle':
      default:
        return slotGlowConfig.idle;
    }
  };

  const currentGlow = getGlowStyles(highlightState);
  const glowStyle = {
    transform: 'scale(1)',
    transition: `transform ${highlightSettings.transitionMs}ms ease, opacity ${highlightSettings.transitionMs}ms ease`,
    boxShadow: highlightState === 'valid' ? currentGlow.boxShadow : 'none',
    opacity: highlightState === 'invalid' ? highlightSettings.invalidOpacity : 1,
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Medallion — clickable + drop zone */}
      <div
        ref={setNodeRef}
        className="relative cursor-pointer"
        onClick={onClick}
        data-testid={`job-poi-${activityId}`}
        role="button"
        aria-label={`${label} — ${status}`}
        style={{
          ...(status === 'exhausted'
            ? { filter: `drop-shadow(0 0 0 ${cfg.exhaustedOverlayColor})` }
            : undefined
          ),
          ...glowStyle,
        }}
      >
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
          enableHover={true}
          isCompleted={status === 'exhausted'}
          timeRemainingMs={timeRemainingMs}
          expirationThresholdMs={expirationThresholdMs}
          isExpirable={isExpirable}
        />

        {/* Reward label badge — bottom-left */}
        {rewardLabel && status === 'working' && (
          <div
            className="absolute -bottom-1 -left-1 px-1 py-0.5 rounded text-[9px] font-semibold leading-none whitespace-nowrap"
            style={{
              background: 'rgba(15,23,42,.85)',
              border: '1px solid rgba(71,85,105,.55)',
              color: cfg.rewardBadgeColor,
            }}
          >
            {rewardLabel}
          </div>
        )}

        {/* Exhausted overlay */}
        {status === 'exhausted' && (
          <div
            className="absolute inset-0 pointer-events-none rounded-full flex items-center justify-center"
            style={{ background: cfg.exhaustedOverlayColor }}
          >
            <span className="text-[10px] font-semibold text-slate-300 tracking-widest uppercase">
              Exhausted
            </span>
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
    </div>
  );
}

import React, { useMemo } from 'react';
import clsx from 'clsx';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import type { LocationDropState } from '@/ui/idleVillage/map/validators/locationDropValidators';
import InlineResidentChips from '@/ui/idleVillage/components/InlineResidentChips';
import type { ResidentAssignmentCandidate } from '@/ui/idleVillage/components/InlineResidentChips';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';

/**
 * View model describing a single activity slot rendered inside the area.
 * All progress/duration calculations are performed upstream to keep this
 * component purely presentational.
 */
export interface ActivityAreaSlot {
  slotId: string;
  label: string;
  iconName: string;
  assignedWorkerName?: string | null;
  assignedWorkerAvatarUrl?: string | null;
  visualVariant: VerbVisualVariant;
  mapSlotLabel?: string;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  canAcceptDrop?: boolean;
  isCycleControl?: boolean;
}

/**
 * Collection of callbacks surfaced by {@link ActivityArea}. The parent
 * orchestrates scheduler actions, so handlers simply receive identifiers.
 */
export interface ActivityAreaHandlers {
  onWorkerDrop: (slotId: string, residentId: string | null) => void;
  onInspect: (slotId: string) => void;
  onToggleCycle: () => void;
  onLocationInspect: () => void;
  onLocationDragEnter: (residentId: string | null) => void;
  onLocationDragLeave: () => void;
  onLocationDrop: (residentId: string) => void;
  onSlotResidentDragEnter?: (slotId: string, residentId: string) => void;
  onSlotResidentDragLeave?: (slotId: string) => void;
}

/**
 * Props consumed by {@link ActivityArea}. All domain calculations happen
 * upstream, keeping this component purely presentational.
 */
export interface ActivityAreaProps {
  slots: ActivityAreaSlot[];
  isDayPhase: boolean;
  cycleProgressFraction: number;
  cycleElapsedSeconds: number;
  secondsPerTimeUnit: number;
  draggingResidentId: string | null;
  slotDropStates: Record<string, LocationDropState>;
  locationDropState: LocationDropState;
  handlers: ActivityAreaHandlers;
  locationTitle?: string;
  locationDescription?: string;
  /**
   * Optional slot identifier that should render its highlight state even without drag interactions.
   */
  selectedSlotId?: string | null;
  /**
   * Enables selection highlighting when {@link selectedSlotId} is provided.
   * Primarily used by the tap-first worker picker to mirror bloom state.
   */
  highlightSelectedSlot?: boolean;
  /**
   * Candidates for inline resident picker.
   */
  residentsCandidates?: ResidentAssignmentCandidate[];
  /**
   * Callback for assigning resident from picker.
   */
  onAssign?: (residentId: string) => void;
  /**
   * Callback for closing picker.
   */
  onClose?: () => void;
  /**
   * Callback for inspecting resident details.
   */
  onInspectResident?: (residentId: string) => void;
  /**
   * Callback for slot click to open picker.
   */
  onSlotClick?: (slotId: string) => void;
  /**
   * Optional layout variant for spacing and stacking.
   */
  layout?: 'board' | 'stacked';
  /**
   * Callback for slot hover start.
   */
  onSlotHoverStart?: (slotId: string) => void;
  /**
   * Callback for slot hover end.
   */
  onSlotHoverEnd?: () => void;
}

/**
 * Formats elapsed seconds into mm:ss for compact labels.
 */
const formatSeconds = (value: number): string => {
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Grid that groups the primary activity slots and the active location card.
 * Inputs are config-first view models so the component can stay presentational.
 */
const ActivityArea: React.FC<ActivityAreaProps> = ({
  slots,
  isDayPhase,
  cycleProgressFraction,
  cycleElapsedSeconds,
  secondsPerTimeUnit,
  draggingResidentId,
  slotDropStates,
  locationDropState,
  handlers,
  locationTitle = 'Luogo attivo',
  locationDescription = 'Trascina un residente per aprire gli slot compatibili.',
  selectedSlotId = null,
  highlightSelectedSlot = false,
  residentsCandidates,
  onAssign,
  onClose,
  onInspectResident,
  onSlotClick,
  layout = 'board',
  onSlotHoverStart,
  onSlotHoverEnd,
}) => {
  const cyclePercentage = Math.round(cycleProgressFraction * 100);
  const cycleDurationLabel = formatSeconds(cycleElapsedSeconds);
  const timeUnitLabel = `${secondsPerTimeUnit}s per TU`;

  const hasSlots = slots.length > 0;

  const sortedSlots = useMemo(
    () =>
      [...slots].sort((a: ActivityAreaSlot, b: ActivityAreaSlot) => {
        if (a.isCycleControl && !b.isCycleControl) return -1;
        if (!a.isCycleControl && b.isCycleControl) return 1;
        return a.label.localeCompare(b.label);
      }),
    [slots],
  );

  const layoutClassNames =
    layout === 'stacked'
      ? 'space-y-3'
      : 'space-y-4';

  const slotContainerClassNames =
    layout === 'stacked'
      ? 'flex flex-col gap-3'
      : 'flex flex-wrap items-start gap-6';

  return (
    <TooltipProvider testId="activity-area-tooltip-provider">
      <section
        className={clsx(
          'rounded-3xl border border-white/10 bg-black/60 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur',
        layoutClassNames,
      )}
      data-testid="activity-area"
      role="region"
      aria-label="Activity area"
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Attività</p>
          <p className="text-[11px] text-slate-500">{timeUnitLabel}</p>
        </div>
        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
          Ciclo · {cyclePercentage}% · {cycleDurationLabel}
        </div>
      </div>

      {hasSlots ? (
        <div className={slotContainerClassNames}>
          {sortedSlots.map((slot) => {
            const rawDropState = slotDropStates[slot.slotId] ?? 'idle';
            const isCycleControl = Boolean(slot.isCycleControl);
            const slotDropState: DropState = isCycleControl ? 'idle' : rawDropState;
            const label =
              slot.mapSlotLabel && !isCycleControl ? `${slot.label} · ${slot.mapSlotLabel}` : slot.label;
            const canAcceptDrop =
              isCycleControl ? false : slot.canAcceptDrop ?? rawDropState === 'valid';
            const isLockedByPhase = !isDayPhase && !isCycleControl;
            const isSelected = highlightSelectedSlot && !isCycleControl && selectedSlotId === slot.slotId;

            const showPicker =
              !isCycleControl &&
              highlightSelectedSlot &&
              selectedSlotId === slot.slotId &&
              Boolean(residentsCandidates?.length && onAssign && onClose);

            return (
              <React.Fragment key={slot.slotId}>
                {/* ActivitySlotCard component removed - needs replacement */}
                {/* <ActivitySlotCard
                  slotId={slot.slotId}
                  iconName={slot.iconName}
                  label={label}
                  assignedWorkerName={slot.assignedWorkerName ?? undefined}
                  assignedWorkerAvatarUrl={slot.assignedWorkerAvatarUrl ?? undefined}
                  progressFraction={slot.progressFraction}
                  elapsedSeconds={slot.elapsedSeconds}
                  totalDuration={slot.totalDurationSeconds}
                  isInteractive
                  dropState={slotDropState}
                  canAcceptDrop={canAcceptDrop && !isLockedByPhase}
                  visualVariant={slot.visualVariant}
                  isLockedByPhase={isLockedByPhase}
                  isSelected={isSelected}
                  testId={`activity-slot-${slot.slotId}`}
                  onWorkerDrop={(workerId: string | null) => {
                    if (isCycleControl) {
                      return;
                    }
                    handlers.onWorkerDrop(slot.slotId, workerId);
                  }}
                  onInspect={
                    isCycleControl
                      ? undefined
                      : () => {
                          handlers.onInspect(slot.slotId);
                        }
                  }
                  onClick={
                    isCycleControl
                      ? handlers.onToggleCycle
                      : onSlotClick
                      ? () => onSlotClick(slot.slotId)
                      : undefined
                  }
                  onResidentDragEnter={isCycleControl ? undefined : handlers.onSlotResidentDragEnter}
                  onResidentDragLeave={isCycleControl ? undefined : handlers.onSlotResidentDragLeave}
                  onMouseEnter={() => onSlotHoverStart?.(slot.slotId)}
                  onMouseLeave={onSlotHoverEnd}
                  data-sandbox-interaction-slot={slot.slotId}
                /> */}
                {showPicker && residentsCandidates && onAssign && onClose && (
                  <InlineResidentChips
                    isOpen
                    slotMeta={{
                      slotId: slot.slotId,
                      label: slot.label,
                      activityLabel: slot.mapSlotLabel,
                      iconName: slot.iconName,
                    }}
                    residents={residentsCandidates}
                    onAssign={onAssign}
                    onClose={onClose}
                    onInspectResident={onInspectResident}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-slate-400">
          Nessuna attività disponibile in questo momento.
        </p>
      )}

      <div className="space-y-3">
        <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{locationTitle}</div>
        <LocationCard
          title={locationTitle}
          description={locationDescription}
          dropState={locationDropState}
          onInspect={handlers.onLocationInspect}
          onResidentDragEnter={handlers.onLocationDragEnter}
          onResidentDragLeave={handlers.onLocationDragLeave}
          onResidentDrop={handlers.onLocationDrop}
          isLockedByPhase={!isDayPhase}
          testId="location-card"
        />
        {draggingResidentId && (
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
            Trascinando: <span className="text-amber-200">{draggingResidentId}</span>
          </p>
        )}
      </div>
    </section>
    </TooltipProvider>
  );
};

export default ActivityArea;

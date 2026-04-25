import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { QuestDefinition, QuestState } from '@/engine/quest/types';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import type { ActivitySlotCardProps, DropState } from '@/ui/idleVillage/components/ActivitySlot';
import ActivityActionCard from '@/ui/idleVillage/components/ActivityActionCard';
import QuestBranchDiagram from '@/ui/idleVillage/components/QuestBranchDiagram';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import { deriveTheaterRiskStripes } from '@/ui/idleVillage/theater/riskStripes';
import ResidentSlotRack, { type ResidentSlotRackProps } from '@/ui/idleVillage/components/ResidentSlotRack';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ResidentSlotControllerOptions } from '@/ui/idleVillage/slots/types';
import theaterPlaceholder from '@/assets/ui/idleVillage/panorama-hotspring.jpg';

/**
 * Props for the compact theater-style overlay that previews the currently selected slot.
 */
export interface TheaterJobCardPreview {
  id: string;
  slotId: string;
  label: string;
  icon?: ReactNode;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  isPlaying: boolean;
}

/**
 * Props for the compact location detail overlay that shows activities and allows resident assignment.
 */
export interface LocationDetailProps {
  slotLabel: string;
  slotIcon?: string;
  verbs: VerbSummary[];
  onClose: () => void;
  acceptResidentDrop?: boolean;
  onResidentDrop?: (residentId: string | null) => void;
  onAssignResident?: (slotId: string, residentId: string | null) => void;
  slotDropStates?: Record<string, DropState>;
  slotCards?: ActivitySlotCardProps[];
  rackSources?: TheaterRackSource[];
  onVerbDrop?: (verb: VerbSummary, residentId: string | null) => void;
  jobCards?: TheaterJobCardPreview[];
  onJobCardClick?: (slotId: string) => void;
  onQuestCardClick?: (activityId?: string | null) => void;
  /** Optional quest blueprint + state for rendering a branching diagram */
  questDefinition?: QuestDefinition;
  questState?: QuestState;
}

/** Data source used to render ResidentSlotRack rails inside the Theater view. */
export interface TheaterRackSource {
  /** Stable identifier for this rack (activity or slot id). */
  id: string;
  /** Primary label shown above the rack (typically the activity name). */
  title: string;
  /** Optional subtitle (map slot label or contextual note). */
  subtitle?: string;
  /** Controller options powering this rack. */
  controller: ResidentSlotControllerOptions;
  /** Optional icon/label resolver for the rack’s slots. */
  resolveDisplayInfo?: ResidentSlotRackProps['resolveDisplayInfo'];
  /** Overflow policy for this rail (default: scroll). */
  overflow?: ResidentSlotRackProps['overflowBehavior'];
}

interface TheaterRackRailProps {
  source: TheaterRackSource;
  scale: number;
}

const RAIL_LABEL_CLASS =
  'text-[9px] uppercase tracking-[0.28em] text-amber-200/70 text-center whitespace-nowrap';

/**
 * Single rack renderer bridging ResidentSlotController with ResidentSlotRack.
 */
const TheaterRackRail: React.FC<TheaterRackRailProps> = ({ source, scale }) => {
  const { controller, resolveDisplayInfo, overflow = 'scroll', title, subtitle, id } = source;

  const rackController = useResidentSlotController(controller);
  const { slots, assignResidentToSlot, clearSlot, getSlotProgress } = rackController;

  const handleSlotDrop = useCallback<NonNullable<ResidentSlotRackProps['onSlotDrop']>>(
    (slotId, residentId) => {
      if (!residentId) {
        clearSlot(slotId);
        return;
      }
      assignResidentToSlot(residentId, slotId);
    },
    [assignResidentToSlot, clearSlot],
  );

  const handleSlotClear = useCallback<NonNullable<ResidentSlotRackProps['onSlotClear']>>(
    (slotId) => clearSlot(slotId),
    [clearSlot],
  );

  const scaledStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: `scale(${scale})`,
      transformOrigin: 'center top',
    }),
    [scale],
  );

  return (
    <div
      key={id}
      className="flex min-w-28 flex-col items-center gap-1 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 shadow-inner shadow-black/40"
    >
      <p className={RAIL_LABEL_CLASS}>{title}</p>
      {subtitle && <p className="text-[8px] uppercase tracking-[0.2em] text-slate-400">{subtitle}</p>}
      <div style={scaledStyle} className="w-max">
        <ResidentSlotRack
          slots={slots}
          layout="board"
          overflowBehavior={overflow ?? 'scroll'}
          getSlotProgress={getSlotProgress}
          resolveDisplayInfo={resolveDisplayInfo}
          onSlotDrop={handleSlotDrop}
          onSlotClear={handleSlotClear}
        />
      </div>
    </div>
  );
};

/**
 * Compact overlay showing a set of ActivitySlot previews for the inspected location.
 */
const LocationDetail: React.FC<LocationDetailProps> = ({
  slotLabel,
  slotIcon,
  verbs,
  onClose,
  acceptResidentDrop = false,
  onResidentDrop,
  onAssignResident: _onAssignResident,
  slotDropStates,
  slotCards,
  rackSources,
  onVerbDrop,
  jobCards,
  onJobCardClick,
  onQuestCardClick: _onQuestCardClick,
  questDefinition,
  questState,
}) => {
  // Extract telemetry for use in ActivityActionCard risk data
  // __questTelemetry and questChronicleBridge removed as they were unused

  const THEATER_HEIGHT = '34vh';
  const ACTIVITY_SLOT_BASE_PX = 112; // Tailwind h-28
  const ACTIVITY_SCALE = 0.45;
  const ACTIVITY_ROW_PADDING = 8;
  const ACTIVITY_ROW_HEIGHT = ACTIVITY_SLOT_BASE_PX * ACTIVITY_SCALE + ACTIVITY_ROW_PADDING * 2;
  const panoramaHeight = `calc(${THEATER_HEIGHT} - ${ACTIVITY_ROW_HEIGHT}px)`;
  const activitiesHeight = `${ACTIVITY_ROW_HEIGHT}px`;
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (event: PointerEvent) => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        const dx = event.clientX - pointerOriginRef.current.x;
        const dy = event.clientY - pointerOriginRef.current.y;
        setPosition({
          x: dragOriginRef.current.x + dx,
          y: dragOriginRef.current.y + dy,
        });
        rafRef.current = null;
      });
    };
    const handlePointerUp = () => {
      setIsDragging(false);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const isDragHandleTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('[data-theater-drag-handle="true"]'));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    if (!isDragHandleTarget(event.target)) return;
    event.preventDefault();
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    dragOriginRef.current = { ...position };
    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!acceptResidentDrop || !onResidentDrop) return;
    event.preventDefault();
    if (!isDragOver) {
      setIsDragOver(true);
    }
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = () => {
    if (!acceptResidentDrop || !isDragOver) return;
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!acceptResidentDrop || !onResidentDrop) return;
    event.preventDefault();
    setIsDragOver(false);
    const residentId =
      event.dataTransfer.getData(RESIDENT_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
    onResidentDrop(residentId);
  };

  return (
    <>
      {/* Sfondo esterno più morbido */}
      <div
        className="pointer-events-none fixed inset-0 z-30 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.6)_120%)] transition-opacity duration-500"
        style={{ opacity: isMounted ? 1 : 0 }}
      />
      
      <div
        className={[
          'absolute left-1/2 top-8 z-999 w-[85%] max-w-136 rounded-3xl obsidian-panel transition-all duration-200 ease-out border border-white/10',
          isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
          isDragOver ? 'ring-4 ring-amber-300/50 shadow-[0_0_55px_rgba(251,191,36,0.45)]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          minHeight: THEATER_HEIGHT,
          transform: `translate(-50%, 0) translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : undefined,
          backgroundColor: 'rgba(20, 20, 25, 0.95)',
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPointerDown={handlePointerDown}
      >
        <div className="flex h-full flex-col gap-3 px-4 py-3">
          {/* PANORAMA AREA */}
          <div
            className={`relative z-0 w-full overflow-hidden rounded-[28px] shadow-[0_18px_35px_rgba(0,0,0,0.45)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            data-theater-drag-handle="true"
            style={{ height: panoramaHeight, flex: `0 0 ${panoramaHeight}` }}
          >
            <img
              src={theaterPlaceholder}
              alt="Panorama"
              className="h-full w-full object-cover"
              style={{ minHeight: panoramaHeight }}
            />
            {/* Overlay immagine alleggerito */}
            <div className="absolute inset-0 rounded-2xl border border-amber-100/10 bg-linear-to-t from-black/30 via-transparent to-transparent shadow-inner shadow-black/20" />
            
            {/* Header Info */}
            <div className="pointer-events-none absolute top-4 left-4 right-4 z-20">
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/30 px-4 py-2 backdrop-blur-md">
                <p className="text-lg font-semibold tracking-[0.2em] text-amber-50">{slotLabel}</p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Chiudi Location Detail"
                  className="pointer-events-auto rounded-full border border-white/20 bg-black/40 p-2 text-ivory transition hover:border-rose-300/70 hover:text-rose-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVITIES AREA */}
          <div
            className="relative flex flex-none items-center justify-center"
            style={{ height: activitiesHeight, flex: `0 0 ${activitiesHeight}` }}
          >
            <div className="relative z-20 flex w-full items-center justify-center gap-6 overflow-x-auto px-5 py-2">
              {rackSources && rackSources.length > 0
                ? rackSources.map((source) => (
                    <TheaterRackRail key={source.id} source={source} scale={ACTIVITY_SCALE} />
                  ))
                : slotCards && slotCards.length > 0
                  ? slotCards.map((card) => {
                      const handleClick =
                        card.onClick ??
                        (card.onInspect ? () => card.onInspect?.(card.slotId) : undefined);
                      return (
                        <div key={card.slotId} style={{ transform: `scale(${ACTIVITY_SCALE})`, transformOrigin: 'center' }}>
                          <ActivityActionCard
                            slotId={card.slotId}
                            label={card.label}
                            icon={card.iconName}
                            visualVariant={card.visualVariant}
                            assignedResidentName={card.assignedWorkerName ?? null}
                            progressFraction={card.progressFraction}
                            elapsedSeconds={card.elapsedSeconds}
                            totalDurationSeconds={card.totalDuration}
                            dropState={card.dropState}
                            canAcceptDrop={card.canAcceptDrop}
                            disabled={card.isLockedByPhase}
                            onClick={handleClick}
                            onWorkerDrop={card.onWorkerDrop}
                            onMouseEnter={card.onMouseEnter}
                            onMouseLeave={card.onMouseLeave}
                          />
                        </div>
                      );
                    })
                  : jobCards && jobCards.length > 0
                    ? jobCards.map((card) => (
                        <div key={card.id} style={{ transform: `scale(${ACTIVITY_SCALE})`, transformOrigin: 'center' }}>
                          <ActivityActionCard
                            slotId={card.slotId}
                            label={card.label}
                            icon={card.icon ?? slotIcon ?? '⚒️'}
                            progressFraction={card.progressFraction}
                            elapsedSeconds={card.elapsedSeconds}
                            totalDurationSeconds={card.totalDurationSeconds}
                            variant="detail"
                            ctaLabel="Apri"
                            visualVariant="ember"
                            onClick={() => onJobCardClick?.(card.slotId)}
                          />
                        </div>
                      ))
                    : verbs.map((verb) => {
                      const dropStateKey = verb.slotId ?? verb.key;
                      const dropState = slotDropStates?.[dropStateKey] ?? 'idle';
                      const canAccept = dropState !== 'invalid';
                      const totalDuration = verb.totalDurationSeconds || verb.remainingSeconds || 0;

                    // Determine heroic feedback for quest activities
                    const heroicFeedback = (() => {
                      if (!verb.isQuest || verb.progressFraction < 1) return undefined;

                      const snapshotDeathRisk = verb.scheduled?.snapshotDeathRisk;
                      const hasDeathRisk = typeof snapshotDeathRisk === 'number' && snapshotDeathRisk > 0;

                      const survivorsExist = (verb.assigneeNames?.length ?? 0) > 0;

                      if (hasDeathRisk && survivorsExist) {
                        return {
                          showBadge: true,
                          label: 'Heroic',
                        };
                      }

                      return undefined;
                    })();

                    const riskStripeMetrics =
                      verb.riskStripeMetrics ??
                      deriveTheaterRiskStripes({
                        injuryPercentage: verb.injuryPercentage ?? 0,
                        deathPercentage: verb.deathPercentage ?? 0,
                      });

                    return (
                      <div
                        key={verb.key}
                        style={{ transform: `scale(${ACTIVITY_SCALE})`, transformOrigin: 'center' }}
                        data-injury-percent={riskStripeMetrics.injuryPercent}
                        data-death-percent={riskStripeMetrics.deathPercent}
                        data-has-risk={riskStripeMetrics.hasRisk ? 'true' : 'false'}
                      >
                        <ActivityActionCard
                          slotId={verb.slotId ?? verb.key}
                          label={verb.label}
                          icon={verb.icon ?? slotIcon ?? '◎'}
                          visualVariant={verb.visualVariant}
                          assignedResidentName={verb.assigneeNames?.[0] ?? null}
                          progressFraction={verb.progressFraction}
                          elapsedSeconds={verb.elapsedSeconds}
                          totalDurationSeconds={totalDuration}
                          dropState={dropState}
                          canAcceptDrop={canAccept}
                          onWorkerDrop={
                            canAccept && onVerbDrop
                              ? (residentId) => onVerbDrop(verb, residentId)
                              : undefined
                          }
                          riskPercentages={{
                            injury: riskStripeMetrics.injuryPercent,
                            death: riskStripeMetrics.deathPercent,
                          }}
                          riskStripeMetrics={riskStripeMetrics}
                          heroicFeedback={heroicFeedback}
                        />
                      </div>
                    );
                    })}
            </div>
          </div>

          {/* QUEST BRANCH DIAGRAM */}
          {questDefinition && questState && (
            <div className="border-t border-white/10 pt-3">
              <QuestBranchDiagram quest={questDefinition} questState={questState} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
;

export default LocationDetail;

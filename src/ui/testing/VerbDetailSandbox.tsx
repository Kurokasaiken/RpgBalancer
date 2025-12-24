import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  pointerWithin,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { VERB_SANDBOX_PRESET } from '@/balancing/config/idleVillage/presets/verbSandboxPreset';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import VerbCard, { type VerbVisualVariant, type ProgressStyle } from '@/ui/idleVillage/VerbCard';
import MarbleCard from '@/ui/fantasy/assets/marble-verb-card/MarbleCard';
import MapMarker from '@/ui/idleVillage/MapMarker';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import VerbDetailCard, {
  type VerbDetailPreview,
  type VerbDetailAssignment,
  type VerbSlotState,
} from '@/ui/idleVillage/VerbDetailCard';

const CARD_VARIANTS: {
  icon: string;
  variant: VerbVisualVariant;
  progressStyle: ProgressStyle;
  label: string;
}[] = [
  { icon: '⚔️', variant: 'azure', progressStyle: 'border', label: 'Azure · Border' },
  { icon: '🔥', variant: 'ember', progressStyle: 'ribbon', label: 'Ember · Ribbon' },
  { icon: '🌿', variant: 'jade', progressStyle: 'border', label: 'Jade · Border' },
  { icon: '🔮', variant: 'amethyst', progressStyle: 'ribbon', label: 'Amethyst · Ribbon' },
  { icon: '☀️', variant: 'solar', progressStyle: 'border', label: 'Solar · Border' },
];

const SANDBOX_MARKER_VERB: VerbSummary = {
  key: 'sandbox_marker_demo',
  source: 'system',
  slotId: 'sandbox_marker_slot',
  label: 'Aquila Patrol',
  kindLabel: 'Map Task',
  isQuest: false,
  isJob: true,
  icon: '🜂',
  visualVariant: 'solar',
  progressStyle: 'border',
  progressFraction: 0.35,
  elapsedSeconds: 18,
  totalDurationSeconds: 60,
  remainingSeconds: 42,
  injuryPercentage: 0,
  deathPercentage: 0,
  assignedCount: 1,
  totalSlots: 3,
  rewardLabel: null,
  tone: 'system',
  deadlineLabel: '3m',
  assigneeNames: [],
  riskLabel: null,
  notes: null,
};

const VERB_DURATION_SECONDS = 48;
type DropState = 'idle' | 'valid' | 'invalid';

function DraggableResidentToken({ resident }: { resident: ResidentState }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `resident-${resident.id}`,
    data: { residentId: resident.id },
    disabled: resident.status !== 'available',
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const disabled = resident.status !== 'available';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        disabled ? 'border-slate-800 text-slate-500 cursor-not-allowed opacity-40' : 'border-slate-600 text-slate-100 bg-slate-900/70 cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-0' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {resident.id}
    </div>
  );
}

export default function VerbDetailSandbox() {
  const { config } = useIdleVillageConfig();
  const residentPool = useMemo<ResidentState[]>(() => {
    return VERB_SANDBOX_PRESET.residents.map((preset) => ({
      id: preset.id,
      displayName: preset.id,
      status: preset.status,
      fatigue: preset.fatigue,
      statTags: preset.statTags,
      currentHp: 100,
      maxHp: 100,
      isHero: false,
      isInjured: false,
      survivalCount: 0,
      survivalScore: 0,
    }));
  }, []);
  const initialSlots = useMemo<VerbSlotState[]>(
    () =>
      VERB_SANDBOX_PRESET.slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        required: slot.required,
        statHint: slot.hint,
        requirement: slot.requirement,
        requirementLabel: slot.requirement?.label,
        assignedResidentId: null,
      })),
    [],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const firstAvailable = residentPool.find((resident) => resident.status === 'available');
    return firstAvailable ? [firstAvailable.id] : [];
  });
  const [slots, setSlots] = useState<VerbSlotState[]>(initialSlots);
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [cardDropState, setCardDropState] = useState<DropState>('idle');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const dropFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cardDropNode, setCardDropNode] = useState<HTMLDivElement | null>(null);

  const pushDebug = useCallback((message: string) => {
    setDebugLog((prev) => [message, ...prev].slice(0, 30));
  }, []);

  useEffect(() => {
    if (!isActive) return undefined;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= VERB_DURATION_SECONDS) {
          clearInterval(timer);
          setIsActive(false);
          return VERB_DURATION_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  const sandboxActivity: ActivityDefinition | undefined = config.activities[VERB_SANDBOX_PRESET.activityId];
  const activitySlotLabel = useMemo(() => {
    if (!sandboxActivity) return VERB_SANDBOX_PRESET.slotLabel ?? 'Unknown Slot';
    const meta = (sandboxActivity.metadata ?? {}) as { mapSlotId?: string };
    if (meta?.mapSlotId && config.mapSlots[meta.mapSlotId]) {
      return config.mapSlots[meta.mapSlotId].label;
    }
    return VERB_SANDBOX_PRESET.slotLabel ?? 'Village Slot';
  }, [config.mapSlots, sandboxActivity]);
  const preview: VerbDetailPreview = useMemo(() => {
    const meta = (sandboxActivity?.metadata ?? {}) as { injuryChanceDisplay?: number; deathChanceDisplay?: number };
    return {
      rewards: sandboxActivity?.rewards ?? [],
      injuryPercentage: meta?.injuryChanceDisplay ?? 0,
      deathPercentage: meta?.deathChanceDisplay ?? 0,
    };
  }, [sandboxActivity]);

  const assignments: VerbDetailAssignment[] = residentPool.map((resident) => ({
    resident,
    isSelected: selectedIds.includes(resident.id),
    onToggle: (residentId: string) => {
      setSelectedIds((prev) =>
        prev.includes(residentId) ? prev.filter((id) => id !== residentId) : [...prev, residentId],
      );
    },
  }));

  const clearDropFeedback = useCallback(() => {
    if (dropFeedbackTimeoutRef.current) {
      clearTimeout(dropFeedbackTimeoutRef.current);
      dropFeedbackTimeoutRef.current = null;
    }
  }, []);

  const setDropFeedback = useCallback(
    (state: DropState, duration = 800, reason?: string) => {
      clearDropFeedback();
      setCardDropState(state);
      if (state !== 'idle') {
        pushDebug(reason ?? `Drop feedback: ${state.toUpperCase()}`);
      }
      if (state === 'idle') return;
      dropFeedbackTimeoutRef.current = setTimeout(() => {
        setCardDropState('idle');
        dropFeedbackTimeoutRef.current = null;
      }, duration);
    },
    [clearDropFeedback, pushDebug],
  );

  useEffect(() => () => clearDropFeedback(), [clearDropFeedback]);

  const startVerbRun = useCallback(() => {
    if (isActive) return;
    setElapsedSeconds(0);
    setIsActive(true);
    setIsDetailOpen(false);
    pushDebug('Verb started automatically (all required slots filled)');
  }, [isActive, pushDebug]);

  const requiredSatisfied = useMemo(
    () => slots.every((slot) => !slot.required || Boolean(slot.assignedResidentId)),
    [slots],
  );

  const handleSlotClear = useCallback((slotId: string) => {
    setSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, assignedResidentId: null } : slot)));
  }, []);

  const findAutoSlotId = useCallback(
    (currentSlots: VerbSlotState[]) => {
      const requiredEmpty = currentSlots.find((slot) => slot.required && !slot.assignedResidentId);
      if (requiredEmpty) return requiredEmpty.id;
      const optionalEmpty = currentSlots.find((slot) => !slot.assignedResidentId);
      return optionalEmpty?.id ?? null;
    },
    [],
  );

  const assignResidentToSlot = useCallback(
    (residentId: string, targetSlotId?: string | null) => {
      if (isActive) {
        setDropFeedback('invalid', 800, `Drop rejected: verb already running (resident ${residentId})`);
        return;
      }

      const intendedSlotId = targetSlotId ?? findAutoSlotId(slots);
      if (!intendedSlotId) {
        setDropFeedback('invalid', 800, `Drop rejected: no empty slots available for ${residentId}`);
        return;
      }

      const targetSlot = slots.find((slot) => slot.id === intendedSlotId);
      if (!targetSlot) {
        setDropFeedback('invalid', 800, `Drop rejected: unknown slot ${intendedSlotId} for ${residentId}`);
        return;
      }

      const resident = residentPool.find((r) => r.id === residentId);
      if (!resident) {
        setDropFeedback('invalid', 800, `Drop rejected: resident ${residentId} not found`);
        return;
      }

      const match = evaluateStatRequirement(resident, targetSlot.requirement);
      if (!match.matches) {
        setDropFeedback('invalid', 800, `Drop rejected: ${residentId} does not meet requirement for ${targetSlot.label}`);
        return;
      }

      const nextSlots = slots.map((slot) => {
        if (slot.id === intendedSlotId) {
          return { ...slot, assignedResidentId: residentId };
        }
        if (slot.assignedResidentId === residentId && slot.id !== intendedSlotId) {
          return { ...slot, assignedResidentId: null };
        }
        return slot;
      });

      setSlots(nextSlots);
      setSelectedIds((prev) => (prev.includes(residentId) ? prev : [...prev, residentId]));

      const newlySatisfied = nextSlots.every((slot) => !slot.required || Boolean(slot.assignedResidentId));
      setDropFeedback('valid', newlySatisfied ? 400 : 700, `Drop accepted for slot ${targetSlot.label}`);

      pushDebug(`Assigned ${residentId} to slot ${targetSlot.label}`);

      if (newlySatisfied) {
        startVerbRun();
      }
    },
    [findAutoSlotId, isActive, pushDebug, residentPool, setDropFeedback, slots, startVerbRun],
  );

  const deriveFallbackSlot = useCallback(
    (event: DragEndEvent) => {
      if (!cardDropNode) return null;
      const dragRect =
        event.active.rect.current?.translated ?? event.active.rect.current?.initial ?? undefined;
      if (!dragRect) return null;
      const dropRect = cardDropNode.getBoundingClientRect();
      const intersects =
        dragRect.right > dropRect.left &&
        dragRect.left < dropRect.right &&
        dragRect.bottom > dropRect.top &&
        dragRect.top < dropRect.bottom;
      if (intersects) {
        pushDebug(
          `Fallback match: dragRect[x:${Math.round(dragRect.left)},y:${Math.round(dragRect.top)},w:${Math.round(dragRect.width)},h:${Math.round(dragRect.height)}] intersects VerbCard[x:${Math.round(dropRect.left)},y:${Math.round(dropRect.top)},w:${Math.round(dropRect.width)},h:${Math.round(dropRect.height)}]`,
        );
        return 'verb_card_main';
      }
      pushDebug(
        `Fallback miss: dragRect[x:${Math.round(dragRect.left)},y:${Math.round(dragRect.top)}] does not intersect VerbCard`,
      );
      return null;
    },
    [cardDropNode, pushDebug],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const residentId = event.active?.data?.current?.residentId as string | undefined;
      const slotId =
        (event.over?.data?.current?.slotId as string | undefined) ?? deriveFallbackSlot(event);
      if (!residentId || !slotId) {
        pushDebug('Drag ended without valid resident/slot id');
        return;
      }
      if (slotId === 'verb_card_main') {
        pushDebug(`Drop attempt: ${residentId} onto verb card`);
        assignResidentToSlot(residentId, null);
        return;
      }
      pushDebug(`Drop attempt: ${residentId} -> ${slotId}`);
      assignResidentToSlot(residentId, slotId);
    },
    [assignResidentToSlot, deriveFallbackSlot, pushDebug],
  );

  const handleManualStart = useCallback(() => {
    if (!requiredSatisfied || isActive) {
      if (!isActive) {
        setDropFeedback('invalid', 800, 'Manual start blocked: required slots missing');
      }
      return;
    }
    setDropFeedback('valid', 500, 'Manual start triggered');
    startVerbRun();
  }, [isActive, requiredSatisfied, setDropFeedback, startVerbRun]);

  const assignedNames = slots
    .map((slot) => slot.assignedResidentId)
    .filter(Boolean) as string[];
  const progressFraction = isActive ? Math.min(1, elapsedSeconds / VERB_DURATION_SECONDS) : 0;

  const { isOver: isHoveringCard, setNodeRef: cardBaseRef } = useDroppable({
    id: 'verb_card_main',
    data: { slotId: 'verb_card_main' },
  });
  const handleCardDropRef = useCallback(
    (node: HTMLDivElement | null) => {
      setCardDropNode((prev) => {
        if (node && node !== prev) {
          const rect = node.getBoundingClientRect();
          pushDebug(
            `VerbCard drop zone mounted (w:${rect.width.toFixed(1)} h:${rect.height.toFixed(1)} x:${Math.round(rect.left)}, y:${Math.round(rect.top)})`,
          );
        } else if (!node && prev) {
          pushDebug('VerbCard drop zone unmounted');
        }
        return node;
      });
      cardBaseRef(node);
    },
    [cardBaseRef, pushDebug],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const residentId = event.active?.data?.current?.residentId as string | undefined;
      pushDebug(`Drag start: ${residentId ?? 'unknown resident'}`);
      setCardDropState('idle');
    },
    [pushDebug],
  );

  const lastOverIdRef = useRef<string | null>(null);
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const residentId = event.active?.data?.current?.residentId as string | undefined;
      const overId = event.over?.id?.toString() ?? null;
      if (lastOverIdRef.current !== overId) {
        const label = overId ?? 'no target';
        const pointer = event.over?.rect ?? cardDropNode?.getBoundingClientRect();
        const pointerInfo = pointer
          ? `rect[x:${Math.round(pointer.left)},y:${Math.round(pointer.top)},w:${Math.round(pointer.width)},h:${Math.round(pointer.height)}]`
          : 'rect:unknown';
        pushDebug(`Drag over: ${residentId ?? 'unknown'} hovering ${label} (${pointerInfo})`);
        lastOverIdRef.current = overId;
      }
    },
    [cardDropNode, pushDebug],
  );

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isHoveringCard) {
      hoverTimerRef.current = setTimeout(() => {
        setIsDetailOpen(true);
      }, 1000); // Changed from 600ms to 1000ms
    } else if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, [isHoveringCard]);

  const shouldShowDetail = isDetailOpen;

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="observatory-page">
        <div className="observatory-bg-orbits">
          <div className="observatory-bg-orbit-left" />
          <div className="observatory-bg-orbit-right" />
        </div>

        <div className="observatory-shell space-y-6">
          <header className="text-center space-y-2 sm:text-left">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Verb Detail Sandbox</p>
            <p className="text-[10px] text-slate-400 max-w-2xl">
              Gilded Observatory harness for verb tests. Trascina i residenti, osserva slot, timer e log in tempo
              reale senza uscire dal tema Balancer.
            </p>
          </header>

          <div className="grid gap-5">
            <section className="default-card flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <span className="text-[9px] uppercase tracking-[0.32em] text-slate-500">Verb Card Variants</span>
                <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-100">
                  Visual exploration
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {CARD_VARIANTS.map(({ icon, variant, progressStyle, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3"
                  >
                    <VerbCard
                      icon={icon}
                      progressFraction={variant === 'ember' ? 0.65 : variant === 'jade' ? 0.35 : variant === 'amethyst' ? 0.85 : 0.15}
                      elapsedSeconds={variant === 'ember' ? 32 : variant === 'jade' ? 12 : variant === 'amethyst' ? 41 : 4}
                      totalDuration={VERB_DURATION_SECONDS}
                      injuryPercentage={variant === 'ember' ? 25 : variant === 'jade' ? 10 : 5}
                      deathPercentage={variant === 'ember' ? 8 : variant === 'amethyst' ? 12 : 2}
                      assignedCount={variant === 'solar' ? 1 : variant === 'jade' ? 2 : 3}
                      totalSlots={3}
                      isInteractive
                      dropState="idle"
                      visualVariant={variant}
                      progressStyle={progressStyle}
                    />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center">{label}</p>
                  </div>
                ))}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex justify-center">
                      <MarbleCard title="" icon="🌀" progress={0.72} isActive />
                    </div>
                    <div className="flex justify-center sm:justify-end w-full">
                      <div className="scale-150">
                        <MapMarker verb={SANDBOX_MARKER_VERB} isActive />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center">
                    Marble Verb · Map Marker
                  </p>
                </div>
              </div>
            </section>

            <section className="default-card flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <span className="text-[9px] uppercase tracking-[0.32em] text-slate-500">Interactive Card</span>
                <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-100">
                  Verb Progress & Drag Target
                </h2>
              </div>

              <div
                ref={handleCardDropRef}
                className={[
                  'relative flex justify-center rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4 transition-all duration-300',
                  isHoveringCard ? 'ring-2 ring-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.3)]' : 'ring-1 ring-slate-900/80',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <VerbCard
                  data-testid="verb-card"
                  data-slot-id="verb_card_main"
                  icon="⚔️"
                  progressFraction={progressFraction}
                  elapsedSeconds={elapsedSeconds}
                  totalDuration={VERB_DURATION_SECONDS}
                  injuryPercentage={preview.injuryPercentage}
                  deathPercentage={preview.deathPercentage}
                  assignedCount={assignedNames.length}
                  totalSlots={slots.length}
                  isInteractive
                  dropState={cardDropState}
                  onClick={() => setIsDetailOpen(true)}
                />
              </div>

              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/45 p-3 space-y-2">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.25em] text-slate-400">
                  <span>Available Residents</span>
                  <span className="font-mono text-cyan-200">{residentPool.length}</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {residentPool.map((resident) => (
                    <DraggableResidentToken key={resident.id} resident={resident} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-900/70 bg-[#050b0f]/80 p-3 shadow-inner shadow-black/60">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.25em] text-slate-400">
                  <span>Debug Log</span>
                  <span className={cardDropState === 'valid' ? 'text-emerald-300' : cardDropState === 'invalid' ? 'text-rose-400' : 'text-slate-500'}>
                    {cardDropState === 'valid' ? 'Valid drop' : cardDropState === 'invalid' ? 'Rejected' : 'Idle'}
                  </span>
                </div>
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1 font-mono text-[10px] text-cyan-200">
                  {debugLog.length === 0 ? (
                    <div className="text-slate-600">Trascina un residente per generare eventi…</div>
                  ) : (
                    debugLog.map((entry, idx) => (
                      <div
                        key={`${entry}-${idx}`}
                        className="rounded border border-slate-800/60 bg-slate-950/70 px-2 py-1"
                      >
                        {entry}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="default-card min-h-[420px]">
              {shouldShowDetail ? (
                <VerbDetailCard
                  title={sandboxActivity?.label ?? 'Verb Detail'}
                  subtitle="Verb Detail · Exploded view"
                  activity={sandboxActivity ?? ({} as ActivityDefinition)}
                  description={sandboxActivity?.description}
                  slotLabel={activitySlotLabel}
                  preview={preview}
                  assignments={assignments}
                  slots={slots}
                  durationSeconds={VERB_DURATION_SECONDS}
                  elapsedSeconds={elapsedSeconds}
                  isActive={isActive}
                  onStart={handleManualStart}
                  onClose={() => setIsDetailOpen(false)}
                  onSlotClick={handleSlotClear}
                  startDisabled={!requiredSatisfied || isActive}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-[11px] text-slate-400 gap-3">
                  <span className="text-[32px] drop-shadow-[0_0_18px_rgba(129,140,248,0.7)]">🧭</span>
                  <p>Click, hover o trascina sulla Verb Card per aprire la vista dettagliata.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </DndContext>
  );
}


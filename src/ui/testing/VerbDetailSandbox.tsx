import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { VERB_SANDBOX_PRESET } from '@/balancing/config/idleVillage/presets/verbSandboxPreset';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import VerbCard from '@/ui/idleVillage/VerbCard';
import VerbDetailCard, {
  type VerbDetailPreview,
  type VerbDetailAssignment,
  type VerbSlotState,
} from '@/ui/idleVillage/VerbDetailCard';

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
      status: preset.status,
      fatigue: preset.fatigue,
      statTags: preset.statTags,
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
  const dropFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    (state: DropState, duration = 800) => {
      clearDropFeedback();
      setCardDropState(state);
      if (state === 'idle') return;
      dropFeedbackTimeoutRef.current = setTimeout(() => {
        setCardDropState('idle');
        dropFeedbackTimeoutRef.current = null;
      }, duration);
    },
    [clearDropFeedback],
  );

  useEffect(() => () => clearDropFeedback(), [clearDropFeedback]);

  const startVerbRun = useCallback(() => {
    if (isActive) return;
    setElapsedSeconds(0);
    setIsActive(true);
    setIsDetailOpen(false);
  }, [isActive]);

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
        setDropFeedback('invalid');
        return;
      }

      const intendedSlotId = targetSlotId ?? findAutoSlotId(slots);
      if (!intendedSlotId) {
        setDropFeedback('invalid');
        return;
      }

      const targetSlot = slots.find((slot) => slot.id === intendedSlotId);
      if (!targetSlot) {
        setDropFeedback('invalid');
        return;
      }

      const resident = residentPool.find((r) => r.id === residentId);
      if (!resident) {
        setDropFeedback('invalid');
        return;
      }

      const match = evaluateStatRequirement(resident, targetSlot.requirement);
      if (!match.matches) {
        setDropFeedback('invalid');
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
      setDropFeedback('valid', newlySatisfied ? 400 : 700);

      if (newlySatisfied) {
        startVerbRun();
      }
    },
    [findAutoSlotId, isActive, residentPool, setDropFeedback, slots, startVerbRun],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const residentId = event.active?.data?.current?.residentId as string | undefined;
      const slotId = event.over?.data?.current?.slotId as string | undefined;
      if (!residentId || !slotId) return;
      if (slotId === 'verb_card_main') {
        assignResidentToSlot(residentId, null);
        return;
      }
      assignResidentToSlot(residentId, slotId);
    },
    [assignResidentToSlot],
  );

  const handleManualStart = useCallback(() => {
    if (!requiredSatisfied || isActive) {
      if (!isActive) {
        setDropFeedback('invalid');
      }
      return;
    }
    setDropFeedback('valid', 500);
    startVerbRun();
  }, [isActive, requiredSatisfied, setDropFeedback, startVerbRun]);

  const assignedNames = slots
    .map((slot) => slot.assignedResidentId)
    .filter(Boolean) as string[];
  const rewardsLabel = preview.rewards.map((reward) => `${reward.resourceId} ${reward.amountFormula}`).join(' · ');
  const progressFraction = isActive ? Math.min(1, elapsedSeconds / VERB_DURATION_SECONDS) : 0;
  const remainingSeconds = Math.max(0, VERB_DURATION_SECONDS - elapsedSeconds);

  const { isOver: isHoveringCard, setNodeRef: setCardDropRef } = useDroppable({
    id: 'verb_card_main',
    data: { slotId: 'verb_card_main' },
  });

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
  const slotRequirementLabel = `${slots.filter((slot) => slot.required).length} required slots`;
  const assignedLabel = assignedNames.length ? assignedNames.join(', ') : 'No one assigned';

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#030712_0,#010308_60%,#000000_100%)] text-ivory p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="text-center space-y-2">
            <p className="text-[12px] uppercase tracking-[0.3em] text-slate-400">Verb Detail Sandbox</p>
            <p className="text-[11px] text-slate-500">
              Drag residents to slots; observe real-time VerbCard/VerbDetailCard updates.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5 rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-500">
                <span>Verb Window</span>
                <span className="text-slate-400">{sandboxActivity?.tags?.join(' · ')}</span>
              </div>

              <div ref={setCardDropRef}>
                <VerbCard
                  label={sandboxActivity?.label ?? 'Unknown Verb'}
                  icon="⚔️"
                  kindLabel={sandboxActivity?.tags?.includes('quest') ? 'Quest' : sandboxActivity?.tags?.[0] ?? 'Verb'}
                  assignees={assignedNames}
                  rewardsLabel={rewardsLabel}
                  deadlineLabel={`${isActive ? remainingSeconds : VERB_DURATION_SECONDS}s`}
                  riskLabel={`${preview.injuryPercentage}% / ${preview.deathPercentage}%`}
                  progressFraction={progressFraction}
                  state={isActive ? 'running' : 'idle'}
                  isQuest={sandboxActivity?.tags?.includes('quest')}
                  isJob={sandboxActivity?.tags?.includes('job')}
                  tone={sandboxActivity?.tags?.includes('quest') ? 'quest' : sandboxActivity?.tags?.includes('danger') ? 'danger' : undefined}
                  tooltip={sandboxActivity?.description}
                  slotRequirementLabel={slotRequirementLabel}
                  assignedLabel={assignedLabel}
                  dropState={cardDropState}
                  isInteractive
                  onSelect={() => setIsDetailOpen(true)}
                />
              </div>

              <p className="text-[10px] text-slate-500">
                Drag a resident onto the card to auto-start. Invalid drops are rejected.
              </p>

              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Resident tokens</div>
                <div className="flex flex-wrap gap-2">
                  {residentPool.map((resident) => (
                    <DraggableResidentToken key={resident.id} resident={resident} />
                  ))}
                </div>
              </div>
            </div>

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
              <div className="rounded-2xl border border-dashed border-slate-800/70 bg-slate-950/50 p-6 text-center text-[11px] text-slate-500">
                Click the Verb Card, hover, or drag a resident to open details.
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}


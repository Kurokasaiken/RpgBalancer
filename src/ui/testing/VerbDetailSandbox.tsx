import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import VerbCard from '@/ui/idleVillage/VerbCard';
import VerbDetailCard, {
  type VerbDetailPreview,
  type VerbDetailAssignment,
  type VerbSlotState,
} from '@/ui/idleVillage/VerbDetailCard';

const mockRewards: ResourceDeltaDefinition[] = [
  { resourceId: 'gold', amountFormula: '+8' },
  { resourceId: 'xp', amountFormula: '+5' },
];

const mockActivity: ActivityDefinition = {
  id: 'quest_city_rats',
  label: 'Cull Rats in Sewers',
  description: 'Short expedition beneath the city to clear nests and recover bounties.',
  tags: ['quest', 'combat', 'city'],
  slotTags: ['city'],
  resolutionEngineId: 'quest_combat',
  level: 1,
  dangerRating: 2,
  metadata: {
    questSpawnEnabled: true,
    injuryChanceDisplay: 35,
    deathChanceDisplay: 5,
  },
};

const mockResidents: ResidentState[] = [
  { id: 'Founder', status: 'available', fatigue: 10 },
  { id: 'Scout-A', status: 'available', fatigue: 25 },
  { id: 'Worker-B', status: 'injured', fatigue: 70 },
];

const residentAspects: Record<string, string[]> = {
  Founder: ['reason', 'lantern', 'discipline'],
  'Scout-A': ['moth', 'edge', 'passion'],
  'Worker-B': ['forge', 'strength'],
};

const SLOT_BLUEPRINT: VerbSlotState[] = [
  {
    id: 'slot_leader',
    label: 'Leader',
    aspectHint: 'Needs Reason / Lantern',
    requiredAspect: 'reason',
    required: true,
    assignedResidentId: null,
  },
  {
    id: 'slot_support',
    label: 'Support',
    aspectHint: 'Prefers Passion / Moth',
    requiredAspect: 'moth',
    required: false,
    assignedResidentId: null,
  },
];

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
  const [selectedIds, setSelectedIds] = useState<string[]>(['Founder']);
  const [slots, setSlots] = useState<VerbSlotState[]>(SLOT_BLUEPRINT);
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

  const preview: VerbDetailPreview = useMemo(() => {
    const assigned = slots.filter((slot) => slot.assignedResidentId).length || 1;
    return {
      rewards: mockRewards,
      injuryPercentage: 30 + assigned * 3,
      deathPercentage: 5 + Math.max(0, assigned - 1),
      note: 'Mock preview until SkillCheckEngine is wired',
    };
  }, [slots]);

  const assignments: VerbDetailAssignment[] = mockResidents.map((resident) => ({
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

      const aspects = residentAspects[residentId] ?? [];
      if (targetSlot.requiredAspect && !aspects.includes(targetSlot.requiredAspect)) {
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
    [findAutoSlotId, isActive, setDropFeedback, slots, startVerbRun],
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
              Trascina i residenti sui requisiti del verb, osserva la card compatta e la vista esplosa aggiornarsi in parallelo.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5 rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-500">
                <span>Verb Window</span>
                <span className="text-slate-400">{mockActivity.tags?.join(' · ')}</span>
              </div>

              <div ref={setCardDropRef}>
                <VerbCard
                  label={mockActivity.label}
                  icon="⚔️"
                  kindLabel="Quest"
                  assignees={assignedNames}
                  rewardsLabel={rewardsLabel}
                  deadlineLabel={`${isActive ? remainingSeconds : VERB_DURATION_SECONDS}s`}
                  riskLabel={`${preview.injuryPercentage}% / ${preview.deathPercentage}%`}
                  progressFraction={progressFraction}
                  state={isActive ? 'running' : 'idle'}
                  isQuest
                  tone="quest"
                  tooltip="Cull rats in the sewers"
                  slotRequirementLabel={slotRequirementLabel}
                  assignedLabel={assignedLabel}
                  dropState={cardDropState}
                  isInteractive
                  onSelect={() => setIsDetailOpen(true)}
                />
              </div>

              <p className="text-[10px] text-slate-500">
                Trascina un residente sulla card per iniziare automaticamente. Se non soddisfa i requisiti, la card lo rifiuterà.
              </p>

              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Resident tokens</div>
                <div className="flex flex-wrap gap-2">
                  {mockResidents.map((resident) => (
                    <DraggableResidentToken key={resident.id} resident={resident} />
                  ))}
                </div>
              </div>
            </div>

            {shouldShowDetail ? (
              <VerbDetailCard
                title={mockActivity.label}
                subtitle="Quest Offer · Exploded view"
                activity={mockActivity}
                description={mockActivity.description}
                slotLabel="Village Square"
                preview={preview}
                assignments={assignments}
                slots={slots}
                durationSeconds={VERB_DURATION_SECONDS}
                elapsedSeconds={elapsedSeconds}
                isActive={isActive}
                mockWarning="Preview + DnD sono mock: sostituire con SkillCheckEngine e drag reale."
                onStart={handleManualStart}
                onClose={() => setIsDetailOpen(false)}
                onSlotClick={handleSlotClear}
                startDisabled={!requiredSatisfied || isActive}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800/70 bg-slate-950/50 p-6 text-center text-[11px] text-slate-500">
                Clicca la Verb Card, usa il tooltip o trascina un residente sopra la card per aprire il dettaglio.
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}


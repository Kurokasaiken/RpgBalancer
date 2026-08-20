import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { VerbDetailPreview } from '@/ui/idleVillage/types/VerbDetailPreview';
// COMMENTED: unused import — import { type DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { VillageState, ResidentState } from '@/engine/game/idleVillage/TimeEngine';

export type DemoRequirement = 'none' | 'hp200';

export interface DemoSlotEntry {
  id: string;
  label: string;
  assignedResidentId: string | null;
  isPlusButton: boolean;
}

export interface ResidentSlotViewModel {
  id: string;
  label: string;
  assignedResidentId: string | null;
  index: number;
  slotId: string;
  requirement?: { label: string };
  isRequired: boolean;
  isPlaceholder: boolean;
  dropState: DropState;
  isPlusButton?: boolean;
  portraitUrl?: string;
  assignedResident?: ResidentState;
}

export interface ActivityCardMetric {
  id: string;
  label: string;
  value: string;
  type: 'progress' | 'count' | 'text';
}

export interface DemoPanelState {
  requirement: DemoRequirement;
  requirementLabel: string;
  requirementDescription: string;
  slotViewModels: ResidentSlotViewModel[];
  metrics: ActivityCardMetric[];
  activityDefinition: ActivityDefinition;
  preview: VerbDetailPreview;
  hasAssignments: boolean;
  assignedResidentIds: string[];
  elapsedSeconds: number;
  progressFraction: number;
}

const DEMO_PANEL_STORAGE_KEY = 'idle_village_demo_panel_state';
const DEMO_TOTAL_DURATION_SECONDS = 60;
const INITIAL_NEXT_SLOT_INDEX = 2;

interface DemoPanelPersistencePayload {
  requirement: DemoRequirement;
  slots: DemoSlotEntry[];
  nextSlotIndex: number;
}

type DemoPanelHandlers = {
  setRequirement: Dispatch<SetStateAction<DemoRequirement>>;
  onSlotDrop: (slotId: string, residentId: string | null) => void;
  onSlotClear: (slotId: string) => void;
  onRemoveAll: () => void;
  onStart: () => void;
  startJob?: () => void;
};

const slotBlueprints: Readonly<DemoSlotEntry[]> = [
  { id: 'demo-slot-1', label: 'Slot 1', assignedResidentId: null, isPlusButton: false },
  { id: 'demo-plus-button', label: '+', assignedResidentId: null, isPlusButton: true },
];

/**
 * Returns a deep-cloned copy of the initial demo slots (regular slot + plus button).
 */
function createInitialSlots(): DemoSlotEntry[] {
  return slotBlueprints.map((slot) => ({
    ...slot,
    assignedResidentId: slot.assignedResidentId ?? null,
  }));
}

/**
 * Creates the baseline persisted payload used when no saved data is available.
 */
function createDefaultPersistedState(): DemoPanelPersistencePayload {
  return {
    requirement: 'none',
    slots: createInitialSlots(),
    nextSlotIndex: INITIAL_NEXT_SLOT_INDEX,
  };
}

/**
 * Derives a human-readable label for a demo slot based on its identifier.
 */
function deriveSlotLabel(slot: DemoSlotEntry): string {
  if (slot.label) return slot.label;
  if (slot.isPlusButton) return '+';
  const match = /demo-slot-(\d+)/.exec(slot.id);
  return match ? `Slot ${match[1]}` : slot.id;
}

/**
 * Produces a sanitized array of demo slots ensuring at least one regular slot and a single plus button.
 */
function sanitizeSlots(rawSlots?: DemoSlotEntry[] | null): DemoSlotEntry[] {
  const candidate = Array.isArray(rawSlots) && rawSlots.length > 0 ? rawSlots : createInitialSlots();
  const normalized = candidate.map<DemoSlotEntry>((slot) => ({
    ...slot,
    label: deriveSlotLabel(slot),
    assignedResidentId: slot.assignedResidentId ?? null,
    isPlusButton: Boolean(slot.isPlusButton),
  }));

  const regularSlots = normalized.filter((slot) => !slot.isPlusButton);
  if (regularSlots.length === 0) {
    regularSlots.push({
      id: 'demo-slot-1',
      label: 'Slot 1',
      assignedResidentId: null,
      isPlusButton: false,
    });
  }

  const plusSlot = {
    id: 'demo-plus-button',
    label: '+',
    assignedResidentId: null,
    isPlusButton: true,
  };

  return [...regularSlots, plusSlot];
}

/**
 * Determines the next slot index based on the current slot identifiers.
 */
function deriveNextSlotIndex(slots: DemoSlotEntry[]): number {
  const highest = slots
    .filter((slot) => !slot.isPlusButton)
    .reduce((max, slot) => {
      const match = /demo-slot-(\d+)/.exec(slot.id);
      const slotNumber = match ? Number(match[1]) : NaN;
      return Number.isFinite(slotNumber) ? Math.max(max, slotNumber) : max;
    }, INITIAL_NEXT_SLOT_INDEX - 1);

  return Math.max(highest + 1, INITIAL_NEXT_SLOT_INDEX);
}

/**
 * Normalizes persisted payloads to guarantee structural integrity before hydrating UI state.
 */
function sanitizePersistedState(
  payload: DemoPanelPersistencePayload | null | undefined,
): DemoPanelPersistencePayload {
  const slots = sanitizeSlots(payload?.slots);
  const derivedNextIndex = deriveNextSlotIndex(slots);
  const persistedNextIndex =
    typeof payload?.nextSlotIndex === 'number' && payload.nextSlotIndex >= INITIAL_NEXT_SLOT_INDEX
      ? Math.max(payload.nextSlotIndex, derivedNextIndex)
      : derivedNextIndex;

  return {
    requirement: payload?.requirement === 'hp200' ? 'hp200' : 'none',
    slots,
    nextSlotIndex: persistedNextIndex,
  };
}

interface UseSandboxDemoPanelProps {
  residentsById: Record<string, ResidentState>;
  updateVillageState: (updater: (prev: VillageState) => VillageState, action?: string) => void;
  setAssignmentFeedback: (message: string) => void;
  subscribeClock: (subscriberId: string, handler: (deltaSeconds: number) => void) => void;
  unsubscribeClock: (subscriberId: string) => void;
}

export function useSandboxDemoPanel({
  residentsById,
  updateVillageState,
  setAssignmentFeedback,
  subscribeClock,
  unsubscribeClock,
}: UseSandboxDemoPanelProps) {
  const [demoRequirement, setDemoRequirement] = useState<DemoRequirement>('none');
  const [demoSlots, setDemoSlots] = useState<DemoSlotEntry[]>(() => createInitialSlots());
  const [demoElapsedSeconds, setDemoElapsedSeconds] = useState(0);
  const [demoIsRunning, setDemoIsRunning] = useState(false);
  const [nextDemoSlotIndex, setNextDemoSlotIndex] = useState(INITIAL_NEXT_SLOT_INDEX);

  const demoTotalDuration = DEMO_TOTAL_DURATION_SECONDS; // seconds
  const hasHydratedRef = useRef(false);

  const accumulatedSecondsRef = useRef(0);

  useEffect(() => {
    let isCancelled = false;

    const hydrate = async () => {
      try {
        const persisted = await loadData<DemoPanelPersistencePayload>(
          DEMO_PANEL_STORAGE_KEY,
          createDefaultPersistedState(),
        );
        if (isCancelled) return;
        const sanitized = sanitizePersistedState(persisted);
        setDemoRequirement(sanitized.requirement);
        setDemoSlots(sanitized.slots);
        setNextDemoSlotIndex(sanitized.nextSlotIndex);
      } catch (error) {
        console.warn('[useSandboxDemoPanel] Failed to load persisted demo panel state.', error);
      } finally {
        if (!isCancelled) {
          hasHydratedRef.current = true;
        }
      }
    };

    void hydrate();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;

    const payload: DemoPanelPersistencePayload = {
      requirement: demoRequirement,
      slots: demoSlots,
      nextSlotIndex: nextDemoSlotIndex,
    };

    void saveData(DEMO_PANEL_STORAGE_KEY, payload).catch((error) => {
      console.warn('[useSandboxDemoPanel] Failed to persist demo panel state.', error);
    });
  }, [demoRequirement, demoSlots, nextDemoSlotIndex]);

  const demoAssignedResidentIds = useMemo(() => 
    demoSlots.map(slot => slot.assignedResidentId).filter((id): id is string => id !== null),
    [demoSlots]
  );

  const demoHasAssignments = useMemo(
    () => demoSlots.some((slot) => slot.assignedResidentId && !slot.isPlusButton),
    [demoSlots],
  );

  const requirementLabel = useMemo(() => {
    switch (demoRequirement) {
      case 'none': return 'Nessun Requisito';
      case 'hp200': return 'HP ≥ 200';
      default: return 'Requisito Sconosciuto';
    }
  }, [demoRequirement]);

  const requirementDescription = useMemo(() => {
    switch (demoRequirement) {
      case 'none': return 'Tutti gli slot accettano qualsiasi residente.';
      case 'hp200': return 'Gli slot richiedono residenti con almeno 200 HP.';
      default: return 'Descrizione requisito non disponibile.';
    }
  }, [demoRequirement]);

  const demoActivityDefinition: ActivityDefinition = useMemo(() => ({
    id: 'demo-activity',
    label: 'Attività Demo',
    description: 'Attività di dimostrazione per testare requisiti slot',
    tags: ['system'],
    slotTags: [],
    resolutionEngineId: 'system',
    durationFormula: '60',
    metadata: {},
    rewards: [],
    maxSlots: demoSlots.length,
  }), [demoSlots.length]);

  const demoPreview: VerbDetailPreview = useMemo(() => ({
    rewards: [],
    injuryPercentage: 0,
    deathPercentage: 0,
  }), []);

  const demoSlotViewModels = useMemo<ResidentSlotViewModel[]>(
    () =>
      demoSlots.map((slot, index) => ({
        id: slot.id,
        index,
        slotId: slot.id,
        label: slot.label,
        assignedResidentId: slot.assignedResidentId,
        requirement: demoRequirement === 'hp200' ? { label: 'HP ≥ 200' } : undefined,
        isRequired: true,
        isPlaceholder: false,
        dropState: 'idle' as DropState,
        isPlusButton: slot.isPlusButton,
        portraitUrl: slot.assignedResidentId ? residentsById[slot.assignedResidentId]?.portraitUrl : undefined,
        assignedResident: slot.assignedResidentId ? residentsById[slot.assignedResidentId] : undefined,
      })),
    [demoSlots, demoRequirement, residentsById]
  );

  const demoMetrics: ActivityCardMetric[] = useMemo(
    () => [
      {
        id: 'demo-progress',
        label: 'Progresso',
        value: demoTotalDuration > 0 ? `${Math.round((demoElapsedSeconds / demoTotalDuration) * 100)}%` : '0%',
        type: 'progress',
      },
      {
        id: 'demo-assignments',
        label: 'Slot Assegnati',
        value: demoAssignedResidentIds.length.toString(),
        type: 'count',
      },
    ],
    [demoElapsedSeconds, demoTotalDuration, demoAssignedResidentIds.length]
  );

  const demoPanelState = useMemo<DemoPanelState>(
    () => ({
      requirement: demoRequirement,
      requirementLabel,
      requirementDescription,
      slotViewModels: demoSlotViewModels,
      metrics: demoMetrics,
      activityDefinition: demoActivityDefinition,
      preview: demoPreview,
      hasAssignments: demoHasAssignments,
      assignedResidentIds: demoAssignedResidentIds,
      elapsedSeconds: demoElapsedSeconds,
      progressFraction: demoTotalDuration > 0 ? demoElapsedSeconds / demoTotalDuration : 0,
    }),
    [
      demoActivityDefinition,
      demoAssignedResidentIds,
      demoElapsedSeconds,
      demoHasAssignments,
      demoMetrics,
      demoPreview,
      demoRequirement,
      demoSlotViewModels,
      demoTotalDuration,
      requirementDescription,
      requirementLabel,
    ]
  );

  const handleDemoRemoveAll = useCallback(() => {
    // Reset all assigned residents' status to 'available'
    demoAssignedResidentIds.forEach((residentId) => {
      updateVillageState(
        (prev) => ({
          ...prev,
          residents: {
            ...prev.residents,
            [residentId]: {
              ...prev.residents[residentId],
              status: 'available' as const,
            },
          },
        }),
        'Reset demo resident status to available'
      );
    });

    setDemoSlots(createInitialSlots());
    setNextDemoSlotIndex(INITIAL_NEXT_SLOT_INDEX);
  }, [demoAssignedResidentIds, updateVillageState]);

  const handleDemoStart = useCallback(() => {
    if (!demoHasAssignments) {
      return;
    }
    setDemoElapsedSeconds(0);
    setDemoIsRunning(true);
    setAssignmentFeedback('Demo attività avviata!');
  }, [setAssignmentFeedback, demoHasAssignments]);

  const handleDemoSlotDrop = useCallback(
    (slotId: string, residentId: string | null) => {
      setDemoSlots((prevSlots) => {
        const slotIndex = prevSlots.findIndex((s) => s.id === slotId);
        if (slotIndex === -1) return prevSlots;

        // If dropping on the plus button, add a new slot
        if (prevSlots[slotIndex].isPlusButton && residentId) {
          const labelIndex = nextDemoSlotIndex;
          const newSlotId = `demo-slot-${labelIndex}`;
          setNextDemoSlotIndex((i) => i + 1);

          const regularSlots = prevSlots.filter((slot) => !slot.isPlusButton);

          return [
            ...regularSlots,
            {
              id: newSlotId,
              label: `Slot ${labelIndex}`,
              assignedResidentId: residentId,
              isPlusButton: false,
            },
            {
              id: 'demo-plus-button',
              label: '+',
              assignedResidentId: null,
              isPlusButton: true,
            },
          ];
        }

        // Regular slot assignment
        const newSlots = [...prevSlots];
        newSlots[slotIndex] = {
          ...newSlots[slotIndex],
          assignedResidentId: residentId,
        };

        return newSlots;
      });

      // Update resident status if assigned
      if (residentId) {
        updateVillageState(
          (prev) => ({
            ...prev,
            residents: {
              ...prev.residents,
              [residentId]: {
                ...prev.residents[residentId],
                status: 'away' as const,
              },
            },
          }),
          'Update resident status to away for demo'
        );
      }
    },
    [nextDemoSlotIndex, updateVillageState]
  );

  const handleDemoSlotClear = useCallback(
    (slotId: string) => {
      setDemoSlots((prevSlots) => {
        const slotIndex = prevSlots.findIndex((s) => s.id === slotId);
        if (slotIndex === -1 || !prevSlots[slotIndex].assignedResidentId) return prevSlots;

        const residentId = prevSlots[slotIndex].assignedResidentId;
        
        // Update resident status back to available
        if (residentId) {
          updateVillageState(
            (prev) => ({
              ...prev,
              residents: {
                ...prev.residents,
                [residentId]: {
                  ...prev.residents[residentId],
                  status: 'available' as const,
                },
              },
            }),
            'Reset resident status to available from demo'
          );
        }

        // If it's a regular slot, just clear it
        if (!prevSlots[slotIndex].isPlusButton) {
          const newSlots = [...prevSlots];
          newSlots[slotIndex] = {
            ...newSlots[slotIndex],
            assignedResidentId: null,
          };
          return newSlots;
        }
        
        return prevSlots;
      });
    },
    [updateVillageState]
  );

  // Timer effect
  useEffect(() => {
    if (demoIsRunning) {
      accumulatedSecondsRef.current = 0;
      const handler = (deltaSeconds: number) => {
        accumulatedSecondsRef.current += deltaSeconds;
        while (accumulatedSecondsRef.current >= 1) {
          accumulatedSecondsRef.current -= 1;
          setDemoElapsedSeconds((prev) => {
            const next = prev + 1;
            if (next >= demoTotalDuration) {
              setDemoIsRunning(false);
              handleDemoRemoveAll();
              return 0;
            }
            return next;
          });
        }
      };
      subscribeClock('demo-panel', handler);
      return () => unsubscribeClock('demo-panel');
    } else {
      unsubscribeClock('demo-panel');
    }
  }, [demoIsRunning, demoTotalDuration, handleDemoRemoveAll, subscribeClock, unsubscribeClock]);

  const demoPanelHandlers: DemoPanelHandlers = useMemo(
    () => ({
      setRequirement: setDemoRequirement,
      onSlotDrop: handleDemoSlotDrop,
      onSlotClear: handleDemoSlotClear,
      onRemoveAll: handleDemoRemoveAll,
      onStart: handleDemoStart,
      startJob: handleDemoStart,
    }),
    [handleDemoRemoveAll, handleDemoSlotClear, handleDemoSlotDrop, handleDemoStart],
  );

  return {
    demoPanelState,
    demoPanelHandlers,
    demoIsRunning,
  };
}

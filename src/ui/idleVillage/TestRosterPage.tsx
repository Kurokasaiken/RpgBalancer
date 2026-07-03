/**
 * TestRosterPage – Idle Village Slot Lab
 *
 * Minimal surface that mounts the official WorkerPanel roster together with the
 * canonical ResidentSlotRack so designers can verify drag & drop wiring without
 * entering the full Minimal Gameplay loop.
 */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import type { MinimalUIConfig } from '@/balancing/config/idleVillage/minimalConfig';
import { MINIMAL_GAMEPLAY_RESIDENTS } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';
import { TEST_RESIDENTS } from '@/balancing/config/idleVillage/testResidents';
import type { ResidentState, VillageState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import { useVillageResidents } from '@/ui/idleVillage/hooks/useVillageResidents';
import { getCharacterStorageEventName } from '@/engine/idle/characterPersistence';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { useCanonicalRosterBundle } from '@/ui/idleVillage/roster/CanonicalRosterBundle';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { DEFAULT_TEST_HARNESS_CONFIG as SLOT_LAB_CONFIG, type SlotLabPoiConfig } from '@/balancing/config/idleVillage/testHarnessConfig';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import ResidentSlotRackSkin from '@/ui/idleVillage/components/ResidentSlotRackSkin';
import { SlotRackWithSkin } from '@/ui/idleVillage/components/SlotRackWithSkin';
import { resolveSlotRackPresetId } from '@/ui/idleVillage/skins/slotRackSkinConfig';
import { resolveResidentRackDisplayInfo } from '@/ui/idleVillage/slots/residentSlotDisplay';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ActivityCardKind, ActivityDefinition, StatRequirement } from '@/balancing/config/idleVillage/types';
import type { ResidentSlotAssignResult } from '@/ui/idleVillage/slots/types';
import type { DragFeedbackState } from '@/ui/idleVillage/components/ResidentRosterTypes';
import { useActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import { getDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { useSensoryAudio } from '@/ui/idleVillage/hooks/useSensoryAudio';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { useSandboxTiming } from '@/ui/idleVillage/hooks/useSandboxTiming';
import type { ResidentAssignmentCandidate, ResidentPickerSlotMeta } from '@/ui/idleVillage/components/InlineResidentChips';
import CertifiedWorkerPickerSheet from '@/ui/idleVillage/testHarness/components/CertifiedWorkerPickerSheet';
import { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
import { TimeEngineStrip } from '@/ui/idleVillage/components/minimal/TimeEngineStrip';
import { themePresetMap, themePresets, type ThemePresetId } from '@/data/themePresets';
import { exposeRendererStackData } from '@/ui/idleVillage/utils/rendererStackInstrumentation';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import type { SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';
import { ActivityCapsule, type ActivitySlotData } from '@/ui/idleVillage/components/ActivityCapsule';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { useSlotDebugVisualization } from '@/ui/idleVillage/hooks/useSlotDebugVisualization';
import type { SlotDebugVisualizationSettings } from '@/balancing/config/idleVillage/slotDebugVisualizationConfig';
// Temporarily commented out to avoid import conflicts with TS-Series
// import { SkinDevTools } from '@/ui/idleVillage/skins/SkinDevTools';
// import { SkinDebugPanel } from '@/ui/idleVillage/skins/SkinDebugPanel';
// import { SkinTestControls } from '@/ui/idleVillage/skins/SkinTestControls';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { FlightProxy } from '@/ui/idleVillage/components/FlightProxy';

type RackScenarioKey = 'open' | 'restricted';

interface ScenarioValidatorResult {
  isValid: boolean;
  message?: string;
}

interface RackScenario {
  id: RackScenarioKey;
  title: string;
  statRequirement?: StatRequirement;
  subtitle: string;
  minStaminaBeforeExhausted?: number;
  validator?: (resident: ResidentState) => ScenarioValidatorResult;
}

interface ScenarioAttempt {
  result: ResidentSlotAssignResult;
  residentId?: string;
  timestamp: number;
}

interface ScenarioPanelApi {
  assignResident: (residentId: string, preferredSlotId?: string) => ResidentSlotAssignResult | null;
}

const RACK_SCENARIOS: RackScenario[] = [
  {
    id: 'open',
    title: 'Rack A · Scenario permissivo',
    subtitle: 'Richiede HP ≥ 200',
    minStaminaBeforeExhausted: 20, // Can work until stamina drops to 20%
    statRequirement: {
      label: 'HP ≥ 200',
    },
    validator: (resident) => {
      const hp = resident.currentHp ?? resident.statSnapshot?.hp ?? 0;
      return hp >= 200
        ? { isValid: true }
        : { isValid: false, message: `HP insufficiente (${hp}/200)` };
    },
  },
  {
    id: 'restricted',
    title: 'Rack B · Scenario restrittivo',
    subtitle: 'Richiede HP ≥ 200',
    minStaminaBeforeExhausted: 30, // Higher stamina requirement for restricted slots
    statRequirement: {
      label: 'HP ≥ 200',
    },
    validator: (resident) => {
      const hp = resident.currentHp ?? resident.statSnapshot?.hp ?? 0;
      return hp >= 200
        ? { isValid: true }
        : { isValid: false, message: `HP insufficiente (${hp}/200)` };
    },
  },
];


const dropStateCopy: Record<DropState, string> = {
  idle: 'Idle',
  valid: 'Valid',
  invalid: 'Invalid',
  locked: 'Locked',
};

const getScenarioActivityId = (scenario: RackScenario) => `slot-lab-${scenario.id}`;

const buildScenarioActivityDefinition = (scenario: RackScenario): ActivityDefinition => ({
  id: getScenarioActivityId(scenario),
  label: scenario.title,
  description: scenario.subtitle,
  tags: ['slot_lab', scenario.id],
  slotTags: scenario.statRequirement?.allOf ?? ['test-harness'],
  resolutionEngineId: 'slot-lab-harness',
  durationFormula: `${SLOT_LAB_CONFIG.timer.totalDurationSeconds}`,
  maxSlots: 'infinite',
  statRequirement: scenario.statRequirement ?? { label: 'Qualsiasi' },
});

const buildInitialAssignments = (): Record<RackScenarioKey, Record<string, string | null>> =>
  RACK_SCENARIOS.reduce<Record<RackScenarioKey, Record<string, string | null>>>((acc, scenario) => {
    const activityId = getScenarioActivityId(scenario);
    // Create multiple slots for testing - start with 3 slots per scenario
    const slotAssignments: Record<string, string | null> = {};
    for (let i = 0; i < 3; i++) {
      slotAssignments[`${activityId}-slot-${i}`] = null;
    }
    acc[scenario.id] = slotAssignments;
    return acc;
  }, {} as Record<RackScenarioKey, Record<string, string | null>>);

interface RackScenarioPanelProps {
  scenario: RackScenario;
  residentsById: Record<string, ResidentState>;
  hoveredResidentId: string | null;
  assignments: Record<string, string | null>;
  onAssign: (scenarioId: RackScenarioKey, slotId: string, residentId: string) => void;
  onClear: (scenarioId: RackScenarioKey, slotId: string) => void;
  onAssignmentResult: (scenarioId: RackScenarioKey, result: ResidentSlotAssignResult, residentId?: string) => void;
  lastAttempt?: ScenarioAttempt | null;
  registerScenarioApi: (scenarioId: RackScenarioKey, api: ScenarioPanelApi | null) => void;
  pickerCandidates: ResidentAssignmentCandidate[];
  onOpenPicker: (payload: {
    scenarioId: RackScenarioKey;
    slotId: string;
    slotMeta: ResidentPickerSlotMeta;
    candidates: ResidentAssignmentCandidate[];
  }) => void;
  shakingSlotIds?: Set<string>;
  miniLabPreset: { id: string };
  slotDebugVisualization: SlotDebugVisualizationSettings;
}

const isValidScenarioId = (value: string): value is RackScenarioKey =>
  RACK_SCENARIOS.some((scenario) => scenario.id === value);

const RackScenarioPanel: React.FC<RackScenarioPanelProps> = ({
  scenario,
  residentsById,
  hoveredResidentId,
  assignments,
  onAssign,
  onClear,
  onAssignmentResult,
  lastAttempt,
  registerScenarioApi,
  pickerCandidates,
  onOpenPicker,
  shakingSlotIds,
  miniLabPreset,
  slotDebugVisualization,
}) => {
  const activityDefinition = useMemo(() => buildScenarioActivityDefinition(scenario), [scenario]);
  const rackTestId = scenario.id === 'open' ? 'slot-rack-A' : scenario.id === 'restricted' ? 'slot-rack-B' : `slot-rack-${scenario.id}`;
  const panelTestId = `slot-lab-panel-${scenario.id}`;

  const {
    slots,
    assignResidentToSlot,
    clearSlot,
    getSlotProgress,
    warnings,
    dropState,
  } = useResidentSlotController({
    activity: activityDefinition,
    assignments,
    residents: residentsById,
    hoveredResidentId,
    maxFatigueBeforeExhausted: scenario.minStaminaBeforeExhausted ?? 20, // Use stamina threshold as fatigue cap directly
    onAssign: (slotId, residentId) => onAssign(scenario.id, slotId, residentId),
    onClear: (slotId) => onClear(scenario.id, slotId),
    // Custom validator for scenario-specific rules (e.g., HP requirements)
    customValidator: (residentId, slotId) => {
      if (scenario.validator) {
        const resident = residentsById[residentId];
        if (resident) {
          const validation = scenario.validator(resident);
          if (!validation.isValid) {
            console.log('⚠️ [TestRosterPage] customValidator rejected resident', {
              scenarioId: scenario.id,
              residentId,
              slotId,
              message: validation.message,
            });
            // Don't interfere with drop validation - just notify UI
            const errorResult: ResidentSlotAssignResult = {
              success: false,
              reason: 'VALIDATION_FAILED',
              details: validation.message ?? 'Requisito dello scenario non soddisfatto',
              slotId,
            };
            // Notify UI to show error message
            onAssignmentResult(scenario.id, errorResult, residentId);
            // Return null to let drop validation system handle the state
            return null;
          }
        }
      }
      return null; // No custom error, proceed normally
    },
  });


  useEffect(() => {
    registerScenarioApi(
      scenario.id,
      slots.length > 0
        ? {
          assignResident: (residentId, preferredSlotId) => {
            // CRITICAL FIX: If no preferredSlotId provided, NEVER assign to any slot
            // This completely blocks auto-assignment when dropping outside valid slots
            if (!preferredSlotId) {
              return {
                success: false,
                reason: 'VALIDATION_FAILED',
                details: 'Drop fuori area valida'
              } as ResidentSlotAssignResult;
            }

            // If preferredSlotId is provided, use it directly
            const result = assignResidentToSlot(residentId, preferredSlotId);

            // Record result for UI feedback ONLY if assignment failed
            if (!result.success) {
              onAssignmentResult(scenario.id, result, residentId);
            }
            return result;
          },
        }
        : null,
    );
    return () => registerScenarioApi(scenario.id, null);
  }, [assignResidentToSlot, assignments, registerScenarioApi, scenario.id, slots, onAssignmentResult]);

  const assignedResidentLabels = useMemo(() => {
    return Object.values(assignments)
      .filter((value): value is string => Boolean(value))
      .map((residentId) => formatResidentLabel(residentsById[residentId] ?? { id: residentId, displayName: residentId } as ResidentState));
  }, [assignments, residentsById]);

  const lastAttemptMessage = useMemo(() => {
    if (!lastAttempt) return 'Nessuna interazione registrata';
    if (lastAttempt.result.success) {
      const resident = lastAttempt.residentId ? residentsById[lastAttempt.residentId] : undefined;
      return resident ? `Successo · ${formatResidentLabel(resident)}` : 'Successo';
    }
    // Type guard for failure case
    if (!lastAttempt.result.success) {
      const reason = (lastAttempt.result as any).reason;
      const details = (lastAttempt.result as any).details ? ` · ${(lastAttempt.result as any).details}` : '';
      return `Errore · ${reason}${details}`;
    }
    return 'Errore · sconosciuto';
  }, [lastAttempt, residentsById]);

  const hoverValidation = useMemo(() => {
    if (!scenario.validator || !hoveredResidentId) return null;
    const resident = residentsById[hoveredResidentId];
    if (!resident) return null;
    const result = scenario.validator(resident);
    return result.isValid ? null : result;
  }, [hoveredResidentId, residentsById, scenario]);

  useEffect(() => {
    if (!hoverValidation || !hoveredResidentId) {
      return;
    }
    console.log('⚠️ [TestRosterPage] hoverValidation rejected resident', {
      scenarioId: scenario.id,
      residentId: hoveredResidentId,
      message: hoverValidation.message,
    });
  }, [hoverValidation, hoveredResidentId, scenario.id]);

  const effectiveDropState = hoverValidation ? 'invalid' : dropState;
  const decoratedSlots = useMemo(
    () => {
      if (!hoverValidation) return slots;

      // Apply invalid state only to slots that would reject this resident
      return slots.map((slot) => {
        // For restricted scenario, check if this specific slot should be invalid
        if (scenario.id === 'restricted' && hoverValidation) {
          // All slots in restricted scenario should show invalid for non-qualifying residents
          return { ...slot, dropState: 'invalid' as DropState };
        }
        return slot;
      });
    },
    [hoverValidation, slots, scenario.id],
  );

  const dropStateTone = effectiveDropState === 'valid' ? 'text-emerald-300' : effectiveDropState === 'invalid' ? 'text-white/60' : 'text-white/70';
  const primarySlot = decoratedSlots[0] ?? null;
  const handleOpenPickerSheet = useCallback(() => {
    if (!primarySlot) return;
    const slotMeta: ResidentPickerSlotMeta = {
      slotId: primarySlot.id,
      label: primarySlot.label,
      activityLabel: scenario.subtitle,
      description: scenario.title,
    };
    onOpenPicker({ scenarioId: scenario.id, slotId: primarySlot.id, slotMeta, candidates: pickerCandidates });
  }, [onOpenPicker, pickerCandidates, primarySlot, scenario.id, scenario.subtitle, scenario.title]);

  return (
    <StyleLabSurface
      variant="card"
      className="flex h-full w-full flex-col space-y-3 overflow-hidden"
      testId={panelTestId}
      style={{ minHeight: 0 }}
    >
      <div className="shrink-0">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--minimal-text-primary)' }}>
          {scenario.title}
        </h3>
        <p className="text-xs text-white/70">{scenario.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--minimal-text-secondary)' }}>
        <span className={`rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold ${dropStateTone}`}>
          Drop: {dropStateCopy[effectiveDropState]}
        </span>
        <span>Slots: {slots.length}</span>
        <span>Warnings: {warnings.length}</span>
        {scenario.minStaminaBeforeExhausted && (
          <span>Stamina &gt; {scenario.minStaminaBeforeExhausted}</span>
        )}
        {hoverValidation?.message && (
          <span className="text-amber-300">{hoverValidation.message}</span>
        )}
        <button
          type="button"
          onClick={handleOpenPickerSheet}
          className="rounded-full border border-white/15 px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white disabled:opacity-40"
          disabled={!primarySlot || pickerCandidates.length === 0}
        >
          Apri picker
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/80">
          <ul className="list-disc space-y-1 pl-4 text-amber-200">
            {warnings.map((warning) => (
              <li key={warning.slotIds.join('-') ?? warning.message}>{warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-auto pt-1">
        <ResidentSlotRackSkin
          slots={decoratedSlots}
          layout="detail"
          overflowBehavior="wrap"
          getSlotProgress={getSlotProgress}
          resolveDisplayInfo={resolveResidentRackDisplayInfo}
          onSlotDrop={(slotId, residentId) => assignResidentToSlot(residentId, slotId)}
          onSlotClear={(slotId) => clearSlot(slotId)}
          onSlotClick={undefined}
          draggingResidentId={hoveredResidentId}
          shakingSlotIds={shakingSlotIds}
          skinPresetId={resolveSlotRackPresetId('slot_wilderness_bronze')}
          data-testid={`slot-rack-${scenario.id === 'open' ? 'A' : 'B'}`}
          slotDebugVisualization={slotDebugVisualization}
        />
      </div>
    </StyleLabSurface>
  );
};

const TestRosterPageContent: React.FC = () => {
  const { config: idleConfig } = useIdleVillageConfig();
  const resolvedIdleConfig = idleConfig ?? DEFAULT_IDLE_VILLAGE_CONFIG;
  const uiConfig = (DEFAULT_MINIMAL_CONFIG.ui ?? DEFAULT_MINIMAL_CONFIG.ui) as MinimalUIConfig;
  const styleTokens = useMinimalStyleLabTokens(uiConfig);
  const harnessResidentDefaults = SLOT_LAB_CONFIG.residentDefaults;
  const harnessStartingFatigue = harnessResidentDefaults.startingFatigue;
  
  // Use canonical Village Resident Store
  const {
    residents: storeResidents,
    isLoading: storeIsLoading,
    error: storeError,
    usedFallback,
    charactersConverted,
    bootstrapResidents,
  } = useVillageResidents();
  
  // Apply test harness overrides (full stamina) to canonical residents
  const residents = useMemo(() => 
    storeResidents.map((resident) => ({
      ...resident,
      fatigue: harnessStartingFatigue,
      currentHp: resident.maxHp,
    }))
  , [storeResidents, harnessStartingFatigue]);
  
  const isLoading = storeIsLoading;
  const error = storeError;

  // Use shared test residents for drag & drop testing
  const testResidents = TEST_RESIDENTS;

  const [assignmentsByScenario, setAssignmentsByScenario] = useState<Record<RackScenarioKey, Record<string, string | null>>>(() => {
  const initial = buildInitialAssignments();
  
  // Auto-populate disabled for testing - start with empty slots
  // But add a temporary button to assign for testing
  // const testResidentIds = Object.keys(TEST_ROSTER_HEROES).slice(0, 2); // Get first 2 test residents
  // 
  // // Populate open scenario first slot
  // const openSlots = Object.keys(initial.open);
  // if (openSlots.length > 0 && testResidentIds.length > 0) {
  //   initial.open[openSlots[0]] = testResidentIds[0];
  // }
  // 
  // // Populate restricted scenario first slot  
  // const restrictedSlots = Object.keys(initial.restricted);
  // if (restrictedSlots.length > 0 && testResidentIds.length > 1) {
  //   initial.restricted[restrictedSlots[0]] = testResidentIds[1];
  // }
  
  return initial;
});
  const [lastAttemptByScenario, setLastAttemptByScenario] = useState<Record<RackScenarioKey, ScenarioAttempt | null>>({
    open: null,
    restricted: null,
  });
  const [returningResidentIds, setReturningResidentIds] = useState<Set<string>>(new Set());
  const [pickerResidents, setPickerResidents] = useState<ResidentAssignmentCandidate[]>([]);
  const [pickerSlotMeta, setPickerSlotMeta] = useState<ResidentPickerSlotMeta | null>(null);
  const [pickerContext, setPickerContext] = useState<{ scenarioId: RackScenarioKey; slotId: string } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const scenarioApisRef = useRef<Partial<Record<RackScenarioKey, ScenarioPanelApi>>>({});
  const {
    presetId,
    pillar: currentPillar,
    setPreset,
    availablePresets,
    resetOverrides,
  } = useSkinPreferences();
  const [isRandomized, setIsRandomized] = useState(false);
  const lastManualPresetRef = useRef<ThemePresetId>(presetId as ThemePresetId);
  useEffect(() => {
    if (!isRandomized) {
      lastManualPresetRef.current = presetId as ThemePresetId;
    }
  }, [presetId, isRandomized]);
  const miniLabPreset = useMemo(() => {
    return themePresetMap[presetId] ?? themePresets[0];
  }, [presetId]);
  const { activeId, setActiveId, dragPreviewCenter, dragCursorOffset, magnetTargetCenter, setDragPreviewCenter, setMagnetTargetCenter } = useDragContext();

// STEP 1: Premium drag visual state
type DragVisualState = 
  | { mode: 'idle' }
  | { mode: 'dragging'; residentId: string }
  | { 
      mode: 'flight'; 
      residentId: string; 
      slotId: string; 
      fromX: number; 
      fromY: number; 
      toX: number; 
      toY: number; 
    };

const [dragVisualState, setDragVisualState] = useState<DragVisualState>({ mode: 'idle' });
  
  // Use canonical roster bundle for functional parity
  const { residents: rosterResidents, residentsById: canonicalResidentsById } = useCanonicalRosterBundle(harnessStartingFatigue);

  const [debugDragEnabled, setDebugDragEnabled] = useState(false);
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null);
  const [shakingSlotIds, setShakingSlotIds] = useState<Set<string>>(new Set());
  const dragAlignmentTolerancePx = 8;
  const { playCue } = useSensoryAudio();
  const magnetAudioLastPlayedRef = useRef<number>(0);

  // Drop validation hook
  const { validateDrop } = useResidentDropValidation();

  // Slot debug visualization hook
  const { 
    settings: slotDebugSettings, 
    isHydrated: isSlotDebugHydrated, 
    toggleEnabled: toggleSlotDebug 
  } = useSlotDebugVisualization();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setDebugDragEnabled(params.get('debugDrag') === '1');

    const handlePopState = () => {
      const nextParams = new URLSearchParams(window.location.search);
      setDebugDragEnabled(nextParams.get('debugDrag') === '1');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!debugDragEnabled || typeof window === 'undefined') {
      setPointerPosition(null);
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setPointerPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [debugDragEnabled]);

  const dragAlignmentDiagnostics = useMemo(() => {
    if (!pointerPosition || !dragPreviewCenter) {
      return null;
    }

    const dx = dragPreviewCenter.x - pointerPosition.x;
    const dy = dragPreviewCenter.y - pointerPosition.y;
    const distance = Math.hypot(dx, dy);
    const withinTolerance = Math.abs(dx) <= dragAlignmentTolerancePx && Math.abs(dy) <= dragAlignmentTolerancePx;

    return {
      dx,
      dy,
      distance,
      withinTolerance,
    };
  }, [dragPreviewCenter, pointerPosition, dragAlignmentTolerancePx]);

  const renderDragDebugPanel = useCallback(() => {
    if (!debugDragEnabled) {
      return null;
    }

    const indicatorColor = dragAlignmentDiagnostics?.withinTolerance ? 'rgba(16, 185, 129, 0.9)' : 'rgba(248, 113, 113, 0.9)';

    const formatPair = (value?: { x: number; y: number } | null): string => {
      if (!value) return '—';
      const safeX = typeof value.x === 'number' ? value.x : 0;
      const safeY = typeof value.y === 'number' ? value.y : 0;
      return `${safeX.toFixed(1)}, ${safeY.toFixed(1)}`;
    };

    const formatDiagnostics = () => {
      if (!dragAlignmentDiagnostics) return '—';
      const dx = typeof dragAlignmentDiagnostics.dx === 'number' ? dragAlignmentDiagnostics.dx : 0;
      const dy = typeof dragAlignmentDiagnostics.dy === 'number' ? dragAlignmentDiagnostics.dy : 0;
      const distance = typeof dragAlignmentDiagnostics.distance === 'number' ? dragAlignmentDiagnostics.distance : 0;
      return `${dx.toFixed(1)}, ${dy.toFixed(1)} (dist ${distance.toFixed(1)} px)`;
    };

    return (
      <div
        data-testid="drag-debug-panel"
        style={{
          position: 'fixed',
          right: '1.5rem',
          bottom: '1.5rem',
          minWidth: '280px',
          padding: '1rem',
          borderRadius: '16px',
          background: 'rgba(6, 10, 18, 0.85)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
          color: '#fef3c7',
          fontFamily: 'JetBrains Mono, monospace',
          zIndex: 9999,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ letterSpacing: '0.2em', fontSize: '0.7rem' }}>DRAG DEBUG</span>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '999px',
              background: dragAlignmentDiagnostics ? indicatorColor : 'rgba(148,163,184,0.6)',
              boxShadow: dragAlignmentDiagnostics ? `0 0 12px ${indicatorColor}` : undefined,
            }}
            title={dragAlignmentDiagnostics?.withinTolerance ? 'Within tolerance' : 'Outside tolerance'}
          />
        </div>

        <div style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
          <div>Pointer: {formatPair(pointerPosition)}</div>
          <div>Drag preview: {formatPair(dragPreviewCenter)}</div>
          <div>Cursor offset: {formatPair(dragCursorOffset)}</div>
          <div>
            Δ (dx/dy):{' '}
            {formatDiagnostics()}
          </div>
          <div>Tolerance: ±{dragAlignmentTolerancePx}px</div>
        </div>
      </div>
    );
  }, [debugDragEnabled, dragAlignmentDiagnostics, dragAlignmentTolerancePx, dragCursorOffset, dragPreviewCenter, pointerPosition]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const { scheduleTimeout } = useSandboxTiming();
  const secondsPerTimeUnit = resolvedIdleConfig.globalRules.secondsPerTimeUnit ?? 60;
  const totalDurationSeconds = SLOT_LAB_CONFIG.timer.totalDurationSeconds || 60;
  const initialCycleProgress = useMemo(
    () => {
      const elapsed = SLOT_LAB_CONFIG.timer.elapsedSeconds ?? 0;
      if (totalDurationSeconds <= 0) {
        return 0;
      }
      return Math.min(1, Math.max(0, elapsed / totalDurationSeconds));
    },
    [totalDurationSeconds],
  );
  const poiConfig: SlotLabPoiConfig | undefined = SLOT_LAB_CONFIG.poi;
  const poiScenarioId = useMemo<RackScenarioKey | null>(() => {
    if (!poiConfig) {
      return null;
    }
    const candidate = poiConfig.slotSourceScenario;
    return isValidScenarioId(candidate) ? candidate : 'open';
  }, [poiConfig]);
  const poiScenarioAssignments = useMemo<Record<string, string | null>>(() => {
    if (!poiScenarioId) {
      return {};
    }
    return assignmentsByScenario[poiScenarioId] ?? {};
  }, [assignmentsByScenario, poiScenarioId]);
  const poiHasAssignedResidents = useMemo(() => {
    return Object.values(poiScenarioAssignments).some((residentId) => Boolean(residentId));
  }, [poiScenarioAssignments]);
  const prevPoiOccupancyRef = useRef(poiHasAssignedResidents);
  const [timeEngineState, setTimeEngineState] = useState(() => ({
    currentDay: 1,
    cycleProgress: initialCycleProgress,
    isPaused: true,
    speedMultiplier: 1,
    defaultSpeedMultiplier: 1,
    maxSpeedMultiplier: 3,
    tickIntervalMs: 1000,
    warmupDelayMs: 1200,
  }));
  useEffect(() => {
    const prevValue = prevPoiOccupancyRef.current;
    if (!prevValue && poiHasAssignedResidents) {
      setTimeEngineState((prev) => ({
        ...prev,
        cycleProgress: prev.cycleProgress >= 1 ? 0 : prev.cycleProgress,
      }));
    } else if (prevValue && !poiHasAssignedResidents) {
      setTimeEngineState((prev) => ({
        ...prev,
        isPaused: true,
        cycleProgress: 0,
      }));
    }
    prevPoiOccupancyRef.current = poiHasAssignedResidents;
  }, [poiHasAssignedResidents]);
  const phase = timeEngineState.cycleProgress <= 0.5 ? 'day' : 'night';
  const handleTimeEngineToggle = useCallback(() => {
    if (!poiHasAssignedResidents) {
      return;
    }
    setTimeEngineState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, [poiHasAssignedResidents]);
  const handleTimeEngineSpeedChange = useCallback((value: number) => {
    setTimeEngineState((prev) => ({
      ...prev,
      speedMultiplier: value,
    }));
  }, []);
  useEffect(() => {
    if (timeEngineState.isPaused || !poiHasAssignedResidents) {
      return undefined;
    }
    const cancel = scheduleTimeout(() => {
      setTimeEngineState((prev) => {
        const stepSeconds = (prev.tickIntervalMs / 1000) * prev.speedMultiplier;
        const duration = totalDurationSeconds > 0 ? totalDurationSeconds : 60;
        let nextProgress = prev.cycleProgress + stepSeconds / duration;
        let nextDay = prev.currentDay;
        if (nextProgress >= 1) {
          nextProgress -= 1;
          nextDay += 1;
        }
        return {
          ...prev,
          cycleProgress: nextProgress,
          currentDay: nextDay,
        };
      });
    }, timeEngineState.tickIntervalMs);
    return cancel;
  }, [
    scheduleTimeout,
    timeEngineState.isPaused,
    timeEngineState.tickIntervalMs,
    timeEngineState.speedMultiplier,
    timeEngineState.cycleProgress,
    totalDurationSeconds,
    poiHasAssignedResidents,
  ]);
  const safeCycleProgress = typeof timeEngineState.cycleProgress === 'number' ? timeEngineState.cycleProgress : 0;
  const safeCurrentDay = typeof timeEngineState.currentDay === 'number' ? timeEngineState.currentDay : 0;

  const simulatedDurationUnits = useMemo(() => {
    const durationSeconds = SLOT_LAB_CONFIG.timer.totalDurationSeconds || 1;
    return Math.max(1, durationSeconds / Math.max(1, secondsPerTimeUnit));
  }, [secondsPerTimeUnit]);
  const simulatedCurrentTime = useMemo(
    () => (SLOT_LAB_CONFIG.timer.elapsedSeconds || 0) / Math.max(1, secondsPerTimeUnit),
    [secondsPerTimeUnit],
  );

  // Use canonical residentsById from the bundle
  const residentsById = canonicalResidentsById;

  // Debug instrumentation - moved from JSX render to proper useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('DEBUG: Exporting test roster payload', rosterResidents.length);
      (globalThis as any).__IV_TEST_ROSTER_PAYLOAD__ = rosterResidents.map((r, index) => ({
        index,
        id: r.id,
        name: r.displayName,
        portraitUrl: null,
        hp: r.currentHp ?? r.statSnapshot?.hp ?? null,
        stamina: (r.statSnapshot as any)?.stamina ?? null,
        stats: r.statSnapshot ?? null,
        isHero: r.isHero ?? null,
        fatigue: r.fatigue ?? null,
        isInjured: r.isInjured ?? null,
      }));
    }
  }, [rosterResidents]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).__IV_TEST_RENDERER_LOGGED__) {
      (window as any).__IV_TEST_RENDERER_LOGGED__ = true;
      console.log(
        '__IV_TEST_RENDERER_JSON__',
        JSON.stringify(
          {
            route: '/test',
            residents: rosterResidents.map((r, index) => ({
              index,
              id: r.id,
              name: r.displayName,
              portraitUrl: r.portraitUrl ?? null,
              hp: r.statSnapshot?.hp ?? r.currentHp ?? null,
              stamina: (r.statSnapshot as any)?.stamina ?? null,
              isHero: r.isHero ?? null,
              fatigue: r.fatigue ?? null,
              isInjured: r.isInjured ?? null,
            })),
          },
          null,
          2
        )
      );
    }
  }, [rosterResidents]);


  const handlePoiCollect = useCallback(() => {
    if (!poiConfig) return;
    const scenarioId = isValidScenarioId(poiConfig.slotSourceScenario)
      ? poiConfig.slotSourceScenario
      : 'open';
    const scenarioAssignments = assignmentsByScenario[scenarioId] ?? {};
    const slotEntries = Object.entries(scenarioAssignments);

    trackTelemetryEvent('slot_lab_poi_collect', {
      activityId: poiConfig.activityId,
      scenarioId,
      slotCount: slotEntries.length,
      timestamp: Date.now(),
    });
  }, [poiConfig, assignmentsByScenario]);

  const poiCapsuleData = useMemo(() => {
    if (!poiConfig) return null;
    const scenarioId = isValidScenarioId(poiConfig.slotSourceScenario)
      ? poiConfig.slotSourceScenario
      : 'open';
    const scenarioAssignments = assignmentsByScenario[scenarioId] ?? {};
    const slotEntries = Object.entries(scenarioAssignments);

    const slots: ActivitySlotData[] = slotEntries.map(([slotId, residentId]) => {
      const resident = residentId ? residentsById[residentId] : undefined;
      return {
        id: slotId,
        slotId,
        assignedWorkerName: resident ? formatResidentLabel(resident) : undefined,
        assignedWorkerAvatarUrl: resident?.portraitUrl ?? (resident ? getResidentPortraitUrl(resident) : undefined),
        isOccupied: Boolean(resident),
        isLocked: false,
      };
    });

    // Always create at least one slot for testing
    if (slots.length === 0) {
      slots.push({
        slotId: 'test-poi-slot-0',
        isOccupied: false,
        isLocked: false,
      });
    }

    const cappedProgress = Math.min(1, safeCycleProgress);
    const status: 'idle' | 'in-progress' | 'completed' = cappedProgress >= 1
      ? 'completed'
      : slots.some((slot) => slot.isOccupied)
        ? 'in-progress'
        : 'idle';

    const canCollect = status === 'completed' && slots.some(s => s.isOccupied);

    return {
      config: poiConfig,
      scenarioId,
      slots,
      maxSlots: Math.max(slotEntries.length, 1),
      progressFraction: cappedProgress,
      elapsedSeconds: cappedProgress * totalDurationSeconds,
      totalDurationSeconds,
      status,
      canCollect,
      onCollect: handlePoiCollect,
    };
  }, [assignmentsByScenario, poiConfig, residentsById, safeCycleProgress, totalDurationSeconds, handlePoiCollect]);

  // State for POI capsule slot updates during drag & drop
  const [poiSlotUpdates, setPoiSlotUpdates] = useState<Record<string, { isOccupied: boolean; assignedWorkerName?: string }>>({});

  // Merge POI capsule data with slot updates
  const poiCapsuleDataWithUpdates = useMemo(() => {
    if (!poiCapsuleData) return null;

    return {
      ...poiCapsuleData,
      slots: poiCapsuleData.slots.map(slot => ({
        ...slot,
        ...(poiSlotUpdates[slot.slotId] || {})
      }))
    };
  }, [poiCapsuleData, poiSlotUpdates]);

  // Expose POI data for testing
  // TODO: Fix readonly assignment later
  // if (typeof window !== 'undefined') {
  //   const win = window as unknown as { poiCapsuleData?: unknown };
  //   win.poiCapsuleData = { ...poiCapsuleDataWithUpdates };
  // }

  const hudActivities = useMemo<ScheduledActivity[]>(() => {
    const entries: ScheduledActivity[] = [];
    (Object.entries(assignmentsByScenario) as Array<[RackScenarioKey, Record<string, string | null>]>).forEach(
      ([scenarioId, slotsMap]) => {
        const scenario = RACK_SCENARIOS.find((item) => item.id === scenarioId);
        if (!scenario) return;
        const activityId = getScenarioActivityId(scenario);
        Object.entries(slotsMap ?? {}).forEach(([slotId, residentId]) => {
          if (!residentId || !residentsById[residentId]) return;
          entries.push({
            id: `hud-${activityId}-${slotId}-${residentId}`,
            activityId,
            slotId,
            characterIds: [residentId],
            startTime: 0,
            endTime: simulatedDurationUnits,
            status: 'running',
            isAuto: false,
            isCompleted: false,
            snapshotDeathRisk: 0,
          });
        });
      },
    );
    return entries;
  }, [assignmentsByScenario, residentsById, simulatedDurationUnits]);

  const hudActivityStateMap = useMemo<Record<string, ScheduledActivityState>>(() => {
    const durationSeconds = SLOT_LAB_CONFIG.timer.totalDurationSeconds || 1;
    const elapsedSeconds = Math.min(durationSeconds, SLOT_LAB_CONFIG.timer.elapsedSeconds || 0);
    const progress = durationSeconds > 0 ? Math.min(1, elapsedSeconds / durationSeconds) : 0;
    return hudActivities.reduce<Record<string, ScheduledActivityState>>((acc, activity) => {
      const residentId = activity.characterIds[0];
      if (!residentId) return acc;
      const key = `${activity.slotId}:${residentId}`;
      acc[key] = {
        scheduledId: activity.id,
        activityId: activity.activityId,
        residentId,
        startTime: 0,
        duration: durationSeconds,
        elapsed: elapsedSeconds,
        progress,
        status: activity.status as ScheduledActivityState['status'],
      };
      return acc;
    }, {});
  }, [hudActivities]);

  const resourceBaseline = useMemo(
    () => ({
      gold: 0,
      wood: 0,
      stone: 0,
      ...(resolvedIdleConfig.globalRules.startingResources ?? {}),
    }),
    [resolvedIdleConfig.globalRules.startingResources],
  );

  const timeEngineResourceSummaries = useMemo(
    () => {
      const definitions = resolvedIdleConfig.resources ?? {};
      return [
        {
          id: 'gold',
          label: definitions.gold?.label ?? 'Gold',
          icon: definitions.gold?.icon ?? '🪙',
        },
        {
          id: 'wood',
          label: definitions.wood?.label ?? 'Wood',
          icon: definitions.wood?.icon ?? '🪵',
        },
        {
          id: 'stone',
          label: definitions.stone?.label ?? 'Stone',
          icon: definitions.stone?.icon ?? '🪨',
        },
      ];
    },
    [resolvedIdleConfig.resources],
  );

  const hudVillageState = useMemo<VillageState>(() => {
    const activityMap = hudActivities.reduce<Record<string, ScheduledActivity>>((acc, activity) => {
      acc[activity.id] = activity;
      return acc;
    }, {});
    return {
      currentTime: simulatedCurrentTime,
      resources: resourceBaseline,
      residents: residentsById,
      activities: activityMap,
      eventLog: [],
      questOffers: {},
    };
  }, [hudActivities, residentsById, resourceBaseline, simulatedCurrentTime]);

  const getActivityState = useCallback(
    (slotId: string, residentId: string) => hudActivityStateMap[`${slotId}:${residentId}`] ?? null,
    [hudActivityStateMap],
  );

  const hudState = useActiveHUDState({
    config: resolvedIdleConfig,
    villageState: hudVillageState,
    secondsPerTimeUnit,
    currentTime: hudVillageState.currentTime ?? 0,
    getActivityState,
  });

  
  // Log when buttons section renders
  useEffect(() => {
    // Debug removed
  }, []);

  // Telemetry for canonical store usage
  useEffect(() => {
    if (usedFallback) {
      trackTelemetryEvent('slot_lab_resident_fallback_used', {
        context: 'slot_lab',
        reason: storeError ? 'bootstrap_error' : 'character_storage_empty',
        fallbackCount: storeResidents.length,
        error: storeError,
        timestamp: Date.now(),
      });
    } else {
      trackTelemetryEvent('slot_lab_residents_loaded', {
        context: 'slot_lab',
        residentCount: storeResidents.length,
        charactersConverted,
        timestamp: Date.now(),
      });
    }
  }, [usedFallback, storeError, storeResidents.length, charactersConverted]);

  const styleLabVars = useMemo<CSSProperties>(
    () => ({
      ...(styleTokens.cssVars as CSSProperties),
    }),
    [styleTokens.cssVars],
  );

  // Add refs for drag tracking
  const lastDragEndTimeRef = useRef<number>(0);
  const lastDraggedResidentRef = useRef<string | null>(null);
  const ignoreNextSelectRef = useRef<string | null>(null);
  const blockedAutoAssignReasonRef = useRef<Map<string, { reason: string; until: number }>>(new Map());

  const surfaceStyle = useMemo<CSSProperties>(
    () => ({
      minHeight: '100vh',
      background: styleTokens.heroBackground,
      color: 'var(--minimal-text-primary)',
    }),
    [styleTokens.heroBackground],
  );

  const registerScenarioApi = useCallback((scenarioId: RackScenarioKey, api: ScenarioPanelApi | null) => {
    if (api) {
      scenarioApisRef.current[scenarioId] = api;
    } else {
      delete scenarioApisRef.current[scenarioId];
    }
  }, []);

  const handleScenarioAssign = useCallback((scenarioId: RackScenarioKey, slotId: string, residentId: string) => {
    console.log('🔴 [TestRosterPage] handleScenarioAssign CALLED:', { scenarioId, slotId, residentId });
    console.trace('Stack trace for handleScenarioAssign');

    // CRITICAL FIX: Do NOT assign if the resident was just dragged and the drop was outside any slot
    // Check if this resident is in the returningResidentIds set (which means the drag failed)
    if (returningResidentIds.has(residentId)) {
      console.log('🚫 [TestRosterPage] BLOCKING handleScenarioAssign: Resident is in returning set (drag failed)');
      return;
    }

    setAssignmentsByScenario((prev) => {
      const next = {
        ...prev,
        [scenarioId]: {
          ...(prev[scenarioId] ?? {}),
          [slotId]: residentId,
        },
      };
      console.log('🔴 [TestRosterPage] assignmentsByScenario updated:', next);
      return next;
    });
  }, [returningResidentIds]);

  const handleScenarioClear = useCallback((scenarioId: RackScenarioKey, slotId: string) => {
    setAssignmentsByScenario((prev) => ({
      ...prev,
      [scenarioId]: {
        ...(prev[scenarioId] ?? {}),
        [slotId]: null,
      },
    }));
  }, []);

  const handleScenarioAssignmentResult = useCallback(
    (scenarioId: RackScenarioKey, result: ResidentSlotAssignResult, residentId?: string) => {

      // CRITICAL FIX: If assignment failed, IMMEDIATELY and SYNCHRONOUSLY remove the resident from the slot
      // This prevents the bug where dropping outside slots still assigns the resident
      if (!result.success && result.slotId && residentId) {
        console.log('🚫 [TestRosterPage] Assignment FAILED - IMMEDIATELY REMOVING resident from slot:', { slotId: result.slotId, residentId });
        setAssignmentsByScenario((prev) => {
          const next = {
            ...prev,
            [scenarioId]: {
              ...(prev[scenarioId] ?? {}),
              [result.slotId]: null,
            },
          };
          console.log('🚫 [TestRosterPage] assignmentsByScenario after removal:', next);
          return next;
        });
      }

      setLastAttemptByScenario((prev) => ({
        ...prev,
        [scenarioId]: { result, residentId, timestamp: Date.now() },
      }));

      const eventName = result.success ? 'slot_lab_resident_assigned' : 'slot_lab_resident_assign_failed';
      const telemetryPayload = {
        scenarioId,
        residentId,
        slotId: result.slotId,
        reason: !result.success ? (result as { success: false; reason: string; details?: string }).reason : undefined,
        details: !result.success ? (result as { success: false; reason: string; details?: string }).details : undefined,
        timestamp: Date.now(),
      };

      trackTelemetryEvent(eventName, telemetryPayload);
      // Emit JSON log for Playwright telemetry listener (expects console log containing slot_lab_*)
      try {
        console.log(JSON.stringify({ eventType: eventName, ...telemetryPayload }));
      } catch (error) {
        // swallow logging errors to avoid breaking assignment flow
      }

      // Spring rollback: if assignment failed, mark resident as returning for spring animation
      if (!result.success && residentId) {
        setReturningResidentIds((prev) => new Set(prev).add(residentId));
        scheduleTimeout(() => {
          setReturningResidentIds((prev) => {
            const next = new Set(prev);
            next.delete(residentId);
            return next;
          });
        }, 600); // matches spring animation duration
      }

      // Success: play audio cue and trigger shake animation
      if (result.success) {
        playCue('drop_success');
        setShakingSlotIds((prev) => new Set(prev).add(result.slotId));
        scheduleTimeout(() => {
          setShakingSlotIds((prev) => {
            const next = new Set(prev);
            next.delete(result.slotId);
            return next;
          });
        }, 450); // shake duration
      } else {
        // Failure: play blocked/error cue if available
        playCue('drop_invalid');
      }
    },
    [scheduleTimeout],
  );

  // STEP 5: Commit assignment after flight completes
  const commitAssignment = useCallback((residentId: string, slotId: string) => {
    console.log('✅ [TestRosterPage] Committing assignment:', { residentId, slotId });
    
    // Parse scenarioId from slotId (format: slot-lab-{scenarioId}-slot-{index})
    const match = slotId.match(/^slot-lab-([^-]+)-slot/);
    if (match) {
      const scenarioId = match[1] as RackScenarioKey;
      const api = scenarioApisRef.current[scenarioId];
      
      if (api) {
        // Now do the actual assignment
        const result = api.assignResident(residentId, slotId);
        if (result) {
          handleScenarioAssignmentResult(scenarioId, result, residentId);
        }
      }
    }
    
    // Reset visual state
    setDragVisualState({ mode: 'idle' });
  }, [handleScenarioAssignmentResult]);

  const handleRosterSelect = useCallback(
    (residentId: string) => {
      const now = Date.now();

      // RESIDENT-SPECIFIC COOLDOWN: Only block the resident that was actually dragged
      // Based on dnd-kit best practices for pointerWithin collision detection
      if (lastDraggedResidentRef.current && residentId === lastDraggedResidentRef.current && now - lastDragEndTimeRef.current < 150) {
        console.log('⏱️ [TestRosterPage] Blocked auto-assignment for dragged resident:', residentId, 'Event too close to drag end');
        return;
      }

      // IMPORTANT: Do not auto-assign if this is triggered after a drag operation
      // This prevents the bug where dropping outside slots still assigns to the first available slot
      if (activeId === residentId) {
        return;
      }

      // Try to assign to open scenario first (find first empty slot)
      const openScenario = scenarioApisRef.current.open;
      if (openScenario) {
        const openAssignments = assignmentsByScenario.open;
        const firstEmptySlot = Object.keys(openAssignments).find(slotId => !openAssignments[slotId]);

        if (firstEmptySlot) {
          console.log('� [TestRosterPage] TRIGGERED AUTO-ASSIGN FOR', residentId, 'to slot:', firstEmptySlot);
          const result = openScenario.assignResident(residentId, firstEmptySlot);
          if (result) {
            handleScenarioAssignmentResult('open', result, residentId);
            return;
          }
        } else {
        }
      }

      // If no open scenario slots available, try restricted scenario
      const restrictedScenario = scenarioApisRef.current.restricted;
      if (restrictedScenario) {
        const restrictedAssignments = assignmentsByScenario.restricted;
        const firstEmptySlot = Object.keys(restrictedAssignments).find(slotId => !restrictedAssignments[slotId]);

        if (firstEmptySlot) {
          const result = restrictedScenario.assignResident(residentId, firstEmptySlot);
          if (result) {
            handleScenarioAssignmentResult('restricted', result, residentId);
            return;
          }
        } else {
        }
      }

    },
    [assignmentsByScenario, handleScenarioAssignmentResult],
  );

  const openPickerWithResidents = useCallback((slotId: string, candidates: ResidentAssignmentCandidate[], meta: ResidentPickerSlotMeta, scenarioId: RackScenarioKey) => {
    setPickerResidents(candidates);
    setPickerSlotMeta(meta);
    setPickerContext({ scenarioId, slotId });
    setIsPickerOpen(true);
    trackTelemetryEvent('slot_lab_picker_opened', {
      context: 'slot_lab',
      slotId,
      candidateCount: candidates.length,
      timestamp: Date.now(),
    });
  }, []);

  const closePicker = useCallback(() => {
    setIsPickerOpen(false);
    setPickerResidents([]);
    setPickerSlotMeta(null);
    setPickerContext(null);
  }, []);

  const resolvePickerCandidates = useCallback(
    (scenario: RackScenario) =>
      rosterResidents.map((resident) => {
        const validation = scenario.validator?.(resident);
        const isValid = validation ? validation.isValid : true;
        return {
          id: resident.id,
          displayName: formatResidentLabel(resident),
          statusLabel: resident.status ?? 'available',
          fatigue: resident.fatigue ?? 0,
          portraitUrl: resident.portraitUrl,
          compatibility: {
            residentId: resident.id,
            reason: isValid ? 'valid' : 'VALIDATION_FAILED',
            score: isValid ? 1 : 0,
            details: validation?.message ?? null,
          },
        } satisfies ResidentAssignmentCandidate;
      }),
    [rosterResidents],
  );

  const handlePickerAssign = useCallback(
    async (residentId: string) => {
      if (!pickerContext) return;
      const api = scenarioApisRef.current[pickerContext.scenarioId];
      if (!api) return;
      const result = api.assignResident(residentId, pickerContext.slotId);
      if (result) {
        handleScenarioAssignmentResult(pickerContext.scenarioId, result, residentId);
      }
      closePicker();
    },
    [closePicker, handleScenarioAssignmentResult, pickerContext],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const residentId = event.active.id as string;
    
    // STEP 2: Set premium visual state
    setDragVisualState({
      mode: 'dragging',
      residentId,
    });
  }, []);


  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!event.active || !dragPreviewCenter) return;

    const dragConfig = getDragConfig();
    const magnetRadius = dragConfig.magnetism.radiusPx;

    // Find all empty slots across all scenarios
    const slotElements = document.querySelectorAll('[data-slot-id]');
    let closestSlot: Element | null = null;
    let closestDistance = Infinity;
    let closestCenter: { x: number; y: number } | null = null;

    slotElements.forEach((slotEl) => {
      const slotId = slotEl.getAttribute('data-slot-id');
      if (!slotId) return;

      // Check if slot is empty (no assigned resident) across all scenarios
      let isSlotEmpty = true;
      for (const scenario of RACK_SCENARIOS) {
        const assignments = assignmentsByScenario[scenario.id] ?? {};
        if (assignments[slotId]) {
          isSlotEmpty = false;
          break;
        }
      }

      if (!isSlotEmpty) return;

      const rect = slotEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(dragPreviewCenter.x - centerX, 2) +
        Math.pow(dragPreviewCenter.y - centerY, 2)
      );

      if (distance < magnetRadius && distance < closestDistance) {
        closestSlot = slotEl;
        closestDistance = distance;
        closestCenter = { x: centerX, y: centerY };
      }
    });

    if (closestCenter) {
      setMagnetTargetCenter(closestCenter);
      // Play magnetism audio cue with cooldown
      const now = Date.now();
      if (!magnetAudioLastPlayedRef.current || now - magnetAudioLastPlayedRef.current > dragConfig.magnetism.cueCooldownMs) {
        playCue('hover_valid');
        magnetAudioLastPlayedRef.current = now;
      }
    } else {
      setMagnetTargetCenter(null);
    }
  }, [dragPreviewCenter, assignmentsByScenario, playCue, setMagnetTargetCenter]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    // Mark the exact millisecond when drag ended and which resident was dragged
    lastDragEndTimeRef.current = Date.now();
    lastDraggedResidentRef.current = (event.active?.id as string) || null;

    const { active, over } = event;

    // CRITICAL FIX: If dropped outside any droppable (over is null), do NOT trigger any assignment
    // This prevents the bug where dropping outside slots still assigns to the first available slot
    if (!over) {
      console.log('🚫 [TestRosterPage] Dropped outside droppable - COMPLETELY blocking any assignment');
      setDragVisualState({ mode: 'idle' }); // STEP 3: Reset visual state
      return;
    }

    const residentId = active.id as string;
    const slotId = over.id as string;

    // Parse scenarioId from slotId (format: slot-lab-{scenarioId}-slot-{index})
    const match = slotId.match(/^slot-lab-([^-]+)-slot/);
    if (match) {
      const scenarioId = match[1] as RackScenarioKey;
      const api = scenarioApisRef.current[scenarioId];
      const scenario = RACK_SCENARIOS.find((s) => s.id === scenarioId);

      if (api && scenario) {
        const resident = residentsById[residentId];
        if (resident) {

          // Get the activity definition for this scenario
          const activityDefinition = buildScenarioActivityDefinition(scenario);

          // 1. First check custom scenario validation
          if (scenario.validator) {
            const customValidation = scenario.validator(resident);
            if (!customValidation.isValid) {
              // Record failed attempt
              handleScenarioAssignmentResult(scenarioId, {
                success: false,
                reason: 'VALIDATION_FAILED',
                details: customValidation.message ?? 'Requisito non soddisfatto',
              }, residentId);

              setDragVisualState({ mode: 'idle' }); // STEP 3: Reset on validation fail
              return; // Don't assign if custom validation fails
            }
          }

          // 2. Then check general drop validation with proper activity context
          const validationResult = validateDrop({
            resident,
            activity: activityDefinition,
            context: 'slot_lab',
          });


          if (!validationResult.isValid) {
            // Log rejected invalid drop
            trackTelemetryEvent('slot_lab_drop_rejected', {
              context: 'slot_lab',
              residentId,
              slotId,
              scenarioId,
              reason: validationResult.failedRule,
              details: validationResult.message,
              timestamp: Date.now(),
            });

            // Record failed attempt
            handleScenarioAssignmentResult(scenarioId, {
              success: false,
              reason: 'VALIDATION_FAILED',
              details: validationResult.message,
            }, residentId);

            setDragVisualState({ mode: 'idle' }); // STEP 3: Reset on validation fail
            return; // Don't assign if invalid
          }

        }

        // STEP 3: LAUNCH FLIGHT INSTEAD OF IMMEDIATE COMMIT!
        // Get current overlay position (where the proxy was released)
        const overlayElement = document.querySelector('[data-drag-overlay]');
        const releasePos = overlayElement ? {
          x: parseFloat(overlayElement.getAttribute('data-overlay-x') || '0'),
          y: parseFloat(overlayElement.getAttribute('data-overlay-y') || '0'),
        } : { x: 0, y: 0 };

        // Get target slot center
        const slotElement = document.querySelector(`[data-slot-id="${slotId}"]`);
        const slotRect = slotElement?.getBoundingClientRect();
        const targetPos = slotRect ? {
          x: slotRect.left + slotRect.width / 2 - 40, // Center - half card width
          y: slotRect.top + slotRect.height / 2 - 40, // Center - half card height
        } : { x: 0, y: 0 };

        // STEP 3: Launch flight animation
        setDragVisualState({
          mode: 'flight',
          residentId,
          slotId,
          fromX: releasePos.x,
          fromY: releasePos.y,
          toX: targetPos.x,
          toY: targetPos.y,
        });

        console.log('🚀 [TestRosterPage] Flight launched:', {
          residentId,
          slotId,
          from: releasePos,
          to: targetPos,
        });
      }
    } else {
      // No valid slot scenario
      setDragVisualState({ mode: 'idle' });
    }
  }, [handleScenarioAssignmentResult, setActiveId, residentsById, validateDrop]);

  const _getRosterDragFeedbackState = useCallback((residentId: string): DragFeedbackState => {
    if (returningResidentIds.has(residentId)) return 'returning';
    if (activeId === residentId) return 'valid';
    return 'idle';
  }, [activeId, returningResidentIds]);

  const rosterFeedback = useMemo(() => {
    const attempt = lastAttemptByScenario.open;
    if (!attempt) return null;
    if (attempt.result.success) {
      const resident = attempt.residentId ? residentsById[attempt.residentId] : undefined;
      return resident ? `Rack A · assegnato ${formatResidentLabel(resident)}` : 'Rack A · assegnato';
    }
    // Type guard for failure case
    if (!attempt.result.success) {
      const reason = (attempt.result as any).reason;
      const details = (attempt.result as any).details ? ` · ${(attempt.result as any).details}` : '';
      return `Rack A · ${reason}${details}`;
    }
    return 'Rack A · invalid';
  }, [lastAttemptByScenario, residentsById]);

  const handleMiniLabPresetChange = useCallback((presetId: ThemePresetId) => {
    lastManualPresetRef.current = presetId;
    setIsRandomized(false);
    setPreset(presetId);
    const preset = themePresetMap[presetId];
    trackTelemetryEvent('slot_lab_preset_selected', {
      context: 'slot_lab',
      presetId,
      presetLabel: preset?.label,
      timestamp: Date.now(),
    });
  }, [setPreset]);

  const handleRandomizeTheme = useCallback(() => {
    if (themePresets.length === 0) {
      return;
    }
    const selectable = themePresets.filter((preset) => preset.id !== presetId);
    const pool = selectable.length > 0 ? selectable : themePresets;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const nextPreset = pool[randomIndex];
    setIsRandomized(true);
    setPreset(nextPreset.id);
    trackTelemetryEvent('slot_lab_preset_randomized', {
      context: 'slot_lab',
      presetId: nextPreset.id,
      presetLabel: nextPreset.label,
      timestamp: Date.now(),
    });
  }, [presetId, setPreset]);

  const handleResetRandomization = useCallback(() => {
    setIsRandomized(false);
    const fallbackPreset = lastManualPresetRef.current;
    setPreset(fallbackPreset);
    trackTelemetryEvent('slot_lab_preset_reset', {
      context: 'slot_lab',
      presetId: fallbackPreset,
      timestamp: Date.now(),
    });
  }, [setPreset]);

  const _handleResetRosterState = useCallback(() => {
    // Reset roster using canonical store refresh
    bootstrapResidents({ startingFatigueOverride: harnessStartingFatigue });
    trackTelemetryEvent('slot_lab_roster_reset', {
      context: 'slot_lab',
      timestamp: Date.now(),
    });
  }, [bootstrapResidents, harnessStartingFatigue]);

  const _handleReloadRoster = useCallback(() => {
    // Reload roster using canonical store refresh
    bootstrapResidents({ startingFatigueOverride: harnessStartingFatigue });
    trackTelemetryEvent('slot_lab_roster_reload_requested', {
      context: 'slot_lab',
      timestamp: Date.now(),
    });
  }, [bootstrapResidents, harnessStartingFatigue]);

  // TODO(style-lab-flexibility): route typography scale, color filters, density + motion presets via Style Lab tokens once available.

  return (
    <div style={styleLabVars} data-testid="test-roster-page">
      {renderDragDebugPanel()}
      {activeId && (
        <style>{`
          body, body * {
            cursor: grabbing !important;
          }
        `}</style>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <StyleLabSurface
          variant="panel"
          className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10"
          style={surfaceStyle}
          testId="test-roster-surface"
        >
          <StyleLabStack spacing="lg" className="w-full">
            <StyleLabSurface variant="card" className="space-y-2" testId="style-lab-toolbar">
              <StyleLabStack direction="horizontal" wrap spacing="sm" className="flex flex-wrap" testId="style-lab-controls">
                {themePresets.map((preset) => {
                  const isActive = preset.id === miniLabPreset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={isActive}
                      data-active={isActive}
                      onClick={() => handleMiniLabPresetChange(preset.id as ThemePresetId)}
                      className={`rounded-full border px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors ${isActive ? 'border-white/70 bg-white/10 text-white' : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'
                        }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleRandomizeTheme}
                  className="rounded-full border border-white/30 px-4 py-1 text-[11px] uppercase tracking-[0.3em] text-white/80 transition-colors hover:text-white"
                >
                  Randomize
                </button>
                {isRandomized && (
                  <button
                    type="button"
                    onClick={handleResetRandomization}
                    className="rounded-full border border-dashed border-white/30 px-4 py-1 text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white"
                  >
                    Reset
                  </button>
                )}
              </StyleLabStack>
            </StyleLabSurface>
            <div
              data-testid="style-lab-time-engine"
              data-time-engine-progress={safeCycleProgress.toFixed(4)}
              data-time-engine-current-day={safeCurrentDay}
              data-time-engine-is-paused={timeEngineState.isPaused ? 'true' : 'false'}
              data-time-engine-speed-multiplier={timeEngineState.speedMultiplier}
              data-time-engine-phase={phase}
            >
              <StyleLabSurface
                variant="card"
                className="w-full"
                testId="style-lab-time-engine-inner"
              >
                <TimeEngineStrip
                  phaseIcon={phase === 'day' ? <span className="text-xl" aria-hidden>☀️</span> : <span className="text-xl" aria-hidden>🌙</span>}
                  isPlaying={!timeEngineState.isPaused}
                  progressFraction={safeCycleProgress}
                  totalSeconds={totalDurationSeconds}
                  onToggle={handleTimeEngineToggle}
                  variant="solar"
                  label="Day/Night Cycle"
                  clockProps={{
                    currentDay: timeEngineState.currentDay,
                    isPaused: timeEngineState.isPaused,
                    speedMultiplier: timeEngineState.speedMultiplier,
                    defaultSpeedMultiplier: timeEngineState.defaultSpeedMultiplier,
                    maxSpeedMultiplier: timeEngineState.maxSpeedMultiplier,
                    tickIntervalMs: timeEngineState.tickIntervalMs,
                    warmupDelayMs: timeEngineState.warmupDelayMs,
                    accentHex: styleTokens.accentColor,
                    onSpeedChange: handleTimeEngineSpeedChange,
                  }}
                  hudState={hudState}
                  villageState={hudVillageState}
                  secondsPerTimeUnit={secondsPerTimeUnit}
                  compact
                  showClockDetails={false}
                  maxVisibleActivities={2}
                  resourceSummaries={timeEngineResourceSummaries}
                />
              </StyleLabSurface>
            </div>

            {/* Intentional: no bulk reset controls to keep harness focused on drag/drop */}

            {isLoading && (
              <StyleLabSurface variant="card" className="text-center text-sm" style={{ color: 'var(--minimal-text-secondary)' }}>
                Caricamento roster…
              </StyleLabSurface>
            )}

            {error && (
              <StyleLabSurface variant="card" className="text-center p-6">
                <div className="space-y-4">
                  <div className="text-lg font-semibold" style={{ color: 'var(--minimal-danger-color)' }}>
                    ⚠️ Errore nel Caricamento
                  </div>
                  <div className="text-sm" style={{ color: 'var(--minimal-text-secondary)' }}>
                    {error}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--minimal-text-tertiary)' }}>
                    Per eseguire i test, caricare prima i residenti dal Character Manager.
                  </div>
                  <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'var(--minimal-surface-elevated)' }}>
                    <div className="text-xs font-mono" style={{ color: 'var(--minimal-text-secondary)' }}>
                      Azioni suggerite:
                    </div>
                    <ul className="text-xs mt-2 space-y-1" style={{ color: 'var(--minimal-text-tertiary)' }}>
                      <li>• Verificare che il Character Manager contenga residenti</li>
                      <li>• Ricaricare la pagina dopo aver configurato i dati</li>
                      <li>• Controllare la console per eventuali errori di caricamento</li>
                    </ul>
                  </div>
                </div>
              </StyleLabSurface>
            )}

            {usedFallback && !error && (
              <StyleLabSurface variant="card" className="text-center text-sm" style={{ color: 'var(--minimal-warning-color)' }}>
                <div className="font-semibold">Mock roster attivo</div>
                <div className="text-xs text-white/70">
                  Il Character Manager è vuoto: stiamo usando il roster minimal predefinito per consentire il test del drag.
                </div>
              </StyleLabSurface>
            )}

            <StyleLabSurface variant="card" className="flex items-center justify-between gap-4" testId="slot-debug-visualization-toggle">
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--minimal-text-primary)' }}>
                  Slot debug visualization
                </div>
                <div className="text-xs text-white/70">
                  Evidenzia ghiera, medaglia e token per il confronto DOM.
                </div>
              </div>
              <button
                type="button"
                aria-pressed={slotDebugSettings.enabled}
                disabled={!isSlotDebugHydrated}
                onClick={() => void toggleSlotDebug()}
                className={`rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition ${slotDebugSettings.enabled ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-300/40' : 'border border-white/20 text-white/60 hover:text-white'}`}
              >
                {slotDebugSettings.enabled ? 'On' : 'Off'}
              </button>
            </StyleLabSurface>

            {!isLoading && !error && residents.length === 0 && (
              <StyleLabSurface variant="card" className="text-center p-6">
                <div className="space-y-4">
                  <div className="text-lg font-semibold" style={{ color: 'var(--minimal-warning-color)' }}>
                    📋 Nessun Residente Caricato
                  </div>
                  <div className="text-sm" style={{ color: 'var(--minimal-text-secondary)' }}>
                    Il Character Manager non contiene residenti da testare.
                  </div>
                  <div className="text-xs" style={{ color: 'var(--minimal-text-tertiary)' }}>
                    Configurare i residenti nel Character Manager per eseguire i test di drag & drop.
                  </div>
                </div>
              </StyleLabSurface>
            )}

            {!isLoading && !error && residents.length > 0 && (
              <>
                {/* RACK A - Right next to roster */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <StyleLabSurface variant="card" className="flex-1 overflow-hidden" testId="village-roster-wrapper">
                                                            <VillageRosterSection
                      residents={rosterResidents}
                      assignmentFeedback={rosterFeedback ?? undefined}
                      onDragStart={(residentId) => setActiveId(residentId)}
                      onDragEnd={() => setActiveId(null)}
                      onResidentSelect={handleRosterSelect}
                      getResidentCompatibility={() => undefined}
                      componentId="slot-lab-roster"
                      pgCardSkinId="minimal_frontier"
                      pillar="frontier"
                      context={{ locationType: 'slot-lab', residentType: 'worker', scenarioType: 'test' }}
                      dragVisualState={dragVisualState}
                    />
                  </StyleLabSurface>
                  
                  {/* RACK A - Right side of roster */}
                  <RackScenarioPanel
                    scenario={RACK_SCENARIOS[0]} // Rack A (open scenario)
                    residentsById={residentsById}
                    hoveredResidentId={activeId}
                    assignments={assignmentsByScenario[RACK_SCENARIOS[0].id] ?? {}}
                    onAssign={handleScenarioAssign}
                    onClear={handleScenarioClear}
                    onAssignmentResult={handleScenarioAssignmentResult}
                    lastAttempt={lastAttemptByScenario[RACK_SCENARIOS[0].id]}
                    registerScenarioApi={registerScenarioApi}
                    pickerCandidates={resolvePickerCandidates(RACK_SCENARIOS[0])}
                    onOpenPicker={({ slotId, slotMeta, candidates }) =>
                      openPickerWithResidents(slotId, candidates, slotMeta, RACK_SCENARIOS[0].id)
                    }
                    shakingSlotIds={shakingSlotIds}
                    miniLabPreset={miniLabPreset}
                    slotDebugVisualization={slotDebugSettings}
                  />
                </div>

                {/* RACK B - Below */}
                <section>
                  <RackScenarioPanel
                    scenario={RACK_SCENARIOS[1]} // Rack B (restricted scenario)
                    residentsById={residentsById}
                    hoveredResidentId={activeId}
                    assignments={assignmentsByScenario[RACK_SCENARIOS[1].id] ?? {}}
                    onAssign={handleScenarioAssign}
                    onClear={handleScenarioClear}
                    onAssignmentResult={handleScenarioAssignmentResult}
                    lastAttempt={lastAttemptByScenario[RACK_SCENARIOS[1].id]}
                    registerScenarioApi={registerScenarioApi}
                    pickerCandidates={resolvePickerCandidates(RACK_SCENARIOS[1])}
                    onOpenPicker={({ slotId, slotMeta, candidates }) =>
                      openPickerWithResidents(slotId, candidates, slotMeta, RACK_SCENARIOS[1].id)
                    }
                    shakingSlotIds={shakingSlotIds}
                    miniLabPreset={miniLabPreset}
                    slotDebugVisualization={slotDebugSettings}
                  />
                </section>

                {poiCapsuleDataWithUpdates && (
                  <StyleLabSurface
                    variant="card"
                    className="poi-detail-panel"
                    testId="poi-detail-panel"
                  >
                    <ActivityCapsuleDetailSkinAware
                      activityId={poiCapsuleDataWithUpdates.config.activityId}
                      name={poiCapsuleDataWithUpdates.config.label}
                      type="poi-activity"
                      subtitle={poiCapsuleDataWithUpdates.config.subtitle}
                      status={poiCapsuleDataWithUpdates.status}
                      progress={poiCapsuleDataWithUpdates.progressFraction}
                      duration={poiCapsuleDataWithUpdates.totalDurationSeconds}
                      elapsed={poiCapsuleDataWithUpdates.elapsedSeconds}
                      slots={poiCapsuleDataWithUpdates.slots.map((slot) => {
                        const assignedName = slot.assignedWorkerName;
                        return {
                          id: slot.slotId,
                          state: slot.isOccupied ? 'idle' : 'empty',
                          initial: assignedName ? assignedName.charAt(0).toUpperCase() : '',
                          progress: 0, // Default progress for POI detail
                          assignedWorkerName: assignedName,
                          assignedWorkerAvatarUrl: slot.assignedWorkerAvatarUrl,
                        };
                      })}
                      maxSlots={poiCapsuleDataWithUpdates.maxSlots}
                      durationDisplay={`${Math.floor(poiCapsuleDataWithUpdates.totalDurationSeconds / 60)}m`}
                      rewardDisplay="Resources + XP"
                      etaDisplay={`${Math.floor((poiCapsuleDataWithUpdates.totalDurationSeconds - poiCapsuleDataWithUpdates.elapsedSeconds) / 60)}m`}
                      telemetry={[
                        {
                          id: '1',
                          timestamp: new Date(),
                          message: 'Activity initialized',
                          type: 'assign',
                        },
                      ]}
                      onCollect={poiCapsuleDataWithUpdates.onCollect}
                      isOpen={false}
                      inlineMode
                      showTelemetry={true}
                      showSlots={true}
                      showInfo={true}
                      compact={false}
                      ariaLive="polite"
                      enableDrag={false}
                      dataTestId="poi-detail-skin-wrapper-demo"
                    />
                  </StyleLabSurface>
                )}
              </>
            )}

            
            <section className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <div>
                Status Harness • {activeId ? 'Dragging' : 'Idle'}
              </div>
              <div className="text-right">
                {rosterFeedback}
              </div>
            </section>
          </StyleLabStack>
        </StyleLabSurface>
        <CustomDragOverlay
          residentsById={residentsById}
          usePgCardPreview={true}
          dragVisualState={dragVisualState}
        />
      </DndContext>

      {/* STEP 7: Flight Proxy Layer - Premium handoff animation */}
      {dragVisualState.mode === 'flight' && (
        <FlightProxy
          residentId={dragVisualState.residentId}
          fromX={dragVisualState.fromX}
          fromY={dragVisualState.fromY}
          toX={dragVisualState.toX}
          toY={dragVisualState.toY}
          slotId={dragVisualState.slotId}
          onComplete={commitAssignment}
          residentsById={residentsById}
        />
      )}

      <CertifiedWorkerPickerSheet
        isOpen={isPickerOpen}
        residents={pickerResidents}
        slotMeta={pickerSlotMeta}
        onAssign={handlePickerAssign}
        onClose={closePicker}
      />

      {/* Skin System Dev Tools - Commented out for clean testing */}
      {/* {process.env.NODE_ENV === 'development' && (
        <>
          <SkinDevTools 
            showAdvanced={true}
            enableDebug={true}
            showTelemetry={true}
            showReplacementAPI={true}
            showRegistry={true}
          />
          <SkinDebugPanel 
            showPerformance={true}
            showTelemetry={true}
            showValidation={true}
            showDiagnostics={true}
            maxEvents={50}
            updateInterval={1000}
            autoScroll={true}
          />
        </>
      )} */}
    </div>
  );
};

const TestRosterPage: React.FC = () => {
  console.log('🔥 TestRosterPage LOADING!');

  // Expose renderer stack data for analysis
  useEffect(() => {
    exposeRendererStackData();
  }, []);

  return (
    <TooltipPrimitive.Provider>
      <SkinSystemProvider>
        <SandboxTimingProvider>
          <DragProvider>
            <TestRosterPageContent />
          </DragProvider>
        </SandboxTimingProvider>
      </SkinSystemProvider>
    </TooltipPrimitive.Provider>
  );
};

export default TestRosterPage;

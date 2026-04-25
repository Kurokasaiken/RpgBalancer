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
import type { ResidentState, VillageState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import { getCharacterStorageEventName } from '@/engine/idle/characterPersistence';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { DEFAULT_TEST_HARNESS_CONFIG as SLOT_LAB_CONFIG } from '@/balancing/config/idleVillage/testHarnessConfig';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { themePresets, themePresetMap, type ThemePresetId } from '@/data/themePresets';
import ResidentSlotRack from '@/ui/idleVillage/components/ResidentSlotRack';
import { resolveResidentRackDisplayInfo } from '@/ui/idleVillage/slots/residentSlotDisplay';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ActivityDefinition, StatRequirement } from '@/balancing/config/idleVillage/types';
import type { ResidentSlotAssignResult } from '@/ui/idleVillage/slots/types';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { DragFeedbackState } from '@/ui/idleVillage/components/ResidentRosterTypes';
import { useActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { useSandboxTiming } from '@/ui/idleVillage/hooks/useSandboxTiming';
import type { ResidentAssignmentCandidate, ResidentPickerSlotMeta } from '@/ui/idleVillage/components/InlineResidentChips';
import CertifiedWorkerPickerSheet from '@/ui/idleVillage/testHarness/components/CertifiedWorkerPickerSheet';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';

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
    subtitle: 'Accetta qualunque residente disponibile',
    minStaminaBeforeExhausted: 20, // Can work until stamina drops to 20%
  },
  {
    id: 'restricted',
    title: 'Rack B · Scenario restrittivo',
    subtitle: 'Richiede HP ≥ 200',
    minStaminaBeforeExhausted: 30, // Higher stamina requirement for restricted slots
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

const slotLabFallbackResidents = (defaultFatigue: number): ResidentState[] =>
  MINIMAL_GAMEPLAY_RESIDENTS.map((definition, index) => {
    const statSnapshot = { ...definition.stats };
    const fallbackHp = typeof statSnapshot.hp === 'number' ? statSnapshot.hp : 200;
    return {
      id: definition.id ?? `fallback-resident-${index}`,
      displayName: definition.name,
      status: 'available',
      fatigue: definition.fatigue ?? defaultFatigue ?? 0,
      statSnapshot,
      statTags: definition.traits,
      currentHp: fallbackHp,
      maxHp: fallbackHp,
      portraitUrl: undefined,
      statProfileId: definition.traits?.[0],
      level: definition.level,
      isInjured: definition.isInjured ?? false,
    } as ResidentState;
  });

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
    acc[scenario.id] = { [`${activityId}-slot-0`]: null };
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
}

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
}) => {
  const activityDefinition = useMemo(() => buildScenarioActivityDefinition(scenario), [scenario]);

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
      console.log('🔍 [TestRosterPage] customValidator called:', { residentId, slotId, scenarioId: scenario.id });
      if (scenario.validator) {
        const resident = residentsById[residentId];
        if (resident) {
          const validation = scenario.validator(resident);
          console.log('🔍 [TestRosterPage] scenario.validator result:', validation);
          if (!validation.isValid) {
            const errorResult: ResidentSlotAssignResult = {
              success: false,
              reason: 'VALIDATION_FAILED',
              details: validation.message ?? 'Requisito dello scenario non soddisfatto',
              slotId,
            };
            console.log('🔍 [TestRosterPage] Returning error result:', errorResult);
            // Notify UI to show error message
            onAssignmentResult(scenario.id, errorResult, residentId);
            return errorResult;
          }
        }
      }
      console.log('🔍 [TestRosterPage] customValidator returning null (no error)');
      return null; // No custom error, proceed normally
    },
  });


  useEffect(() => {
    registerScenarioApi(
      scenario.id,
      slots.length > 0
        ? {
            assignResident: (residentId, preferredSlotId) => {
              // If preferredSlotId is provided, use it directly
              if (preferredSlotId) {
                const result = assignResidentToSlot(residentId, preferredSlotId);
                // Record result for UI feedback
                if (!result.success) {
                  onAssignmentResult(scenario.id, result, residentId);
                }
                return result;
              }
              // Otherwise find the first empty slot
              const emptySlot = slots.find((slot) => !assignments[slot.id]);
              if (!emptySlot) {
                return { success: false, reason: 'VALIDATION_FAILED', details: 'Nessuno slot disponibile' } as ResidentSlotAssignResult;
              }
              const result = assignResidentToSlot(residentId, emptySlot.id);
              // Record result for UI feedback
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
    const reason = !lastAttempt.result.success ? lastAttempt.result.reason : 'Rejected';
    const detail = !lastAttempt.result.success && lastAttempt.result.details ? ` · ${lastAttempt.result.details}` : '';
    return `Errore · ${reason}${detail}`;
  }, [lastAttempt, residentsById]);

  const hoverValidation = useMemo(() => {
    if (!scenario.validator || !hoveredResidentId) return null;
    const resident = residentsById[hoveredResidentId];
    if (!resident) return null;
    const result = scenario.validator(resident);
    return result.isValid ? null : result;
  }, [hoveredResidentId, residentsById, scenario]);

  const effectiveDropState = hoverValidation ? 'invalid' : dropState;
  const decoratedSlots = useMemo(
    () => (hoverValidation ? slots.map((slot) => ({ ...slot, dropState: 'invalid' as DropState })) : slots),
    [hoverValidation, slots],
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
      testId={`slot-lab-panel-${scenario.id}`}
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
          <span className="text-rose-300">{hoverValidation.message}</span>
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

      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/80">
        <div>
          Residenti assegnati:
          {' '}
          {assignedResidentLabels.length > 0 ? assignedResidentLabels.join(', ') : 'Nessuno'}
        </div>
        <div className="pt-1">Ultimo tentativo: {lastAttemptMessage}</div>
        {warnings.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-200">
            {warnings.map((warning) => (
              <li key={warning.slotIds.join('-') ?? warning.message}>{warning.message}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex-1 overflow-auto pt-1">
        <ResidentSlotRack
          slots={decoratedSlots}
          layout="detail"
          overflowBehavior="wrap"
          getSlotProgress={getSlotProgress}
          resolveDisplayInfo={resolveResidentRackDisplayInfo}
          onSlotDrop={(slotId, residentId) => {
            if (residentId) {
              assignResidentToSlot(residentId, slotId);
            } else {
              clearSlot(slotId);
            }
          }}
          onSlotClear={(slotId) => clearSlot(slotId)}
          onSlotClick={(slotId) => clearSlot(slotId)}
          draggingResidentId={hoveredResidentId}
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
  const [residents, setResidents] = useState<ResidentState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentsByScenario, setAssignmentsByScenario] = useState<Record<RackScenarioKey, Record<string, string | null>>>(() => buildInitialAssignments());
  const [lastAttemptByScenario, setLastAttemptByScenario] = useState<Record<RackScenarioKey, ScenarioAttempt | null>>({
    open: null,
    restricted: null,
  });
  const [returningResidentIds, setReturningResidentIds] = useState<Set<string>>(new Set());
  const [pickerResidents, setPickerResidents] = useState<ResidentAssignmentCandidate[]>([]);
  const [pickerSlotMeta, setPickerSlotMeta] = useState<ResidentPickerSlotMeta | null>(null);
  const [pickerContext, setPickerContext] = useState<{ scenarioId: RackScenarioKey; slotId: string } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [loadedResidents, setLoadedResidents] = useState<ResidentState[]>([]);
  const [isFallbackRoster, setIsFallbackRoster] = useState(false);
  const scenarioApisRef = useRef<Partial<Record<RackScenarioKey, ScenarioPanelApi>>>({});
  const themeSwitcher = useThemeSwitcher();
  const { activePreset, presets, setPreset, randomizeTheme, resetRandomization, isRandomized } = themeSwitcher;
  const rosterResidents = useMemo(() => residents, [residents]);
  const { activeId, setActiveId, dragCursorOffset, dragPreviewCenter } = useDragContext();
  const availablePresets = presets?.length ? presets : themePresets;
  const miniLabPreset = activePreset ?? availablePresets[0] ?? themePresets[0];

  const [debugDragEnabled, setDebugDragEnabled] = useState(false);
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null);
  const dragAlignmentTolerancePx = 8;

  // Drop validation hook
  const { validateDrop } = useResidentDropValidation();

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
          <div>Pointer: {pointerPosition ? `${pointerPosition.x.toFixed(1)}, ${pointerPosition.y.toFixed(1)}` : '—'}</div>
          <div>Drag preview: {dragPreviewCenter ? `${dragPreviewCenter.x.toFixed(1)}, ${dragPreviewCenter.y.toFixed(1)}` : '—'}</div>
          <div>Cursor offset: {dragCursorOffset ? `${dragCursorOffset.x.toFixed(1)}, ${dragCursorOffset.y.toFixed(1)}` : '—'}</div>
          <div>
            Δ (dx/dy):{' '}
            {dragAlignmentDiagnostics
              ? `${dragAlignmentDiagnostics.dx.toFixed(1)}, ${dragAlignmentDiagnostics.dy.toFixed(1)} (dist ${dragAlignmentDiagnostics.distance.toFixed(1)} px)`
              : '—'}
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
  const simulatedDurationUnits = useMemo(() => {
    const durationSeconds = SLOT_LAB_CONFIG.timer.totalDurationSeconds || 1;
    return Math.max(1, durationSeconds / Math.max(1, secondsPerTimeUnit));
  }, [secondsPerTimeUnit]);
  const simulatedCurrentTime = useMemo(
    () => (SLOT_LAB_CONFIG.timer.elapsedSeconds || 0) / Math.max(1, secondsPerTimeUnit),
    [secondsPerTimeUnit],
  );

  const residentsById = useMemo<Record<string, ResidentState>>(
    () =>
      rosterResidents.reduce<Record<string, ResidentState>>((acc, resident) => {
        acc[resident.id] = resident;
        return acc;
      }, {}),
    [rosterResidents],
  );

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

  const hudVillageState = useMemo<VillageState>(() => {
    const activityMap = hudActivities.reduce<Record<string, ScheduledActivity>>((acc, activity) => {
      acc[activity.id] = activity;
      return acc;
    }, {});
    return {
      currentTime: simulatedCurrentTime,
      resources: resolvedIdleConfig.globalRules.startingResources ?? {},
      residents: residentsById,
      activities: activityMap,
      eventLog: [],
      questOffers: {},
    };
  }, [hudActivities, residentsById, resolvedIdleConfig.globalRules.startingResources, simulatedCurrentTime]);

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

  useEffect(() => {
    const assignedIds = new Set<string>();
    Object.values(assignmentsByScenario).forEach((scenarioAssignments) => {
      Object.values(scenarioAssignments ?? {}).forEach((residentId) => {
        if (!residentId) return;
        assignedIds.add(residentId);
      });
    });

    setResidents((prev) => {
      let changed = false;
      const next = prev.map((resident) => {
        const isAssigned = assignedIds.has(resident.id);
        if (isAssigned && resident.status !== 'away') {
          changed = true;
          return { ...resident, status: 'away' as const };
        }
        if (!isAssigned && resident.status === 'away') {
          changed = true;
          return { ...resident, status: 'available' as const };
        }
        return resident;
      });
      return changed ? next : prev;
    });
  }, [assignmentsByScenario]);

  // Log when buttons section renders
  useEffect(() => {
    console.log('🔍 [TestRosterPage] Buttons section rendered');
  }, []);

  const _recolorResidentFallback = (residentId: string) =>
    ({ id: residentId, displayName: residentId } as ResidentState);

  const hydrateResidents = useCallback(() => {
    try {
      const loaded = loadResidentsFromCharacterManager({ config: resolvedIdleConfig });
      
      // Override fatigue with test harness config (startingFatigue: 0 = full stamina)
      const residentsWithFullStamina = loaded.map((resident) => ({
        ...resident,
        fatigue: harnessStartingFatigue, // 0 = full stamina, increases with work
        currentHp: resident.maxHp, // Also restore to full HP
      }));
      
      // Log actual HP values for debugging
      console.log('🔍 [TestRosterPage] Loaded residents with HP values:');
      residentsWithFullStamina.forEach((resident) => {
        console.log(`🔍 [TestRosterPage] ${resident.displayName}:`);
        console.log(`  └─ HP: ${resident.currentHp}/${resident.maxHp}`);
        console.log(`  └─ Fatigue: ${resident.fatigue} (${100 - resident.fatigue}% stamina)`);
        console.log(`  └─ Stats:`, resident.statSnapshot);
      });
      
      if (residentsWithFullStamina.length === 0) {
        const fallbackResidents = slotLabFallbackResidents(harnessStartingFatigue);
        setLoadedResidents(fallbackResidents);
        setIsFallbackRoster(true);
        setIsLoading(false);
        setError(null);
        trackTelemetryEvent('slot_lab_resident_fallback_used', {
          context: 'slot_lab',
          reason: 'character_manager_empty',
          fallbackCount: fallbackResidents.length,
          timestamp: Date.now(),
        });
        return;
      }
      setLoadedResidents(residentsWithFullStamina);
      setIsFallbackRoster(false);
      setIsLoading(false);
      setError(null);
      trackTelemetryEvent('slot_lab_residents_loaded', {
        context: 'slot_lab',
        residentCount: residentsWithFullStamina.length,
        timestamp: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto nel caricamento dei residenti';
      setError(`Errore nel caricamento dei residenti: ${errorMessage}`);
      setIsLoading(false);
      trackTelemetryEvent('slot_lab_resident_load_error', {
        context: 'slot_lab',
        error: errorMessage,
        timestamp: Date.now(),
      });
    }
  }, [resolvedIdleConfig, harnessStartingFatigue]);

  useEffect(() => {
    hydrateResidents();
  }, [hydrateResidents]);

  useEffect(() => {
    setResidents(loadedResidents);
  }, [loadedResidents]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const eventName = getCharacterStorageEventName();
    const handler = () => hydrateResidents();
    window.addEventListener(eventName, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(eventName, handler);
      window.removeEventListener('storage', handler);
    };
  }, [hydrateResidents]);

  const styleLabVars = useMemo<CSSProperties>(
    () => ({
      ...(styleTokens.cssVars as CSSProperties),
    }),
    [styleTokens.cssVars],
  );

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
    setAssignmentsByScenario((prev) => ({
      ...prev,
      [scenarioId]: {
        ...(prev[scenarioId] ?? {}),
        [slotId]: residentId,
      },
    }));
  }, []);

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
      setLastAttemptByScenario((prev) => ({
        ...prev,
        [scenarioId]: { result, residentId, timestamp: Date.now() },
      }));

      const eventName = result.success ? 'slot_lab_resident_assigned' : 'slot_lab_resident_assign_failed';
      trackTelemetryEvent(eventName, {
        scenarioId,
        residentId,
        slotId: result.slotId,
        reason: !result.success ? result.reason : undefined,
        details: !result.success ? result.details : undefined,
        timestamp: Date.now(),
      });

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
    },
    [scheduleTimeout],
  );

  const handleRosterSelect = useCallback(
    (residentId: string) => {
      const openScenario = scenarioApisRef.current.open;
      if (!openScenario) return;
      openScenario.assignResident(residentId);
    },
    [],
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
    setActiveId(residentId);
  }, [setActiveId]);

  // Set up global dragstart listener for custom drag image
  useEffect(() => {
    const handleGlobalDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const residentId = target.getAttribute('data-worker-id');
      
      if (residentId && residentsById[residentId]) {
        const resident = residentsById[residentId];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        
        // Calculate offset: where the cursor is relative to the element
        const rect = target.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(size, e.clientX - rect.left));
        const offsetY = Math.max(0, Math.min(size, e.clientY - rect.top));
        
        // Draw circular background
        ctx.fillStyle = 'rgba(6, 10, 18, 0.9)';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw portrait or initial
        if (resident.portraitUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, 4, 4, size - 8, size - 8);
            ctx.restore();
            
            // Set drag image with calculated offset
            e.dataTransfer?.setDragImage(canvas, offsetX, offsetY);
          };
          img.src = resident.portraitUrl;
        } else {
          // Draw initial letter
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 24px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const initial = (resident.displayName || resident.id).charAt(0).toUpperCase();
          ctx.fillText(initial, size / 2, size / 2);
          
          // Set drag image with calculated offset
          e.dataTransfer?.setDragImage(canvas, offsetX, offsetY);
        }
      }
    };

    document.addEventListener('dragstart', handleGlobalDragStart);
    return () => {
      document.removeEventListener('dragstart', handleGlobalDragStart);
    };
  }, [residentsById]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    console.log('🔍 [TestRosterPage] handleDragEnd called');
    setActiveId(null);
    const { active, over } = event;
    if (!over) {
      console.log('🔍 [TestRosterPage] No drop target');
      return;
    }

    const residentId = active.id as string;
    const slotId = over.id as string;
    console.log('🔍 [TestRosterPage] Drag ended:', { residentId, slotId });

    // Parse scenarioId from slotId (format: slot-lab-{scenarioId}-slot-{index})
    const match = slotId.match(/^slot-lab-([^-]+)-slot/);
    if (match) {
      const scenarioId = match[1] as RackScenarioKey;
      console.log('🔍 [TestRosterPage] Parsed scenarioId:', scenarioId);
      const api = scenarioApisRef.current[scenarioId];
      const scenario = RACK_SCENARIOS.find((s) => s.id === scenarioId);
      
      if (api && scenario) {
        const resident = residentsById[residentId];
        if (resident) {
          console.log('🔍 [TestRosterPage] Found resident:', resident.name, 'HP:', resident.currentHp);
          // 1. First check custom scenario validation
          if (scenario.validator) {
            const customValidation = scenario.validator(resident);
            console.log('🔍 [TestRosterPage] Custom validation result:', customValidation);
            if (!customValidation.isValid) {
              console.log('🔍 [TestRosterPage] Custom validation failed in handleDragEnd:', customValidation.message);
              // Record failed attempt
              handleScenarioAssignmentResult(scenarioId, {
                success: false,
                reason: 'VALIDATION_FAILED',
                details: customValidation.message ?? 'Requisito non soddisfatto',
              }, residentId);
              
              return; // Don't assign if custom validation fails
            }
          }
          
          // 2. Then check general drop validation
          const validationResult = validateDrop({
            resident,
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
            
            return; // Don't assign if invalid
          }
          
          console.log('🔍 [TestRosterPage] Validations passed, calling api.assignResident');
        }
        
        const result = api.assignResident(residentId, slotId);
        console.log('🔍 [TestRosterPage] api.assignResident result:', result);
        if (result) {
          handleScenarioAssignmentResult(scenarioId, result, residentId);
        }
      }
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
    const reason = !attempt.result.success ? attempt.result.reason : 'invalid';
    const details = !attempt.result.success && attempt.result.details ? ` · ${attempt.result.details}` : '';
    return `Rack A · ${reason}${details}`;
  }, [lastAttemptByScenario, residentsById]);

  const handleMiniLabPresetChange = useCallback((presetId: ThemePresetId) => {
    setPreset(presetId);
    const preset = themePresetMap[presetId];
    trackTelemetryEvent('slot_lab_preset_selected', {
      context: 'slot_lab',
      presetId,
      presetLabel: preset?.label,
      timestamp: Date.now(),
    });
  }, [setPreset]);

  const _handleResetRosterState = useCallback(() => {
    setResidents((prev) =>
      prev.map((resident) => ({
        ...resident,
        status: 'available',
        isInjured: false,
        // Fatigue model: 0 = rested, increases with activity
        fatigue: 0, // Fully rested
      })),
    );
    trackTelemetryEvent('slot_lab_roster_reset', {
      context: 'slot_lab',
      timestamp: Date.now(),
    });
  }, []);

  const _handleReloadRoster = useCallback(() => {
    setIsLoading(true);
    hydrateResidents();
    trackTelemetryEvent('slot_lab_roster_reload_requested', {
      context: 'slot_lab',
      timestamp: Date.now(),
    });
  }, [hydrateResidents]);

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
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
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
                {availablePresets.map((preset) => {
                  const isActive = preset.id === miniLabPreset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={isActive}
                      data-active={isActive}
                      onClick={() => handleMiniLabPresetChange(preset.id)}
                      className={`rounded-full border px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors ${
                        isActive ? 'border-white/70 bg-white/10 text-white' : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={randomizeTheme}
                  className="rounded-full border border-white/30 px-4 py-1 text-[11px] uppercase tracking-[0.3em] text-white/80 transition-colors hover:text-white"
                >
                  Randomize
                </button>
                {isRandomized && (
                  <button
                    type="button"
                    onClick={resetRandomization}
                    className="rounded-full border border-dashed border-white/30 px-4 py-1 text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white"
                  >
                    Reset
                  </button>
                )}
              </StyleLabStack>
            </StyleLabSurface>

            <StyleLabSurface variant="card" className="w-full" testId="style-lab-hud">
              <div className="flex gap-4">
                <div className="flex-1">
                  <ActiveHUD
                    hudState={hudState}
                    villageState={hudVillageState}
                    secondsPerTimeUnit={secondsPerTimeUnit}
                    variant="default"
                    maxVisible={4}
                    enableTelemetry={false}
                  />
                </div>
                
                {/* Control buttons on the right */}
                <div className="flex flex-col gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🔍 [TestRosterPage] Clear All Slots clicked');
                      // Clear all slots across all scenarios
                      RACK_SCENARIOS.forEach((scenario) => {
                        const assignments = assignmentsByScenario[scenario.id] ?? {};
                        Object.keys(assignments).forEach((slotId) => {
                          if (assignments[slotId]) {
                            handleScenarioClear(scenario.id, slotId);
                          }
                        });
                      });
                    }}
                    className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60 transition-colors hover:text-white hover:border-white/40 whitespace-nowrap"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    Clear Slots
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🔍 [TestRosterPage] Restore Stamina clicked');
                      // Restore all residents to full HP/full stamina by updating state
                      setResidents((prev) => 
                        prev.map((resident) => ({
                          ...resident,
                          currentHp: resident.maxHp,
                          fatigue: 0, // Fully rested
                          status: 'available' as const,
                          isInjured: false,
                        }))
                      );
                      trackTelemetryEvent('slot_lab_stamina_restored', {
                        context: 'slot_lab',
                        residentCount: residents.length,
                        timestamp: Date.now(),
                      });
                    }}
                    className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60 transition-colors hover:text-white hover:border-white/40 whitespace-nowrap"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    Restore Stamina
                  </button>
                </div>
              </div>
            </StyleLabSurface>

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

            {isFallbackRoster && !error && (
              <StyleLabSurface variant="card" className="text-center text-sm" style={{ color: 'var(--minimal-warning-color)' }}>
                <div className="font-semibold">Mock roster attivo</div>
                <div className="text-xs text-white/70">
                  Il Character Manager è vuoto: stiamo usando il roster minimal predefinito per consentire il test del drag.
                </div>
              </StyleLabSurface>
            )}

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
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <StyleLabSurface variant="card" className="flex-1 overflow-hidden" testId="village-roster-wrapper">
                  <VillageRosterSection
                    residents={rosterResidents}
                    assignmentFeedback={rosterFeedback ?? undefined}
                    onResidentSelect={handleRosterSelect}
                    getResidentCompatibility={() => undefined}
                  />
                </StyleLabSurface>

                <section className="flex flex-col gap-4">
                  {RACK_SCENARIOS.map((scenario) => (
                    <RackScenarioPanel
                      key={scenario.id}
                      scenario={scenario}
                      residentsById={residentsById}
                      hoveredResidentId={activeId}
                      assignments={assignmentsByScenario[scenario.id] ?? {}}
                      onAssign={handleScenarioAssign}
                      onClear={handleScenarioClear}
                      onAssignmentResult={handleScenarioAssignmentResult}
                      lastAttempt={lastAttemptByScenario[scenario.id]}
                      registerScenarioApi={registerScenarioApi}
                      pickerCandidates={resolvePickerCandidates(scenario)}
                      onOpenPicker={({ slotId, slotMeta, candidates }) =>
                        openPickerWithResidents(slotId, candidates, slotMeta, scenario.id)
                      }
                    />
                  ))}
                </section>
              </div>
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
        <CustomDragOverlay residentsById={residentsById} />
      </DndContext>

      <CertifiedWorkerPickerSheet
        isOpen={isPickerOpen}
        residents={pickerResidents}
        slotMeta={pickerSlotMeta}
        onAssign={handlePickerAssign}
        onClose={closePicker}
      />
    </div>
  );
};

const TestRosterPage: React.FC = () => (
  <SandboxTimingProvider>
    <DragProvider>
      <TestRosterPageContent />
    </DragProvider>
  </SandboxTimingProvider>
);

export default TestRosterPage;

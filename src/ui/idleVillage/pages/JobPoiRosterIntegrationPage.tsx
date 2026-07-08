/**
 * JobPoiRosterIntegrationPage — Integration: POI Job (specialized POI) + Roster + real TimeEngine
 *
 * Wires the drag & drop roster to the REAL Idle Village engine
 * (createVillageStateFromConfig + scheduleActivity + tickIdleVillage) so that
 * fatigue, resources and auto-extraction are computed by the actual game rules
 * (config-first). A job is a specialization of a POI with partially different
 * rules (continuous repeat, per-cycle fatigue/reward, auto-extraction on low stamina).
 *
 * Features:
 * - Real engine state (VillageState) as single source of truth
 * - Certified roster components (VillageRosterSection, ResidentSlotRack)
 * - Drag & drop assignment with validation (statRequirement) → invalid drops spring back, no bloom
 * - Play/Pause time; job runs only while time flows
 * - Continuous job toggle: residents keep working until stamina is too low for the next cycle
 * - Per-cycle fatigue accumulation + resource rewards (wood) from the engine
 * - Automatic extraction (status → exhausted) when stamina can't cover the next cycle
 * - Manual removal at any time
 * - Built-in integration test runner with PASS/FAIL log
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { GenericPoiSkin } from '@/ui/idleVillage/frozen/kits/poiKit';
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import type { ActivityDetailSlotData, TelemetryEntry } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import {
  createVillageStateFromConfig,
  scheduleActivity,
  type ResidentState,
  type VillageState,
} from '@/engine/game/idleVillage/TimeEngine';
import { tickIdleVillage, type IdleVillageEngineDeps } from '@/engine/game/idleVillage/IdleVillageEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';

const JOB_ID = 'job_chop_wood';
const SLOT_ID = 'village_gate';
const TICK_INTERVAL_MS = 1000;
/** Resident WITH the required `edge` tag → valid for the job. */
const VALID_TEST_ID = 'hero-giggiolillo';
/** Resident WITHOUT the `edge` tag → invalid for the job. */
const INVALID_TEST_ID = 'hero-sir-spaccaculi';

// Wilderness colors for POI (from minimal-poi.tsx)
const WILDERNESS_COLORS = {
  coronaCore: { r: 139, g: 105, b: 20 },
  coronaGlow: { r: 180, g: 140, b: 40 },
  rimColors: ['#fce890', '#c09030', '#200e02'] as [string, string, string],
  stoneColors: ['#1e1608', '#030202'] as [string, string],
  stoneAmbient: 'rgba(255,220,120,.22)',
  pinColor: 'rgba(205,190,148,.72)',
};

// ---------------------------------------------------------------------------
// Config-first test setup
// ---------------------------------------------------------------------------

/**
 * Build a tailored, config-first clone of the Idle Village config for this test
 * harness. The chop-wood job is modeled as a repeating regular job so the engine
 * applies per-cycle fatigue (via fatigueProfile) and rewards; night recovery is
 * suppressed (huge daytime) for deterministic runs.
 */
function buildJobTestConfig(): IdleVillageConfig {
  const cfg = structuredClone(DEFAULT_IDLE_VILLAGE_CONFIG) as IdleVillageConfig;
  const job = cfg.activities[JOB_ID];
  if (job) {
    job.continuousJob = false; // page handles repeat; avoids continuous reward double-count
    job.supportsAutoRepeat = true;
    job.durationFormula = '1';
    job.dailyFatigueCost = 25; // stamina consumed per cycle (auto-extract guard)
    job.fatigueProfile = { baseGain: 25, perTimeUnitGain: 0 };
    job.rewards = [{ resourceId: 'wood', amountFormula: '3' }];
  }
  cfg.globalRules.dayNightCycle = { dayTimeUnits: 100000, nightTimeUnits: 5 };
  cfg.globalRules.dayLengthInTimeUnits = 100000;
  cfg.globalRules.startingResources = { gold: 0, food: 1_000_000, wood: 0 };
  cfg.globalRules.startingResidents = [];
  return cfg;
}

function buildInitialResidents(): ResidentState[] {
  return TEST_ROSTER_HEROES.map((h) => ({
    id: h.id,
    displayName: h.name,
    status: 'available' as const,
    fatigue: 0,
    currentHp: h.currentHp,
    maxHp: h.maxHp,
    statTags: h.statTags ? [...h.statTags] : [],
    statSnapshot: h.statSnapshot ? { ...h.statSnapshot } : undefined,
    isHero: Boolean(h.isHero),
    isInjured: Boolean(h.isInjured),
    survivalCount: h.survivalCount ?? 0,
    survivalScore: h.survivalScore ?? 0,
  }));
}

function buildFreshState(config: IdleVillageConfig): VillageState {
  return createVillageStateFromConfig({ config, initialResidents: buildInitialResidents() });
}

// ---------------------------------------------------------------------------
// Pure engine-backed operations (no React; usable by both UI and test runner)
// ---------------------------------------------------------------------------

interface OpResult {
  ok: boolean;
  reason: string;
}

function validateAssignment(config: IdleVillageConfig, state: VillageState, residentId: string): OpResult {
  const resident = state.residents[residentId];
  if (!resident) return { ok: false, reason: 'resident not found' };
  if (resident.status !== 'available') return { ok: false, reason: `status is "${resident.status}"` };
  const cap = config.globalRules.maxFatigueBeforeExhausted ?? 100;
  if (resident.fatigue >= cap) return { ok: false, reason: 'too fatigued (exhausted)' };
  const requirement = config.activities[JOB_ID]?.statRequirement;
  const match = evaluateStatRequirement(resident, requirement);
  if (!match.matches) {
    const parts: string[] = [];
    if (match.missingAllOf.length) parts.push(`missing ${match.missingAllOf.join(', ')}`);
    if (!match.anyOfMatched) parts.push(`needs one of ${requirement?.anyOf?.join(', ')}`);
    if (match.blockedBy.length) parts.push(`blocked by ${match.blockedBy.join(', ')}`);
    return { ok: false, reason: `stat requirement: ${parts.join('; ')}` };
  }
  return { ok: true, reason: 'valid' };
}

/** IDs of residents currently occupying a pending/running cycle of this job. */
function getAssignedIds(state: VillageState): string[] {
  const ids = new Set<string>();
  Object.values(state.activities).forEach((a) => {
    if (a.activityId === JOB_ID && (a.status === 'pending' || a.status === 'running')) {
      a.characterIds.forEach((c) => ids.add(c));
    }
  });
  return [...ids];
}

function assignResident(
  deps: IdleVillageEngineDeps,
  state: VillageState,
  residentId: string,
): { state: VillageState; ok: boolean; reason: string } {
  const validation = validateAssignment(deps.config, state, residentId);
  if (!validation.ok) return { state, ok: false, reason: validation.reason };
  const result = scheduleActivity(deps, state, {
    activityId: JOB_ID,
    characterIds: [residentId],
    slotId: SLOT_ID,
    isAuto: true,
  });
  if (result.error) return { state, ok: false, reason: result.error };
  return { state: result.state, ok: true, reason: 'assigned' };
}

function removeResident(state: VillageState, residentId: string): VillageState {
  const activities = { ...state.activities };
  for (const [id, a] of Object.entries(activities)) {
    if (a.characterIds.includes(residentId) && (a.status === 'pending' || a.status === 'running')) {
      delete activities[id];
    }
  }
  const residents = { ...state.residents };
  const resident = residents[residentId];
  if (resident && resident.status === 'away') {
    residents[residentId] = { ...resident, status: 'available' };
  }
  return { ...state, activities, residents };
}

/** Whether a resident can start another cycle without exceeding the fatigue cap. */
function canReschedule(config: IdleVillageConfig, state: VillageState, residentId: string): boolean {
  const resident = state.residents[residentId];
  if (!resident || resident.status !== 'available') return false;
  const cap = config.globalRules.maxFatigueBeforeExhausted ?? 100;
  const cost = config.activities[JOB_ID]?.dailyFatigueCost ?? 0;
  return resident.fatigue + cost <= cap;
}

/** Advance one tick through the real engine, then auto-repeat eligible residents. */
function tickOnce(
  deps: IdleVillageEngineDeps,
  state: VillageState,
  isContinuous: boolean,
): { state: VillageState; completed: number } {
  const result = tickIdleVillage(deps, state, 1);
  let next = result.state;

  if (isContinuous) {
    for (const job of result.completedJobs) {
      const scheduled = next.activities[job.scheduledId];
      const residentIds = scheduled?.characterIds ?? [];
      for (const cid of residentIds) {
        if (canReschedule(deps.config, next, cid)) {
          next = assignResident(deps, next, cid).state;
        }
      }
    }
  }

  // Prune completed/cancelled activities to keep state lean.
  const pruned = Object.fromEntries(
    Object.entries(next.activities).filter(([, a]) => a.status === 'pending' || a.status === 'running'),
  );
  next = { ...next, activities: pruned };

  return { state: next, completed: result.completedJobs.length };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type LogStatus = 'pass' | 'fail' | 'info';
interface LogEntry {
  id: number;
  status: LogStatus;
  label: string;
  detail?: string;
}

export const JobPoiRosterIntegrationPage: React.FC = () => {
  const config = useMemo(() => buildJobTestConfig(), []);
  const deps = useMemo<IdleVillageEngineDeps>(() => ({ config, rng: () => 0.5 }), [config]);

  const [village, setVillage] = useState<VillageState>(() => buildFreshState(config));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isTimeRunning, setIsTimeRunning] = useState(false);
  const [isContinuousJob, setIsContinuousJob] = useState(true);
  const [testLog, setTestLog] = useState<LogEntry[]>([]);

  const villageRef = useRef(village);
  villageRef.current = village;
  const continuousRef = useRef(isContinuousJob);
  continuousRef.current = isContinuousJob;

  const jobConfig = config.activities[JOB_ID];
  const fatigueCap = config.globalRules.maxFatigueBeforeExhausted ?? 100;
  const staminaPerCycle = jobConfig?.fatigueProfile?.baseGain ?? jobConfig?.dailyFatigueCost ?? 0;

  const assignedIds = getAssignedIds(village);

  // Live ticking loop using the real engine.
  useEffect(() => {
    if (!isTimeRunning) return undefined;
    const interval = setInterval(() => {
      setVillage((prev) => tickOnce(deps, prev, continuousRef.current).state);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isTimeRunning, deps]);

  // Roster residents from engine state for certified component
  const rosterResidents = Object.values(village.residents);

  // POI state for ActivityCapsuleDetailSkinAware
  const [detailOpen, setDetailOpen] = useState(false);

  // Slot data for POI detail
  const detailSlots: ActivityDetailSlotData[] = assignedIds.map((residentId, idx) => {
    const resident = village.residents[residentId];
    const hero = TEST_ROSTER_HEROES.find((h) => h.id === residentId);
    return {
      id: `slot-${idx}`,
      state: resident?.status === 'away' ? 'active' : 'idle',
      initial: hero?.name.charAt(0) ?? '',
      progress: Math.min(1, (resident?.fatigue ?? 0) / fatigueCap),
      assignedWorkerName: hero?.name,
    };
  });

  // Telemetry for POI detail
  const detailTelemetry: TelemetryEntry[] = assignedIds.map((residentId, idx) => ({
    id: `tel-${idx}`,
    timestamp: new Date(),
    message: `Worker assigned to slot ${idx + 1}`,
    type: 'assign',
  }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    trackTelemetryEvent('job_poi_roster_drag_start', { residentId: event.active.id, jobId: JOB_ID });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const residentId = active.id as string;
    setActiveId(null);

    if (over && over.id.toString().startsWith(SLOT_ID)) {
      const result = assignResident(deps, villageRef.current, residentId);
      if (result.ok) {
        setVillage(result.state);
        trackTelemetryEvent('job_poi_roster_assigned', {
          residentId,
          jobId: JOB_ID,
          slotIndex: getAssignedIds(result.state).indexOf(residentId),
        });
      } else {
        trackTelemetryEvent('job_poi_roster_assign_rejected', { residentId, jobId: JOB_ID, reason: result.reason });
      }
    } else {
      trackTelemetryEvent('job_poi_roster_drag_cancelled', { residentId, jobId: JOB_ID });
    }
  };

  const handlePoiClick = useCallback(() => {
    setDetailOpen(true);
    trackTelemetryEvent('job_poi_detail_open', { jobId: JOB_ID });
  }, []);

  const handleDetailClose = useCallback(() => {
    setDetailOpen(false);
    trackTelemetryEvent('job_poi_detail_close', { jobId: JOB_ID });
  }, []);

  const getResidentCompatibility = (residentId: string) => {
    const validation = validateAssignment(config, village, residentId);
    return {
      state: validation.ok ? ('valid' as const) : ('invalid' as const),
      slotLabel: 'Chop Wood',
      slotId: SLOT_ID,
      reason: validation.reason,
    };
  };

  const handleRemove = (residentId: string) => {
    setVillage((prev) => removeResident(prev, residentId));
    trackTelemetryEvent('job_poi_roster_removed', { residentId, jobId: JOB_ID });
  };

  const handleReset = () => {
    setIsTimeRunning(false);
    setVillage(buildFreshState(config));
    setTestLog([]);
  };

  // -------------------------------------------------------------------------
  // Integration test runner
  // -------------------------------------------------------------------------
  const runIntegrationTest = useCallback(() => {
    setIsTimeRunning(false);
    const log: LogEntry[] = [];
    let counter = 0;
    const push = (status: LogStatus, label: string, detail?: string) =>
      log.push({ id: counter++, status, label, detail });

    let state = buildFreshState(config);

    // Step 0 — start with time stopped.
    push(
      (state.resources.wood ?? 0) === 0 && getAssignedIds(state).length === 0 ? 'pass' : 'fail',
      'Step 0 — Stato iniziale, tempo fermo',
      `wood=${state.resources.wood ?? 0}, assigned=${getAssignedIds(state).length}`,
    );

    // Step 1 — invalid PG fails validation (no bloom).
    const inv = validateAssignment(config, state, INVALID_TEST_ID);
    push(!inv.ok ? 'pass' : 'fail', 'Step 1 — PG invalido NON valido (niente bloom)', inv.reason);

    // Step 2 — invalid PG dropped is rejected (spring back, state unchanged).
    const a2 = assignResident(deps, state, INVALID_TEST_ID);
    push(
      !a2.ok && getAssignedIds(a2.state).length === 0 ? 'pass' : 'fail',
      'Step 2 — Drop PG invalido respinto (spring back)',
      a2.reason,
    );

    // Step 3 — valid PG passes validation (bloom).
    const val = validateAssignment(config, state, VALID_TEST_ID);
    push(val.ok ? 'pass' : 'fail', 'Step 3 — PG valido valido (bloom)', val.reason);

    // Step 4 — valid PG dropped occupies the first slot.
    const a4 = assignResident(deps, state, VALID_TEST_ID);
    state = a4.state;
    push(
      a4.ok && getAssignedIds(state).includes(VALID_TEST_ID) && state.residents[VALID_TEST_ID]?.status === 'away'
        ? 'pass'
        : 'fail',
      'Step 4 — PG valido occupa il primo slot',
      `assigned=${getAssignedIds(state).length}, status=${state.residents[VALID_TEST_ID]?.status}`,
    );

    // Step 5 — valid PG extracted correctly.
    state = removeResident(state, VALID_TEST_ID);
    push(
      getAssignedIds(state).length === 0 && state.residents[VALID_TEST_ID]?.status === 'available' ? 'pass' : 'fail',
      'Step 5 — PG estratto correttamente',
      `assigned=${getAssignedIds(state).length}, status=${state.residents[VALID_TEST_ID]?.status}`,
    );

    // Step 6 — reload PG, let time flow one tick, still assigned (continuous repeat).
    state = assignResident(deps, state, VALID_TEST_ID).state;
    state = tickOnce(deps, state, true).state;
    const stillAssigned = getAssignedIds(state).includes(VALID_TEST_ID);
    push(
      stillAssigned ? 'pass' : 'fail',
      'Step 6 — Tempo scorre: PG ancora al lavoro (continuous)',
      `fatigue=${state.residents[VALID_TEST_ID]?.fatigue}, wood=${state.resources.wood}`,
    );

    // Step 6b — PG can still be removed mid-run.
    const branch = removeResident(state, VALID_TEST_ID);
    push(
      getAssignedIds(branch).length === 0 ? 'pass' : 'fail',
      'Step 6b — PG rimovibile durante il job',
      `status=${branch.residents[VALID_TEST_ID]?.status}`,
    );

    // Step 7/8/9 — long run: fatigue accumulates, resources grow, eventual auto-extraction.
    const fatigueStart = state.residents[VALID_TEST_ID]?.fatigue ?? 0;
    const progression: string[] = [];
    let extracted = false;
    let finalStatus = '';
    for (let i = 0; i < 12; i++) {
      state = tickOnce(deps, state, true).state;
      const resident = state.residents[VALID_TEST_ID];
      const assignedNow = getAssignedIds(state).includes(VALID_TEST_ID);
      progression.push(`t${i + 1}: fat=${resident?.fatigue} wood=${state.resources.wood} on=${assignedNow}`);
      if (!assignedNow) {
        extracted = true;
        finalStatus = resident?.status ?? '?';
        break;
      }
    }
    const fatigueEnd = state.residents[VALID_TEST_ID]?.fatigue ?? 0;
    push(
      (state.resources.wood ?? 0) > 0 ? 'pass' : 'fail',
      'Step 7 — Le risorse aumentano coi tick',
      `wood=${state.resources.wood}`,
    );
    push(
      fatigueEnd >= fatigueStart ? 'pass' : 'fail',
      'Step 8 — Il PG si stanca (fatigue cresce)',
      progression.join(' | '),
    );
    push(
      extracted ? 'pass' : 'fail',
      'Step 9 — Auto-estrazione quando la stamina è troppo bassa',
      extracted ? `estratto, status=${finalStatus}` : 'NON estratto entro 12 tick',
    );
    push(finalStatus === 'exhausted' ? 'pass' : 'fail', 'Step 9b — Estratto con stato "exhausted"', `status=${finalStatus}`);

    // Step 10 — exhausted PG cannot be reassigned.
    const reVal = validateAssignment(config, state, VALID_TEST_ID);
    push(!reVal.ok ? 'pass' : 'fail', 'Step 10 — PG esausto non riassegnabile', reVal.reason);

    setVillage(state);
    setTestLog(log);

    const passed = log.filter((e) => e.status === 'pass').length;
    const failed = log.filter((e) => e.status === 'fail').length;
    trackTelemetryEvent('job_poi_integration_test_run', { passed, failed, total: log.length });
  }, [config, deps]);

  const assignedHeroes = assignedIds
    .map((id) => ({ hero: TEST_ROSTER_HEROES.find((h) => h.id === id), resident: village.residents[id] }))
    .filter((x) => x.hero);

  const passCount = testLog.filter((e) => e.status === 'pass').length;
  const failCount = testLog.filter((e) => e.status === 'fail').length;

  return (
    <DragProvider>
      <TooltipProvider>
      <StyleLabSurface>
        <div className="job-poi-roster-integration-page">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Job POI + Roster Integration</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Job = POI specializzato. Logica reale via TimeEngine (fatica, risorse, auto-estrazione).
          </p>

          {/* Time & job controls */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIsTimeRunning((v) => !v)}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                isTimeRunning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
              }`}
              data-testid="toggle-time"
            >
              {isTimeRunning ? '⏸ Pause Time' : '▶ Play Time'}
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={isContinuousJob} onChange={(e) => setIsContinuousJob(e.target.checked)} className="w-4 h-4" />
              Continuous Job (repeat)
            </label>
            <button
              onClick={runIntegrationTest}
              className="px-4 py-2 rounded font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              data-testid="run-integration-test"
            >
              ▶ Run Integration Test
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              ↺ Reset
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Time: <strong>{isTimeRunning ? 'Running' : 'Paused'}</strong> · t={village.currentTime}
            </div>
          </div>

          {/* Resource HUD */}
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100">
              🪵 Wood: <strong>{Math.round((village.resources.wood ?? 0) * 100) / 100}</strong>
            </span>
            <span className="px-3 py-1 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100">
              💰 Gold: <strong>{village.resources.gold ?? 0}</strong>
            </span>
            <span className="px-3 py-1 rounded bg-lime-100 dark:bg-lime-900/40 text-lime-900 dark:text-lime-100">
              🍞 Food: <strong>{Math.round((village.resources.food ?? 0) * 10) / 10}</strong>
            </span>
          </div>
        </header>

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Job POI (certified GenericPoiSkin + ActivityCapsuleDetailSkinAware) */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">🪓 Job: Chop Wood</h2>

                {/* Certified POI: clickable to open detail */}
                <div className="flex items-center justify-center h-80 bg-slate-900/30 border border-slate-700/50 rounded-lg mb-4">
                  <div className="w-64 h-64 cursor-pointer" onClick={handlePoiClick} data-testid="job-poi-trigger">
                    <GenericPoiSkin
                      icon="🪓"
                      label="Chop Wood"
                      progress={assignedIds.length > 0 ? 0.65 : 0}
                      coronaCore={WILDERNESS_COLORS.coronaCore}
                      coronaGlow={WILDERNESS_COLORS.coronaGlow}
                      rimColors={WILDERNESS_COLORS.rimColors}
                      stoneColors={WILDERNESS_COLORS.stoneColors}
                      stoneAmbient={WILDERNESS_COLORS.stoneAmbient}
                      pinColor={WILDERNESS_COLORS.pinColor}
                      pillar="wilderness"
                      size={160}
                      enableHover={true}
                    />
                  </div>
                </div>

                {/* Job info (config-driven) */}
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <div><strong>ID:</strong> {jobConfig?.id}</div>
                  <div><strong>Requisito:</strong> {jobConfig?.statRequirement?.label} (anyOf: {jobConfig?.statRequirement?.anyOf?.join(', ')})</div>
                  <div><strong>Durata ciclo:</strong> {jobConfig?.durationFormula} tick ({TICK_INTERVAL_MS}ms)</div>
                  <div><strong>Reward/ciclo:</strong> {jobConfig?.rewards?.map((r) => `${r.resourceId} ×${r.amountFormula}`).join(', ')}</div>
                  <div><strong>Stamina/ciclo:</strong> {staminaPerCycle} (cap {fatigueCap})</div>
                  <div><strong>Cicli prima dell'esaurimento:</strong> ~{staminaPerCycle > 0 ? Math.ceil(fatigueCap / staminaPerCycle) : '∞'}</div>
                </div>

                {/* Assigned residents quick-remove list */}
                {assignedHeroes.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {assignedHeroes.map(({ hero, resident }, idx) => (
                      <div
                        key={hero!.id}
                        className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700 flex items-center justify-between"
                      >
                        <div className="text-xs text-green-700 dark:text-green-300">
                          <strong>{hero!.name}</strong> · Slot {idx + 1} · fatigue {Math.round(resident?.fatigue ?? 0)}/{fatigueCap} · {resident?.status}
                        </div>
                        <button
                          onClick={() => handleRemove(hero!.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* POI Detail modal (ActivityCapsuleDetailSkinAware) */}
              {detailOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 max-w-2xl w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Job Detail</h3>
                      <button
                        onClick={handleDetailClose}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                      >
                        Close
                      </button>
                    </div>
                    <ActivityCapsuleDetailSkinAware
                      activityId={JOB_ID}
                      name={jobConfig?.label ?? 'Chop Wood'}
                      type="job"
                      subtitle="Production Job - Woodcutting"
                      status={assignedIds.length > 0 ? 'in-progress' : 'idle'}
                      progress={0}
                      duration={parseInt(jobConfig?.durationFormula ?? '1', 10) * TICK_INTERVAL_MS}
                      elapsed={0}
                      slots={detailSlots}
                      maxSlots={jobConfig?.maxSlots === 'infinite' ? 99 : (jobConfig?.maxSlots ?? 1)}
                      durationDisplay={`${jobConfig?.durationFormula}s`}
                      rewardDisplay="Wood + XP"
                      etaDisplay={`${jobConfig?.durationFormula}s`}
                      telemetry={detailTelemetry}
                      isOpen={true}
                      onStart={() => trackTelemetryEvent('job_poi_detail_start', { jobId: JOB_ID, residentIds: assignedIds })}
                      onCollect={() => trackTelemetryEvent('job_poi_detail_collect', { jobId: JOB_ID, residentIds: assignedIds })}
                    />
                  </div>
                </div>
              )}

              {/* Integration test log */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">🧪 Integration Test Log</h3>
                  {testLog.length > 0 && (
                    <span className="text-sm font-semibold">
                      <span className="text-green-600">{passCount} pass</span>
                      {' · '}
                      <span className={failCount > 0 ? 'text-red-600' : 'text-gray-500'}>{failCount} fail</span>
                    </span>
                  )}
                </div>
                {testLog.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Premi "Run Integration Test" per eseguire lo scenario completo.</p>
                ) : (
                  <ol className="space-y-1 text-sm" data-testid="integration-test-log">
                    {testLog.map((entry) => (
                      <li key={entry.id} className="flex gap-2">
                        <span className={entry.status === 'pass' ? 'text-green-600' : entry.status === 'fail' ? 'text-red-600' : 'text-gray-500'}>
                          {entry.status === 'pass' ? '✓' : entry.status === 'fail' ? '✗' : '•'}
                        </span>
                        <span className="flex-1">
                          <span className="text-gray-900 dark:text-gray-100">{entry.label}</span>
                          {entry.detail && <span className="block text-xs text-gray-500 dark:text-gray-400">{entry.detail}</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            {/* Right: Roster (certified VillageRosterSection) */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <VillageRosterSection
                  residents={rosterResidents}
                  componentId="job-poi-roster"
                  cardVariant="vertical"
                  onResidentSelect={handleRemove}
                  getResidentCompatibility={getResidentCompatibility}
                />
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">📋 Come funziona</h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Solo <strong>Giggiolillo</strong> ha il tag <code>edge</code> → valido. Gli altri due tornano indietro (no bloom).</li>
                  <li>• "Play Time" fa scorrere il tempo: il job parte solo a tempo attivo.</li>
                  <li>• "Continuous Job" tiene il PG al lavoro finché ha stamina per il ciclo successivo.</li>
                  <li>• Ogni ciclo: +{jobConfig?.rewards?.[0]?.amountFormula} {jobConfig?.rewards?.[0]?.resourceId}, +{staminaPerCycle} fatigue.</li>
                  <li>• Quando la stamina non basta, il PG viene auto-estratto come <strong>exhausted</strong>.</li>
                  <li>• "Run Integration Test" esegue tutto lo scenario con log PASS/FAIL.</li>
                </ul>
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </StyleLabSurface>
      </TooltipProvider>
    </DragProvider>
  );
};

export default JobPoiRosterIntegrationPage;

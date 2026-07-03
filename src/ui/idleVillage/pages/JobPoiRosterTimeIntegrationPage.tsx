/**
 * JobPoiRosterTimeIntegrationPage — Integration: POI + Roster + Time Engine + Rewards
 *
 * Integration page wiring ONLY pre-approved / certified components into a single
 * end-to-end gameplay loop:
 * - VillageRosterSection (canonical roster) for residents
 * - TimeEngineStrip (certified day/night + clock + speed controls)
 * - ActivityCapsuleDetailSkinAware (certified POI detail) for the job
 * - StatusHUD-style resource panel + real reward log
 *
 * All numbers come from config (MinimalConfig transformed from IdleVillageConfig).
 * Rewards are REAL: produced by the gameplay store's tick() via the config-driven
 * engine (processActivitiesTick) and read back from the event log — no simulation.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import {
  useMinimalGameplayWithIdleVillageConfig,
  useMinimalGameplayStore,
  selectResidentRosterStates,
} from '@/store/useMinimalGameplay';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { TimeEngineStrip } from '@/ui/idleVillage/components/minimal/TimeEngineStrip';
import DayNightPoiSkin from '@/ui/idleVillage/components/minimal/DayNightPoiSkin';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import type { ActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import type { RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';

/** Small read-only HUD tile. */
const HudStat: React.FC<{ label: string; value: React.ReactNode; accent?: string }> = ({
  label,
  value,
  accent,
}) => (
  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-center">
    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
    <div className="text-2xl font-bold" style={accent ? { color: accent } : undefined}>
      {value}
    </div>
  </div>
);

/**
 * JobPoiRosterTimeIntegrationPage
 */
export const JobPoiRosterTimeIntegrationPage: React.FC = () => {
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const { config, state } = gameplay;

  const [sortMode, setSortMode] = useState<RosterSortMode>('name-asc');
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Inject the transformed config (with REAL activities) into the store so that
  // store actions (startActivity/tick) validate and reward against real config.
  const configInjected = useRef(false);
  useEffect(() => {
    if (config.activities.length > 0 && !configInjected.current) {
      useMinimalGameplayStore.setState({ config });
      configInjected.current = true;
    }
  }, [config]);

  // Game loop: advance the engine one second per real second while not paused.
  useEffect(() => {
    if (state.isPaused) return undefined;
    const intervalId = setInterval(() => {
      useMinimalGameplayStore.getState().tick(1000, 'auto');
    }, 1000);
    return () => clearInterval(intervalId);
  }, [state.isPaused]);

  // Config-first: pick the shortest job activity from config (no hardcoded ids),
  // so the manual single-step control can reasonably complete a job for the demo.
  const job = useMemo(() => {
    const jobs = config.activities.filter((activity) => activity.type === 'job');
    if (jobs.length === 0) return config.activities[0];
    return jobs.reduce((shortest, current) =>
      current.durationTicks < shortest.durationTicks ? current : shortest
    );
  }, [config.activities]);

  const residents = useMemo(() => selectResidentRosterStates(state, config), [state, config]);

  // REAL rewards: completion entries logged by the engine during tick().
  const rewardEntries = useMemo(
    () => state.eventLog.filter((entry) => Boolean(entry.activityId)).slice().reverse(),
    [state.eventLog]
  );

  const activeForJob = job
    ? state.activeActivities.filter((activity) => activity.activityId === job.id)
    : [];
  const isJobActive = activeForJob.length > 0;
  const jobProgress =
    job && isJobActive
      ? Math.min(1, Math.max(0, (job.durationTicks - activeForJob[0].ticksRemaining) / job.durationTicks))
      : 0;

  const handleAssign = useCallback(
    (residentId: string) => {
      if (!job) return;
      setSelectedResident(residentId);
      const validation = gameplay.canStartActivity(residentId, job.id);
      if (!validation.canStart) {
        setFeedback(validation.reason ?? validation.reasonCode ?? 'Cannot assign resident');
        return;
      }
      gameplay.startActivity(residentId, job.id);
      setFeedback(`Assigned to ${job.name}`);
      trackTelemetryEvent('job_poi_roster_time_assigned', { residentId, jobId: job.id });
    },
    [gameplay, job]
  );

  const handleToggle = useCallback(() => {
    if (state.isPaused) {
      gameplay.resumeGame('user');
    } else {
      gameplay.pauseGame('user');
    }
  }, [gameplay, state.isPaused]);

  const handleAdvance = useCallback(() => {
    // Manual single-step: tick() ignores ticks while paused, so temporarily
    // unpause to advance exactly one step, then restore the paused state.
    const wasPaused = useMinimalGameplayStore.getState().state.isPaused;
    if (wasPaused) {
      useMinimalGameplayStore.setState((s) => ({ state: { ...s.state, isPaused: false } }));
    }
    useMinimalGameplayStore.getState().tick(1000, 'manual');
    if (wasPaused) {
      useMinimalGameplayStore.setState((s) => ({ state: { ...s.state, isPaused: true } }));
    }
    trackTelemetryEvent('job_poi_roster_time_advance', { amount: 1000, jobId: job?.id });
  }, [job?.id]);

  // HUD state for TimeEngineStrip (compact mode reads the active activity count).
  const hudState = useMemo<ActiveHUDState>(
    () =>
      ({
        activities: state.activeActivities.map((activity) => ({ id: activity.activityId })),
        totalActive: state.activeActivities.length,
        totalCompleted: rewardEntries.length,
        counts: {
          jobs: state.activeActivities.length,
          quests: 0,
          maintenance: 0,
          total: state.activeActivities.length,
        },
        hasActiveActivities: state.activeActivities.length > 0,
        persistence: {
          lastSaveTime: null,
          isDirty: false,
          preferences: {
            collapsed: false,
            maxVisible: 5,
            sortBy: 'remaining-time' as const,
            showTypeBadges: true,
            compactMode: false,
          },
          uiState: {
            selectedTypeFilter: 'all' as const,
            telemetryPanelOpen: false,
            position: 'top' as const,
          },
          metadata: { lastSaved: 0, version: '1.0.0' },
        },
      }) as unknown as ActiveHUDState,
    [state.activeActivities, rewardEntries.length]
  );

  const phaseIcon = (
    <DayNightPoiSkin
      isDayPhase={state.isDayPhase}
      cycleProgress={state.cycleProgress}
      isPaused={state.isPaused}
    />
  );

  const totalRewardWood = rewardEntries.reduce((sum, entry) => {
    const found = config.activities.find((a) => a.id === entry.activityId);
    return sum + (found?.baseReward.wood ?? 0);
  }, 0);

  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <StyleLabSurface>
          <DndContext>
            <DragProvider>
              <TooltipProvider>
                <div className="job-poi-roster-time-integration-page" data-testid="job-poi-roster-time-page">
                  <header className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      Job POI + Roster + Time Engine Integration
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Componenti certificati + reward reali dal time engine (config-first)
                    </p>
                  </header>

                  {/* TIME ENGINE STRIP (certified day/night + clock + speed) */}
                  <div className="mb-6 rounded-xl bg-slate-950 p-4">
                    <TimeEngineStrip
                      phaseIcon={phaseIcon}
                      isPlaying={!state.isPaused}
                      progressFraction={state.cycleProgress}
                      totalSeconds={
                        (config.globalRules.dayNightCycle?.dayTimeUnits ?? 5) +
                        (config.globalRules.dayNightCycle?.nightTimeUnits ?? 5)
                      }
                      onToggle={handleToggle}
                      label="Day/Night Cycle"
                      clockProps={{
                        currentDay: state.currentDay,
                        isPaused: state.isPaused,
                        speedMultiplier: state.speedMultiplier,
                        defaultSpeedMultiplier: config.loop.defaultSpeedMultiplier,
                        maxSpeedMultiplier: config.loop.maxSpeedMultiplier,
                        tickIntervalMs: state.tickIntervalMs,
                        warmupDelayMs: 0,
                        accentHex: '#f59e0b',
                        onSpeedChange: (speed: number) => gameplay.setSpeedMultiplier(speed),
                      }}
                      hudState={hudState}
                      villageState={{ resources: { gold: state.gold, wood: state.wood } }}
                      secondsPerTimeUnit={config.globalRules.secondsPerTimeUnit ?? 1}
                      temporalDisplay={{
                        year: `DAY ${state.currentDay}`,
                        season: state.isDayPhase ? 'GIORNO' : 'NOTTE',
                        time: `${Math.round(state.cycleProgress * 100)}%`,
                      }}
                      compact
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAdvance}
                        data-testid="advance-time-button"
                        className="px-4 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
                      >
                        Advance 1 tick
                      </button>
                      <span className="text-xs text-white/60" data-testid="current-tick">
                        Tick {state.currentTick} · {state.isPaused ? 'Paused' : 'Running'}
                      </span>
                    </div>
                  </div>

                  {/* STATUS HUD (resources, config-driven) */}
                  <div
                    className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3"
                    data-testid="status-hud"
                  >
                    <HudStat label="Day" value={state.currentDay} />
                    <HudStat label="Gold" value={state.gold} accent="#FFD700" />
                    <HudStat label="Food" value={`${state.food}/${state.maxFood}`} accent="#22c55e" />
                    <HudStat label="Wood" value={state.wood} accent="#8B4513" />
                    <HudStat label="XP" value={state.xp} accent="#3b82f6" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Job POI detail */}
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          🪓 Job: {job?.name ?? 'N/A'}
                        </h2>
                        {job ? (
                          <>
                            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300 mb-4">
                              <div><strong>ID:</strong> {job.id}</div>
                              <div><strong>Type:</strong> {job.type}</div>
                              <div><strong>Duration:</strong> {job.durationTicks} tick(s)</div>
                              <div><strong>Fatigue / tick:</strong> {job.fatiguePerTick}</div>
                              <div><strong>Danger:</strong> {job.dangerRating}</div>
                              <div>
                                <strong>Reward:</strong> {job.baseReward.wood ? `+${job.baseReward.wood} wood ` : ''}
                                {job.baseReward.gold ? `+${job.baseReward.gold} gold ` : ''}
                                {job.baseReward.xp ? `+${job.baseReward.xp} xp` : ''}
                              </div>
                            </div>
                            <ActivityCapsuleDetailSkinAware
                              activityId={job.id}
                              name={job.name}
                              type="job"
                              subtitle="Production Job"
                              status={isJobActive ? 'in-progress' : 'idle'}
                              progress={jobProgress}
                              duration={job.durationTicks}
                              elapsed={isJobActive ? job.durationTicks - activeForJob[0].ticksRemaining : 0}
                              slots={activeForJob.map((activity) => ({
                                id: activity.residentId,
                                state: 'active',
                                initial:
                                  residents.find((r) => r.id === activity.residentId)?.name?.charAt(0) ?? 'R',
                                progress: jobProgress,
                              }))}
                              maxSlots={job.maxSlots === 'infinite' ? 99 : job.maxSlots}
                              durationDisplay={`${job.durationTicks} tick`}
                              rewardDisplay="Wood + XP"
                              etaDisplay={`${isJobActive ? activeForJob[0].ticksRemaining : job.durationTicks} tick`}
                              telemetry={[]}
                              isOpen
                            />
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">No job activity in config.</p>
                        )}
                      </div>
                    </div>

                    {/* Middle: Canonical roster */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        👥 Village Roster
                      </h2>
                      {feedback && (
                        <div
                          className="mb-3 text-sm text-blue-700 dark:text-blue-300"
                          data-testid="assign-feedback"
                        >
                          {feedback}
                        </div>
                      )}
                      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                        Clicca un residente disponibile per assegnarlo al job.
                      </p>
                      <VillageRosterSection
                        residents={residents}
                        sortMode={sortMode}
                        onSortModeChange={setSortMode}
                        onResidentSelect={handleAssign}
                        isDayPhase={state.isDayPhase}
                        componentId="job-poi-roster"
                        dragVisualState={selectedResident ? { mode: 'idle', residentId: selectedResident } : undefined}
                      />
                    </div>

                    {/* Right: Real reward log */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        💰 Rewards (real, from time engine)
                      </h2>
                      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                        <strong>Completions:</strong> {rewardEntries.length} ·{' '}
                        <strong>Wood earned:</strong> {totalRewardWood}
                      </div>
                      <div
                        className="space-y-2 max-h-96 overflow-y-auto"
                        data-testid="reward-log"
                      >
                        {rewardEntries.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No rewards yet. Assign a resident and advance time.
                          </p>
                        ) : (
                          rewardEntries.map((entry) => (
                            <div
                              key={entry.id}
                              data-testid="reward-entry"
                              className={`rounded-lg p-3 border ${
                                entry.severity === 'warning'
                                  ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700'
                                  : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                              }`}
                            >
                              <div className="text-sm text-gray-800 dark:text-gray-100">{entry.message}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipProvider>
            </DragProvider>
          </DndContext>
        </StyleLabSurface>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
};

export default JobPoiRosterTimeIntegrationPage;

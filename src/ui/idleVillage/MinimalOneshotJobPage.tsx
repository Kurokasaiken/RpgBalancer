import type { JSX } from 'react';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { useCentralizedTiming } from '@/ui/idleVillage/hooks/useCentralizedTiming';
import { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
import { useMinimalGameplayWithIdleVillageConfig, useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import DayNightPOI from '@/ui/idleVillage/components/minimal/DayNightPOI';
import { ResourcePanel } from '@/ui/idleVillage/components/ResourcePanel';
import { SlotRackKitShell, ResidentSlotRack } from '@/ui/idleVillage/frozen/kits/slotRackKit';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';

interface TickLogEntry {
  tick: number;
  day: number;
  isDayPhase: boolean;
  timestamp: string;
  events: string[];
  residents: Array<{ id: string; name: string; fatigue: number; maxFatigue: number; isWorking: boolean; isInjured: boolean; isDead: boolean }>;
  resources: Record<string, number>;
}

function StaminaBar({ fatigue, max }: { fatigue: number; max: number }) {
  const pct = Math.max(0, Math.min(100, ((max - fatigue) / max) * 100));
  const color = pct > 66 ? 'bg-emerald-500' : pct > 33 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-3 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-20">{(max - fatigue).toFixed(0)}/{max}</span>
    </div>
  );
}

function TickLogPanel({ entries, autoScroll }: { entries: TickLogEntry[]; autoScroll: boolean }) {
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoScroll && logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length, autoScroll]);

  if (entries.length === 0) return <div className="text-slate-500 text-sm italic p-4">Premi Resume, poi assegna un PG a un'activity.</div>;

  return (
    <div className="space-y-1 font-mono text-xs max-h-[600px] overflow-y-auto p-2">
      {entries.map((entry, i) => (
        <div key={i} className={`p-2 rounded border ${entry.isDayPhase ? 'border-amber-800/30 bg-amber-950/20' : 'border-indigo-800/30 bg-indigo-950/20'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500 text-[10px]">{entry.timestamp}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${entry.isDayPhase ? 'bg-amber-900/50 text-amber-300' : 'bg-indigo-900/50 text-indigo-300'}`}>
              {entry.isDayPhase ? 'DAY' : 'NIGHT'}
            </span>
            <span className="text-slate-300">D{entry.day} T{entry.tick}</span>
          </div>
          {entry.events.map((evt, j) => {
            const isDanger = evt.includes('DEAD') || evt.includes('DEATH') || evt.includes('KILLED');
            const isWarn = evt.includes('INJUR') || evt.includes('REST') || evt.includes('EJECT');
            const isGood = evt.includes('COMPLETE') || evt.includes('COLLECT') || evt.includes('REWARD') || evt.includes('ASSIGN');
            return (
              <div key={j} className={`ml-2 ${isDanger ? 'text-red-400 font-bold' : isWarn ? 'text-orange-400' : isGood ? 'text-emerald-400' : 'text-slate-400'}`}>
                {evt}
              </div>
            );
          })}
          {entry.residents.map(r => (
            <div key={r.id} className="ml-2 flex items-center gap-2 mt-0.5">
              <span className={`w-28 truncate text-xs ${r.isDead ? 'text-red-400 line-through' : r.isInjured ? 'text-orange-400' : 'text-slate-300'}`}>{r.name}</span>
              <StaminaBar fatigue={r.fatigue} max={r.maxFatigue} />
              <span className={`text-[10px] px-1 rounded ${r.isDead ? 'bg-red-900/50 text-red-300' : r.isInjured ? 'bg-orange-900/50 text-orange-300' : r.isWorking ? 'bg-green-900/50 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                {r.isDead ? 'DEAD' : r.isInjured ? 'INJURED' : r.isWorking ? 'WORKING' : 'IDLE'}
              </span>
            </div>
          ))}
          <div className="ml-2 mt-0.5 text-yellow-500/60 text-[10px]">
            {Object.entries(entry.resources).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(1) : v}`).join(' | ')}
          </div>
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
}

function ResidentCard({ resident, maxFatigue, isAssigned, activityLabel, onAssign }: {
  resident: any; maxFatigue: number; isAssigned: boolean; activityLabel?: string; onAssign: (activityId: string) => void;
}) {
  const isDead = (resident as any)._dead;
  return (
    <div className={`p-3 rounded border ${isDead ? 'border-red-700 bg-red-950/30 opacity-50' : isAssigned ? 'border-teal-600 bg-teal-950/30' : resident.isInjured ? 'border-orange-600 bg-orange-950/30' : 'border-slate-700 bg-slate-800/50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className={`text-sm font-medium ${isDead ? 'text-red-400 line-through' : 'text-slate-200'}`}>{resident.displayName || resident.id}</span>
          <span className="ml-2 text-xs text-slate-500">Lv{resident.level ?? 1}</span>
          {resident.isHero && <span className="ml-1 text-xs text-amber-400">*</span>}
          {isDead && <span className="ml-1 text-xs text-red-400">DEAD</span>}
          {resident.isInjured && !isDead && <span className="ml-1 text-xs text-orange-400">INJURED</span>}
        </div>
        {!isDead && !isAssigned && (
          <div className="flex gap-1">
            <button onClick={() => onAssign('job_oneshot_safe_test')} disabled={resident.isInjured}
              className={`px-2 py-1 rounded text-[10px] font-bold ${resident.isInjured ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-green-700 hover:bg-green-600 text-white cursor-pointer'}`}>
              Safe
            </button>
            <button onClick={() => onAssign('job_oneshot_danger_test')} disabled={resident.isInjured}
              className={`px-2 py-1 rounded text-[10px] font-bold ${resident.isInjured ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-red-700 hover:bg-red-600 text-white cursor-pointer'}`}>
              Danger
            </button>
          </div>
        )}
        {isAssigned && <span className="text-xs text-teal-300">{activityLabel ?? 'Working...'}</span>}
      </div>
      <StaminaBar fatigue={resident.fatigue ?? 0} max={maxFatigue} />
    </div>
  );
}

// POI card for completed activities awaiting collection
function CompletedPOI({ activity, actDef, residentName, onCollect }: {
  activity: any; actDef: any; residentName: string; onCollect: () => void;
}) {
  return (
    <div className="p-4 rounded-lg border-2 border-amber-500 bg-amber-950/40 animate-pulse cursor-pointer hover:bg-amber-950/60 transition-colors"
      onClick={onCollect} role="button" tabIndex={0}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-amber-200">{actDef?.label ?? activity.activityId}</div>
          <div className="text-xs text-amber-400/70">Completato da {residentName}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Ricompense:</div>
          {(actDef?.rewards ?? []).map((r: any, i: number) => (
            <div key={i} className="text-sm font-bold text-yellow-300">+{r.amountFormula} {r.resourceId}</div>
          ))}
        </div>
      </div>
      <div className="mt-2 text-center text-xs text-amber-300 font-semibold tracking-wider">CLICK PER RACCOGLIERE</div>
    </div>
  );
}

export default function MinimalOneshotJobPage(): JSX.Element {
  const { config: idleVillageConfig } = useIdleVillageConfig();
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();
  const styleLabTokens = useStyleLabTokens();
  const [tickLog, setTickLog] = useState<TickLogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const lastTickRef = useRef<number>(-1);
  const prevResidentsRef = useRef<Map<string, { fatigue: number; isInjured: boolean; isDead: boolean }>>(new Map());
  const prevGoldRef = useRef<number>(0);
  const prevActivityCountRef = useRef<number>(0);

  useEffect(() => {
    if (gameplayState.config?.activities?.length > 0) {
      const rawActivities = idleVillageConfig.activities ?? {};
      useMinimalGameplayStore.setState({ config: gameplayState.config, _rawActivities: rawActivities } as any);
    }
  }, [gameplayState.config]);

  useCentralizedTiming({ gameplayState });

  const stateResidents = gameplayState.state.residents ?? [];
  const activeActivities = gameplayState.state.activeActivities ?? [];
  const maxFatigue = idleVillageConfig.globalRules?.maxFatigueBeforeExhausted ?? 100;
  const rawActivities = idleVillageConfig.activities ?? {};

  const safeActivity = rawActivities['job_oneshot_safe_test'];
  const dangerActivity = rawActivities['job_oneshot_danger_test'];

  const handleAssign = useCallback((residentId: string, activityId: string) => {
    const validation = gameplayState.canStartActivity(residentId, activityId);
    if (!validation.canStart) {
      setTickLog(prev => [...prev, {
        tick: gameplayState.state.currentTick, day: gameplayState.state.currentDay,
        isDayPhase: gameplayState.state.isDayPhase, timestamp: new Date().toLocaleTimeString('it-IT'),
        events: [`BLOCKED: ${residentId} -> ${validation.reason ?? validation.reasonCode}`],
        residents: [], resources: {},
      }]);
      return;
    }
    gameplayState.startActivity(residentId, activityId);
    const label = rawActivities[activityId]?.label ?? activityId;
    setTickLog(prev => [...prev, {
      tick: gameplayState.state.currentTick, day: gameplayState.state.currentDay,
      isDayPhase: gameplayState.state.isDayPhase, timestamp: new Date().toLocaleTimeString('it-IT'),
      events: [`ASSIGNED: ${residentId} -> ${label}`],
      residents: [], resources: {},
    }]);
  }, [gameplayState, rawActivities]);

  // Collect rewards from completed POI
  const handleCollect = useCallback((activity: any) => {
    const actDef = rawActivities[activity.activityId];
    const rewards = actDef?.rewards ?? [];

    useMinimalGameplayStore.setState((s) => {
      const nextState = { ...s.state };
      for (const reward of rewards) {
        const amount = parseFloat(reward.amountFormula ?? '0');
        if (reward.resourceId === 'gold') nextState.gold = (nextState.gold ?? 0) + amount;
        else if (reward.resourceId === 'food') nextState.food = Math.min(nextState.maxFood ?? 20, (nextState.food ?? 0) + amount);
      }
      // Remove the completed activity and free the resident
      nextState.activeActivities = (nextState.activeActivities ?? []).filter(
        (a: any) => a.residentId !== activity.residentId
      );
      nextState.residents = nextState.residents.map((r: any) =>
        r.id === activity.residentId ? { ...r, isWorking: false } : r
      );
      return { state: nextState };
    });

    const label = actDef?.label ?? activity.activityId;
    setTickLog(prev => [...prev, {
      tick: gameplayState.state.currentTick, day: gameplayState.state.currentDay,
      isDayPhase: gameplayState.state.isDayPhase, timestamp: new Date().toLocaleTimeString('it-IT'),
      events: [`COLLECTED: ${label} rewards claimed! ${rewards.map((r: any) => `+${r.amountFormula} ${r.resourceId}`).join(', ')}`],
      residents: [], resources: {},
    }]);
  }, [rawActivities, gameplayState]);

  // Tick log — diff-based
  useEffect(() => {
    const currentTick = gameplayState.state.currentTick;
    if (currentTick === lastTickRef.current) return;
    if (lastTickRef.current === -1) {
      lastTickRef.current = currentTick;
      stateResidents.forEach((r: any) => prevResidentsRef.current.set(r.id, { fatigue: r.fatigue ?? 0, isInjured: r.isInjured ?? false, isDead: (r as any)._dead ?? false }));
      prevGoldRef.current = gameplayState.state.gold;
      prevActivityCountRef.current = activeActivities.length;
      return;
    }
    lastTickRef.current = currentTick;
    const tickEvents: string[] = [];

    for (const r of stateResidents) {
      const prev = prevResidentsRef.current.get(r.id);
      const prevFatigue = prev?.fatigue ?? 0;
      const curFatigue = r.fatigue ?? 0;
      const delta = curFatigue - prevFatigue;
      const isAssigned = activeActivities.some((a: any) => a.residentId === r.id);
      const isDead = (r as any)._dead;
      const wasInjured = prev?.isInjured ?? false;
      const wasDead = prev?.isDead ?? false;

      if (isDead && !wasDead) {
        tickEvents.push(`DEATH: ${r.displayName || r.id} e' morto durante l'attivita'!`);
      } else if (r.isInjured && !wasInjured) {
        tickEvents.push(`INJURED: ${r.displayName || r.id} e' stato ferito!`);
      }

      if (isAssigned && Math.abs(delta) > 0.01) {
        if ((r as any)._resting) {
          tickEvents.push(`REST: ${r.displayName || r.id} (${prevFatigue.toFixed(1)} -> ${curFatigue.toFixed(1)})`);
        } else if (delta > 0) {
          tickEvents.push(`FATIGUE +${delta.toFixed(1)}: ${r.displayName || r.id} (${prevFatigue.toFixed(1)} -> ${curFatigue.toFixed(1)})`);
        }
      }

      // Check one-shot completion
      if (isAssigned) {
        const act = activeActivities.find((a: any) => a.residentId === r.id);
        if (act && (act as any)._completed && !(act as any)._loggedComplete) {
          const label = rawActivities[act.activityId]?.label ?? act.activityId;
          tickEvents.push(`COMPLETED: ${r.displayName || r.id} ha finito "${label}" — clicca il POI per raccogliere!`);
          (act as any)._loggedComplete = true;
        }
      }

      prevResidentsRef.current.set(r.id, { fatigue: curFatigue, isInjured: r.isInjured ?? false, isDead: isDead ?? false });
    }

    const curGold = gameplayState.state.gold;
    if (curGold > prevGoldRef.current + 0.01 && activeActivities.length > 0) {
      tickEvents.push(`REWARD +${(curGold - prevGoldRef.current).toFixed(2)} gold`);
    }
    prevGoldRef.current = curGold;

    if (prevActivityCountRef.current > activeActivities.length) {
      const diff = prevActivityCountRef.current - activeActivities.length;
      tickEvents.push(`EXTRACTED: ${diff} resident(s) removed from activity`);
    }
    prevActivityCountRef.current = activeActivities.length;

    if (tickEvents.length === 0) tickEvents.push('— idle —');

    setTickLog(prev => {
      const entry: TickLogEntry = {
        tick: currentTick, day: gameplayState.state.currentDay,
        isDayPhase: gameplayState.state.isDayPhase, timestamp: new Date().toLocaleTimeString('it-IT'),
        events: tickEvents,
        residents: stateResidents.map((r: any) => ({
          id: r.id, name: r.displayName || r.id,
          fatigue: r.fatigue ?? 0, maxFatigue,
          isWorking: r.isWorking ?? false, isInjured: r.isInjured ?? false,
          isDead: (r as any)._dead ?? false,
        })),
        resources: { gold: gameplayState.state.gold, food: gameplayState.state.food },
      };
      const next = [...prev, entry];
      return next.length > 300 ? next.slice(-300) : next;
    });
  }, [gameplayState.state.currentTick]);

  const assignedResidentIds = new Set(activeActivities.map((a: any) => a.residentId));
  const completedActivities = activeActivities.filter((a: any) => (a as any)._completed);

  // Slot view models for each test activity type
  const buildSlots = (activityId: string, maxSlots: number): ResidentSlotViewModel[] => {
    const matching = activeActivities.filter((a: any) => a.activityId === activityId);
    return Array.from({ length: maxSlots }, (_, i) => {
      const activity = matching[i];
      const residentId = activity?.residentId ?? null;
      const resident = residentId ? stateResidents.find((r: any) => r.id === residentId) : undefined;
      const isComplete = (activity as any)?._completed;
      return {
        id: `${activityId}-slot-${i}`,
        index: i,
        label: resident?.displayName ?? `Slot ${i + 1}`,
        assignedResidentId: residentId,
        assignedResident: resident,
        isPlaceholder: false,
        dropState: 'idle' as const,
        bloomState: isComplete ? 'success' as const : resident?.isInjured ? 'warn' as const : residentId ? 'active' as const : 'idle' as const,
        status: residentId ? 'assigned' as const : 'empty' as const,
        telemetryTags: [activityId],
      };
    });
  };

  const safeSlots = useMemo(() => buildSlots('job_oneshot_safe_test', 1), [activeActivities, stateResidents]);
  const dangerSlots = useMemo(() => buildSlots('job_oneshot_danger_test', 1), [activeActivities, stateResidents]);

  return (
    <div data-testid="minimal-oneshot-job-page" className="bg-slate-950 min-h-screen text-slate-100">
      <div className="p-4 border-b border-amber-800/30 bg-slate-900/50">
        <h1 className="text-xl font-bold text-amber-200 tracking-wider">ONE-SHOT JOB TEST — Injury/Death + Collect</h1>
        <p className="text-sm text-slate-400 mt-1">
          PG fa l'attivita' → countdown tick → completata → halo colorato → click POI per raccogliere → PG libero.
          Ogni tick: check injury (force-extract) e death (force-extract + dead).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <div className="space-y-4">
          {/* Time Engine */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-slate-300 tracking-wider">TIME ENGINE</h3>
            <div className="grid grid-cols-2 gap-4">
              <ClockWidget
                currentDay={gameplayState.state.currentDay}
                isPaused={gameplayState.state.isPaused}
                speedMultiplier={gameplayState.state.speedMultiplier}
                defaultSpeedMultiplier={gameplayState.config.loop.defaultSpeedMultiplier}
                maxSpeedMultiplier={gameplayState.config.loop.maxSpeedMultiplier}
                tickIntervalMs={gameplayState.state.tickIntervalMs}
                warmupDelayMs={gameplayState.config.loop.warmupDelayMs}
                accentHex={styleLabTokens.modifierScopes.SESSION.border}
                onSpeedChange={(speed) => gameplayState.setSpeedMultiplier(speed)}
              />
              <div className="flex items-center justify-center"><DayNightPOI /></div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => gameplayState.state.isPaused ? gameplayState.resumeGame('user') : gameplayState.pauseGame('user')}
                className={`px-4 py-2 rounded text-sm font-bold ${gameplayState.state.isPaused ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}>
                {gameplayState.state.isPaused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={() => { gameplayState.resetGame(); setTickLog([]); lastTickRef.current = -1; prevResidentsRef.current.clear(); }}
                className="px-4 py-2 rounded text-sm bg-slate-700 hover:bg-slate-600 text-slate-200">Reset</button>
            </div>
          </StyleLabSurface>

          {/* Resources */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-slate-300 tracking-wider">RESOURCES</h3>
            <ResourcePanel items={[
              { id: 'gold', label: 'Gold', icon: 'gold', value: gameplayState.state.gold.toFixed(1), accentClass: 'text-yellow-500' },
              { id: 'food', label: 'Food', icon: 'food', value: `${gameplayState.state.food}/${gameplayState.state.maxFood}`, accentClass: 'text-green-500' },
            ]} />
          </StyleLabSurface>

          {/* Roster */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-slate-300 tracking-wider">ROSTER ({stateResidents.length})</h3>
            <div className="space-y-2">
              {stateResidents.map((r: any) => {
                const act = activeActivities.find((a: any) => a.residentId === r.id);
                const label = act ? (rawActivities[act.activityId]?.label ?? act.activityId) : undefined;
                return (
                  <ResidentCard key={r.id} resident={r} maxFatigue={maxFatigue}
                    isAssigned={assignedResidentIds.has(r.id)} activityLabel={label}
                    onAssign={(actId) => handleAssign(r.id, actId)} />
                );
              })}
            </div>
          </StyleLabSurface>

          {/* Completed POIs — awaiting collection */}
          {completedActivities.length > 0 && (
            <StyleLabSurface variant="card" className="w-full">
              <h3 className="text-sm font-semibold mb-3 text-amber-300 tracking-wider">POI COMPLETATI — Clicca per raccogliere</h3>
              <div className="space-y-2">
                {completedActivities.map((a: any) => {
                  const resident = stateResidents.find((r: any) => r.id === a.residentId);
                  return (
                    <CompletedPOI key={a.residentId} activity={a}
                      actDef={rawActivities[a.activityId]}
                      residentName={resident?.displayName || a.residentId}
                      onCollect={() => handleCollect(a)} />
                  );
                })}
              </div>
            </StyleLabSurface>
          )}

          {/* Activity Slots — Safe */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-green-300 tracking-wider">
              SAFE: {safeActivity?.label ?? '?'} ({safeSlots.filter(s => s.assignedResidentId).length}/{safeSlots.length})
            </h3>
            <div className="text-xs text-slate-500 mb-2">
              Durata: {safeActivity?.durationFormula ?? '?'} ticks | Danger: 0 | Reward: {safeActivity?.rewards?.map((r: any) => `${r.amountFormula} ${r.resourceId}`).join(', ')}
            </div>
            <TooltipProvider><SlotRackKitShell>
              <ResidentSlotRack slots={safeSlots} layout="detail" />
            </SlotRackKitShell></TooltipProvider>
          </StyleLabSurface>

          {/* Activity Slots — Danger */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-red-300 tracking-wider">
              DANGER: {dangerActivity?.label ?? '?'} ({dangerSlots.filter(s => s.assignedResidentId).length}/{dangerSlots.length})
            </h3>
            <div className="text-xs text-slate-500 mb-2">
              Durata: {dangerActivity?.durationFormula ?? '?'} ticks | Injury: {((dangerActivity?.injuryChancePerTick ?? 0) * 100).toFixed(0)}%/tick | Death: {((dangerActivity?.deathChancePerTick ?? 0) * 100).toFixed(0)}%/tick | Reward: {dangerActivity?.rewards?.map((r: any) => `${r.amountFormula} ${r.resourceId}`).join(', ')}
            </div>
            <TooltipProvider><SlotRackKitShell>
              <ResidentSlotRack slots={dangerSlots} layout="detail" />
            </SlotRackKitShell></TooltipProvider>
          </StyleLabSurface>

          {/* Config */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-slate-300 tracking-wider">CONFIG</h3>
            <div className="text-xs text-slate-500 space-y-0.5 font-mono">
              <div>maxFatigue: {maxFatigue}</div>
              <div>ticksPerDay: {idleVillageConfig.globalRules?.ticksPerDay ?? idleVillageConfig.globalRules?.dayLengthInTimeUnits ?? '?'}</div>
              <div>store activities: {gameplayState.config?.activities?.length ?? 0}</div>
            </div>
          </StyleLabSurface>
        </div>

        {/* RIGHT: Tick Log */}
        <div>
          <StyleLabSurface variant="card" className="w-full sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300 tracking-wider">TICK LOG ({tickLog.length})</h3>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs text-slate-400">
                  <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="rounded" />
                  Auto-scroll
                </label>
                <button onClick={() => setTickLog([])} className="px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300">Clear</button>
              </div>
            </div>
            <TickLogPanel entries={tickLog} autoScroll={autoScroll} />
          </StyleLabSurface>
        </div>
      </div>
    </div>
  );
}

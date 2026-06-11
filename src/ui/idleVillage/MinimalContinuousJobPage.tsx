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

// ─── Types ─────────────────────────────────────────────────────
interface TickLogEntry {
  tick: number;
  day: number;
  isDayPhase: boolean;
  timestamp: string;
  events: string[];
  residents: Array<{
    id: string;
    name: string;
    fatigue: number;
    maxFatigue: number;
    isWorking: boolean;
    isInjured: boolean;
  }>;
  resources: Record<string, number>;
}

// ─── Stamina Bar ───────────────────────────────────────────────
function StaminaBar({ fatigue, max }: { fatigue: number; max: number }) {
  const staminaPct = Math.max(0, Math.min(100, ((max - fatigue) / max) * 100));
  const color = staminaPct > 66 ? 'bg-emerald-500' : staminaPct > 33 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-3 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${staminaPct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-20">
        {(max - fatigue).toFixed(0)}/{max} stamina
      </span>
    </div>
  );
}

// ─── Log Panel ─────────────────────────────────────────────────
function TickLogPanel({ entries, autoScroll }: { entries: TickLogEntry[]; autoScroll: boolean }) {
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries.length, autoScroll]);

  if (entries.length === 0) {
    return (
      <div className="text-slate-500 text-sm italic p-4">
        Nessun tick registrato. Premi ▶ Resume per avviare il tempo, poi assegna un PG.
      </div>
    );
  }

  return (
    <div className="space-y-1 font-mono text-xs max-h-[600px] overflow-y-auto p-2">
      {entries.map((entry, i) => (
        <div key={i} className={`p-2 rounded border ${
          entry.isDayPhase ? 'border-amber-800/30 bg-amber-950/20' : 'border-indigo-800/30 bg-indigo-950/20'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500 text-[10px]">{entry.timestamp}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              entry.isDayPhase ? 'bg-amber-900/50 text-amber-300' : 'bg-indigo-900/50 text-indigo-300'
            }`}>
              {entry.isDayPhase ? '☀ DAY' : '🌙 NIGHT'}
            </span>
            <span className="text-slate-300">D{entry.day} T{entry.tick}</span>
          </div>
          {entry.events.map((evt, j) => {
            const isWarn = evt.includes('REST') || evt.includes('EXHAUST') || evt.includes('EJECT');
            const isGood = evt.includes('REWARD') || evt.includes('RESUMED') || evt.includes('RECOVERY') || evt.includes('ASSIGN');
            return (
              <div key={j} className={`ml-2 ${isWarn ? 'text-orange-400' : isGood ? 'text-emerald-400' : 'text-slate-400'}`}>
                → {evt}
              </div>
            );
          })}
          {entry.residents.map(r => (
            <div key={r.id} className="ml-2 flex items-center gap-2 mt-0.5">
              <span className="text-slate-300 w-32 truncate">{r.name}</span>
              <StaminaBar fatigue={r.fatigue} max={r.maxFatigue} />
              <span className={`text-[10px] px-1 rounded ${
                r.isWorking ? 'bg-green-900/50 text-green-300' : 'bg-slate-700 text-slate-400'
              }`}>
                {r.isWorking ? '⚒ WORKING' : '🏠 IDLE'}
              </span>
            </div>
          ))}
          <div className="ml-2 mt-0.5 text-yellow-500/60 text-[10px]">
            {Object.entries(entry.resources).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(1) : v}`).join(' · ')}
          </div>
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
}

// ─── Resident Card (simple) ────────────────────────────────────
function ResidentCard({ resident, maxFatigue, isAssigned, onAssign }: {
  resident: any;
  maxFatigue: number;
  isAssigned: boolean;
  onAssign: () => void;
}) {
  return (
    <div className={`p-3 rounded border ${isAssigned ? 'border-teal-600 bg-teal-950/30' : 'border-slate-700 bg-slate-800/50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-medium text-slate-200">{resident.displayName || resident.id}</span>
          <span className="ml-2 text-xs text-slate-500">Lv{resident.level ?? 1}</span>
          {resident.isHero && <span className="ml-1 text-xs text-amber-400">⭐</span>}
        </div>
        <button
          onClick={onAssign}
          disabled={isAssigned || resident.isInjured}
          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
            isAssigned ? 'bg-teal-800 text-teal-300 cursor-not-allowed'
            : resident.isInjured ? 'bg-red-900 text-red-400 cursor-not-allowed'
            : 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
          }`}
        >
          {isAssigned ? '✓ Assigned' : '→ Assign'}
        </button>
      </div>
      <StaminaBar fatigue={resident.fatigue ?? 0} max={maxFatigue} />
      <div className="text-[10px] text-slate-500 mt-1">
        {resident.isWorking ? '⚒ Working' : resident.isInjured ? '🩹 Injured' : '🏠 Available'}
        {' · fatigue: '}{(resident.fatigue ?? 0).toFixed(1)}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────
export default function MinimalContinuousJobPage(): JSX.Element {
  const { config: idleVillageConfig } = useIdleVillageConfig();
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();
  const styleLabTokens = useStyleLabTokens();
  const [tickLog, setTickLog] = useState<TickLogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const lastTickRef = useRef<number>(-1);
  const prevGoldRef = useRef<number>(0);
  const prevActivityCountRef = useRef<number>(0);

  // Sync transformed config into the Zustand store so startActivity can find activities
  // Also store raw IdleVillage config activities as _rawActivities for continuous job lookup
  useEffect(() => {
    if (gameplayState.config?.activities?.length > 0) {
      const rawActivities = idleVillageConfig.activities ?? {};
      useMinimalGameplayStore.setState({
        config: gameplayState.config,
        _rawActivities: rawActivities,
      } as any);
    }
  }, [gameplayState.config]);

  useCentralizedTiming({ gameplayState });

  // Gameplay state residents (source of truth for engine)
  const stateResidents = gameplayState.state.residents ?? [];
  const activeActivities = gameplayState.state.activeActivities ?? [];
  const maxFatigue = idleVillageConfig.globalRules?.maxFatigueBeforeExhausted ?? 100;

  // Pick the dedicated test continuous job activity
  const continuousActivity = useMemo(() => {
    const activities = idleVillageConfig.activities ?? {};
    return activities['job_continuous_test']
      ?? Object.values(activities).find((a: any) => a.continuousJob === true);
  }, [idleVillageConfig.activities]);

  // Auto-assign handler
  const handleAssign = useCallback((residentId: string) => {
    if (!continuousActivity) return;
    const validation = gameplayState.canStartActivity(residentId, continuousActivity.id);
    if (!validation.canStart) {
      setTickLog(prev => [...prev, {
        tick: gameplayState.state.currentTick,
        day: gameplayState.state.currentDay,
        isDayPhase: gameplayState.state.isDayPhase,
        timestamp: new Date().toLocaleTimeString('it-IT'),
        events: [`❌ BLOCKED: ${residentId} → ${validation.reason ?? validation.reasonCode}`],
        residents: [],
        resources: { gold: gameplayState.state.gold, food: gameplayState.state.food },
      }]);
      return;
    }
    gameplayState.startActivity(residentId, continuousActivity.id);
    setTickLog(prev => [...prev, {
      tick: gameplayState.state.currentTick,
      day: gameplayState.state.currentDay,
      isDayPhase: gameplayState.state.isDayPhase,
      timestamp: new Date().toLocaleTimeString('it-IT'),
      events: [`🎯 ASSIGNED: ${residentId} → ${continuousActivity.label}`],
      residents: stateResidents.map((r: any) => ({
        id: r.id, name: r.displayName || r.id,
        fatigue: r.fatigue ?? 0, maxFatigue,
        isWorking: r.isWorking ?? false, isInjured: r.isInjured ?? false,
      })),
      resources: { gold: gameplayState.state.gold, food: gameplayState.state.food },
    }]);
  }, [continuousActivity, gameplayState, stateResidents, maxFatigue]);

  // Tick log — reads post-tick state (continuous job now processed inside store tick)
  const prevResidentsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const currentTick = gameplayState.state.currentTick;
    if (currentTick === lastTickRef.current) return;
    if (lastTickRef.current === -1) {
      lastTickRef.current = currentTick;
      stateResidents.forEach((r: any) => prevResidentsRef.current.set(r.id, r.fatigue ?? 0));
      return;
    }
    lastTickRef.current = currentTick;

    const tickEvents: string[] = [];
    const activities = gameplayState.state.activeActivities ?? [];

    for (const r of stateResidents) {
      const prevFatigue = prevResidentsRef.current.get(r.id) ?? 0;
      const curFatigue = r.fatigue ?? 0;
      const delta = curFatigue - prevFatigue;
      const isAssigned = activities.some((a: any) => a.residentId === r.id);

      if (isAssigned && Math.abs(delta) > 0.01) {
        if ((r as any)._resting) {
          tickEvents.push(`REST RECOVERY: ${r.displayName || r.id} (${prevFatigue.toFixed(1)} -> ${curFatigue.toFixed(1)})`);
          if (curFatigue <= 0) tickEvents.push(`RESUMED: ${r.displayName || r.id} back to work!`);
        } else if (delta > 0) {
          tickEvents.push(`FATIGUE +${delta.toFixed(1)}: ${r.displayName || r.id} (${prevFatigue.toFixed(1)} -> ${curFatigue.toFixed(1)})`);
          if (curFatigue >= maxFatigue) tickEvents.push(`REST MODE: ${r.displayName || r.id} entered rest (fatigue: ${curFatigue.toFixed(1)})`);
        } else {
          tickEvents.push(`RECOVERY: ${r.displayName || r.id} (${prevFatigue.toFixed(1)} -> ${curFatigue.toFixed(1)})`);
        }
      }
      prevResidentsRef.current.set(r.id, curFatigue);
    }

    // Check for rewards by comparing gold
    const prevGold = prevGoldRef.current;
    const curGold = gameplayState.state.gold;
    if (curGold > prevGold + 0.01 && activities.length > 0) {
      tickEvents.push(`REWARD +${(curGold - prevGold).toFixed(2)} gold`);
    }
    prevGoldRef.current = curGold;

    // Check for ejections (activity count dropped)
    if (prevActivityCountRef.current > activities.length) {
      tickEvents.push(`EJECTED: resident removed from activity`);
    }
    prevActivityCountRef.current = activities.length;

    if (tickEvents.length === 0) tickEvents.push('— idle —');

    setTickLog(prev => {
      const entry: TickLogEntry = {
        tick: currentTick,
        day: gameplayState.state.currentDay,
        isDayPhase: gameplayState.state.isDayPhase,
        timestamp: new Date().toLocaleTimeString('it-IT'),
        events: tickEvents,
        residents: stateResidents.map((r: any) => ({
          id: r.id, name: r.displayName || r.id,
          fatigue: r.fatigue ?? 0, maxFatigue,
          isWorking: r.isWorking ?? false, isInjured: r.isInjured ?? false,
        })),
        resources: { gold: gameplayState.state.gold, food: gameplayState.state.food },
      };
      const next = [...prev, entry];
      return next.length > 300 ? next.slice(-300) : next;
    });
  }, [gameplayState.state.currentTick]);

  // Check assigned status
  const assignedResidentIds = new Set(activeActivities.map((a: any) => a.residentId));

  // Build real ResidentSlotViewModel[] from engine state
  const slotViewModels: ResidentSlotViewModel[] = useMemo(() => {
    const rawSlots = (continuousActivity as any)?.maxSlots;
    const maxSlots = typeof rawSlots === 'number' ? rawSlots : 3;
    return Array.from({ length: maxSlots }, (_, i) => {
      const activity = activeActivities[i];
      const residentId = activity?.residentId ?? null;
      const resident = residentId ? stateResidents.find((r: any) => r.id === residentId) : undefined;
      const isResting = activity?.restingInSlot?.[residentId ?? ''] ?? false;
      return {
        id: `continuous-slot-${i}`,
        index: i,
        label: residentId
          ? `${resident?.displayName ?? residentId}${isResting ? ' (REST)' : ''}`
          : `Slot ${i + 1}`,
        assignedResidentId: residentId,
        assignedResident: resident ?? undefined,
        isPlaceholder: false,
        dropState: 'idle' as const,
        bloomState: isResting ? 'warn' as const : residentId ? 'success' as const : 'idle' as const,
        status: residentId ? 'assigned' as const : 'empty' as const,
        telemetryTags: ['continuous-job'],
      };
    });
  }, [activeActivities, stateResidents, continuousActivity]);

  // Handle slot clear (remove resident from activity)
  const handleSlotClear = useCallback((slotId: string) => {
    const idx = slotViewModels.findIndex(s => s.id === slotId);
    const activity = activeActivities[idx];
    if (activity) {
      gameplayState.cancelActivity?.(activity.id ?? activity.residentId);
    }
  }, [slotViewModels, activeActivities, gameplayState]);

  return (
    <div data-testid="minimal-continuous-job-page" className="bg-slate-950 min-h-screen text-slate-100">
      {/* Header */}
      <div className="p-4 border-b border-amber-800/30 bg-slate-900/50">
        <h1 className="text-xl font-bold text-amber-200 tracking-wider">
          CONTINUOUS JOB TEST — Stamina Loop
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          PG in slot → produce risorse + consuma stamina ogni tick → riposa quando esausto → riprende quando recuperato
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* LEFT: Controls */}
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
              <div className="flex items-center justify-center">
                <DayNightPOI />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => gameplayState.state.isPaused ? gameplayState.resumeGame('user') : gameplayState.pauseGame('user')}
                className={`px-4 py-2 rounded text-sm font-bold ${
                  gameplayState.state.isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}
              >
                {gameplayState.state.isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                onClick={() => { gameplayState.resetGame(); setTickLog([]); prevEventLogLenRef.current = 0; lastTickRef.current = -1; }}
                className="px-4 py-2 rounded text-sm bg-slate-700 hover:bg-slate-600 text-slate-200"
              >
                🔄 Reset All
              </button>
            </div>
          </StyleLabSurface>

          {/* Resources */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-slate-300 tracking-wider">RESOURCES</h3>
            <ResourcePanel
              items={[
                { id: 'gold', label: 'Gold', icon: 'gold', value: gameplayState.state.gold.toFixed(1), accentClass: 'text-yellow-500' },
                { id: 'food', label: 'Food', icon: 'food', value: `${gameplayState.state.food}/${gameplayState.state.maxFood}`, accentClass: 'text-green-500' },
              ]}
            />
          </StyleLabSurface>

          {/* Roster (from store — source of truth) */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-slate-300 tracking-wider">
              ROSTER ({stateResidents.length} residents)
            </h3>
            <div className="space-y-2">
              {stateResidents.map((r: any) => (
                <ResidentCard
                  key={r.id}
                  resident={r}
                  maxFatigue={maxFatigue}
                  isAssigned={assignedResidentIds.has(r.id)}
                  onAssign={() => handleAssign(r.id)}
                />
              ))}
              {stateResidents.length === 0 && (
                <div className="text-slate-500 text-sm italic">No residents in store</div>
              )}
            </div>
          </StyleLabSurface>

          {/* REAL Slot Rack */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-slate-300 tracking-wider">
              ACTIVITY SLOTS ({slotViewModels.filter(s => s.assignedResidentId).length}/{slotViewModels.length} occupied)
            </h3>
            <TooltipProvider>
              <SlotRackKitShell>
                <ResidentSlotRack
                  slots={slotViewModels}
                  layout="detail"
                  onSlotClear={handleSlotClear}
                  onSlotClick={(slotId) => {
                    const idx = slotViewModels.findIndex(s => s.id === slotId);
                    const unassigned = stateResidents.find((r: any) => !assignedResidentIds.has(r.id) && !r.isInjured);
                    if (unassigned && !slotViewModels[idx]?.assignedResidentId) {
                      handleAssign(unassigned.id);
                    }
                  }}
                  className="w-full"
                />
              </SlotRackKitShell>
            </TooltipProvider>
            <p className="text-[10px] text-slate-500 mt-2 italic">
              Click empty slot to assign next available PG. Hold assigned slot to extract.
            </p>
          </StyleLabSurface>

          {/* Activity Info */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-slate-300 tracking-wider">
              ACTIVITY: {continuousActivity?.label ?? '⚠ NOT FOUND'}
            </h3>
            {continuousActivity ? (
              <div className="text-xs text-slate-400 space-y-1">
                <div>📋 <strong>Tipo:</strong> Continuous Job {continuousActivity.allowInSlotRest ? '+ In-Slot Rest' : ''}</div>
                <div>⚡ <strong>Stamina cost/tick:</strong> {(continuousActivity as any).staminaCostPerTick ?? 'derived'}</div>
                <div>💤 <strong>Recovery/tick (rest):</strong> {(continuousActivity as any).inSlotRecoveryPerTick ?? 'global'}</div>
                <div>💰 <strong>Rewards/day:</strong> {continuousActivity.dailyRewardProfile?.map((r: any) => `${r.amountPerDay} ${r.resourceId}`).join(', ') ?? 'none'}</div>
                <div>🔄 <strong>Daily fatigue cost:</strong> {continuousActivity.dailyFatigueCost ?? 0}</div>
                <div>👥 <strong>Assigned:</strong> {assignedResidentIds.size} / {stateResidents.length}</div>
              </div>
            ) : (
              <div className="text-red-400 text-sm">Activity "job_continuous_test" not found in config!</div>
            )}
          </StyleLabSurface>

          {/* Config */}
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-sm font-semibold mb-3 text-slate-300 tracking-wider">CONFIG</h3>
            <div className="text-xs text-slate-500 space-y-0.5 font-mono">
              <div>maxFatigue: {maxFatigue}</div>
              <div>autoEject: {String(idleVillageConfig.globalRules?.autoEjectOnExhaustion ?? false)}</div>
              <div>inSlotRecovery/tick (global): {idleVillageConfig.globalRules?.inSlotRecoveryPerTick ?? 0}</div>
              <div>fatigueRecovery/day: {idleVillageConfig.globalRules?.fatigueRecoveryPerDay ?? 0}</div>
              <div>ticksPerDay: {idleVillageConfig.globalRules?.ticksPerDay ?? idleVillageConfig.globalRules?.dayLengthInTimeUnits ?? '?'}</div>
              <div>store activities: {gameplayState.config?.activities?.length ?? 0}</div>
            </div>
          </StyleLabSurface>
        </div>

        {/* RIGHT: Tick Log */}
        <div>
          <StyleLabSurface variant="card" className="w-full sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300 tracking-wider">
                TICK LOG ({tickLog.length})
              </h3>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs text-slate-400">
                  <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="rounded" />
                  Auto-scroll
                </label>
                <button
                  onClick={() => setTickLog([])}
                  className="px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300"
                >
                  Clear
                </button>
              </div>
            </div>
            <TickLogPanel entries={tickLog} autoScroll={autoScroll} />
          </StyleLabSurface>
        </div>
      </div>
    </div>
  );
}

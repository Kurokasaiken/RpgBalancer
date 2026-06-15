import type { JSX } from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { loadQuestBlueprint } from '@/balancing/config/idleVillage/quests/questBlueprints';
import { resolveQuestPower } from '@/engine/game/idleVillage/QuestPowerEngine';
import type { QuestOutcome, QuestPowerResult } from '@/engine/game/idleVillage/QuestPowerEngine';
import type { QuestState } from '@/balancing/config/idleVillage/types';
import QuestChronicle from '@/ui/idleVillage/components/QuestChronicle';
import type { QuestChronicleOutcome } from '@/ui/idleVillage/components/QuestChronicle';
import {
  applyPhaseResult,
  buildQuestChroniclePhases,
  createInitialQuestState,
} from '@/ui/idleVillage/questChronicleHelpers';
import { AltVisualsV6Asterism } from '@/ui/testing/AltVisualsV6Asterism';
import type { AltVisualsV6OutcomeEvent } from '@/ui/testing/AltVisualsV6Asterism';
import type { StatRow } from '@/ui/testing/types';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

const BLUEPRINT_ID = 'quest_city_rats';
const TICK_MS = 800;

const FAKE_STATS: StatRow[] = [
  { id: 'combat', name: 'Combattimento', questValue: 65, heroValue: 58, isDetrimental: false },
  { id: 'stealth', name: 'Furtività', questValue: 45, heroValue: 38, isDetrimental: false },
  { id: 'endurance', name: 'Resistenza', questValue: 70, heroValue: 55, isDetrimental: false },
  { id: 'perception', name: 'Percezione', questValue: 50, heroValue: 42, isDetrimental: false },
  { id: 'luck', name: 'Fortuna', questValue: 30, heroValue: 25, isDetrimental: false },
];

// Fake party for power resolution. Brando is NOT a hero yet: surviving a
// high-risk phase (Trial of Fire) can promote him during the simulation.
const FAKE_PARTY = [
  { id: 'hero-sir-spaccaculi', name: 'Sir Spaccaculi', status: 'available' as const, fatigue: 10, currentHp: 100, maxHp: 100, isHero: true, isInjured: false, survivalCount: 3, survivalScore: 5, combat: { attack: 8, defense: 6, speed: 5 } },
  { id: 'villager-brando', name: 'Brando', status: 'available' as const, fatigue: 5, currentHp: 90, maxHp: 100, isHero: false, isInjured: false, survivalCount: 2, survivalScore: 3, combat: { attack: 5, defense: 8, speed: 4 } },
];

function outcomeLabel(o: QuestOutcome): string {
  switch (o) {
    case 'perfect': return 'Big Win ★★';
    case 'success': return 'Win ✓';
    case 'partial': return 'Quasi ~';
    case 'fail': return 'Fallimento ✗';
    case 'deadly': return 'Critico ☠';
  }
}

/** Maps the 5-level QuestOutcome to the binary QuestPhaseResult used by the chronicle. */
function outcomeToPhaseResult(o: QuestOutcome): 'success' | 'failure' {
  return o === 'perfect' || o === 'success' || o === 'partial' ? 'success' : 'failure';
}

function buildChronicleOutcome(questState: QuestState, lastOutcome: QuestOutcome | null, xpAwarded?: number): QuestChronicleOutcome | undefined {
  if (questState.status === 'completed') {
    const subLabel = xpAwarded ? `Quest completata · +${xpAwarded} XP` : 'Quest completata';
    if (lastOutcome === 'perfect') {
      return { result: 'victory', label: 'Grande Vittoria', subLabel, icon: '★' };
    }
    return { result: 'victory', label: 'Vittoria', subLabel, icon: '✓' };
  }
  if (questState.status === 'failed') {
    if (lastOutcome === 'deadly') {
      return { result: 'defeat', label: 'Disfatta', subLabel: 'Fallimento critico', icon: '☠' };
    }
    return { result: 'defeat', label: 'Sconfitta', subLabel: 'Quest fallita', icon: '✗' };
  }
  return undefined;
}

export default function MinimalQuestDetailPage(): JSX.Element {
  const { config: idleVillageConfig } = useIdleVillageConfig();
  const baseBlueprint = loadQuestBlueprint(BLUEPRINT_ID);
  const activity = idleVillageConfig.activities?.[baseBlueprint.activityId];

  // Total quest = 6 ticks, split evenly: 2 ticks per phase.
  const TOTAL_QUEST_TICKS = 6;
  const blueprint = useMemo(() => {
    const perPhase = Math.max(1, Math.round(TOTAL_QUEST_TICKS / Math.max(1, baseBlueprint.phases.length)));
    return {
      ...baseBlueprint,
      phases: baseBlueprint.phases.map((p) => ({ ...p, durationValue: perPhase })),
    };
  }, [baseBlueprint]);

  const [questState, setQuestState] = useState<QuestState | null>(null);
  const [ticksInPhase, setTicksInPhase] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<QuestOutcome | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [skillCheckActive, setSkillCheckActive] = useState(false);
  const [skillCheckKey, setSkillCheckKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questStateRef = useRef<QuestState | null>(null);
  const ticksRef = useRef(0);
  const partyRef = useRef(FAKE_PARTY.map((m) => ({ ...m, dead: false })));
  const xpAwardedRef = useRef(0);
  questStateRef.current = questState;

  const isRunning = questState?.status === 'in_progress' && !skillCheckActive;

  const resolvePhaseOutcome = useCallback((): { outcome: QuestOutcome; power: QuestPowerResult | null } => {
    const rules = idleVillageConfig.globalRules?.questPowerRules;
    if (!activity || !rules) {
      const roll = Math.random();
      const outcome: QuestOutcome =
        roll < 0.1 ? 'perfect' : roll < 0.5 ? 'success' : roll < 0.75 ? 'partial' : roll < 0.95 ? 'fail' : 'deadly';
      return { outcome, power: null };
    }
    const aliveParty = partyRef.current.filter((member) => !member.dead);
    const power = resolveQuestPower(aliveParty as any, activity, rules, Math.random);
    return { outcome: power.outcome, power };
  }, [activity, idleVillageConfig]);

  const handleStart = useCallback(() => {
    ticksRef.current = 0;
    partyRef.current = FAKE_PARTY.map((m) => ({ ...m, dead: false }));
    xpAwardedRef.current = 0;
    setQuestState(createInitialQuestState(blueprint));
    setTicksInPhase(0);
    setLastOutcome(null);
    setLog([`Quest "${blueprint.name}" iniziata — ${blueprint.phases.length} fasi`]);
  }, [blueprint]);

  const handleReset = useCallback(() => {
    ticksRef.current = 0;
    partyRef.current = FAKE_PARTY.map((m) => ({ ...m, dead: false }));
    xpAwardedRef.current = 0;
    setQuestState(null);
    setTicksInPhase(0);
    setLastOutcome(null);
    setSkillCheckActive(false);
    setLog([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Tick loop: advances the active phase, resolves it via QuestPowerEngine,
  // then delegates progression to the existing applyPhaseResult helper.
  // State lives in refs so the StrictMode double-render cannot resolve a phase twice.
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const state = questStateRef.current;
      if (!state || state.status !== 'in_progress') return;
      const phase = blueprint.phases[state.currentPhaseIndex];
      if (!phase) return;

      ticksRef.current += 1;
      if (ticksRef.current < phase.durationValue) {
        setTicksInPhase(ticksRef.current);
        return;
      }

      // Phase ticks complete — pause and trigger skill check animation
      setTicksInPhase(phase.durationValue);
      setSkillCheckActive(true);
      setSkillCheckKey((k) => k + 1);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, TICK_MS);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, blueprint, resolvePhaseOutcome, idleVillageConfig, activity]);

  const handleV6Outcome = useCallback((event: AltVisualsV6OutcomeEvent) => {
    const state = questStateRef.current;
    if (!state || state.status !== 'in_progress') return;
    const phase = blueprint.phases[state.currentPhaseIndex];
    if (!phase) return;

    const rollNormalized = Math.round(event.roll);
    const isCrit = rollNormalized >= 95;
    const isFumble = rollNormalized <= 5;

    let outcome: QuestOutcome;
    if (isCrit) outcome = 'perfect';
    else if (event.success) outcome = 'success';
    else if (isFumble) outcome = 'deadly';
    else outcome = 'fail';

    const result = outcomeToPhaseResult(outcome);
    const next = applyPhaseResult({ state, blueprint, result });
    ticksRef.current = 0;
    setTicksInPhase(0);
    setLastOutcome(outcome);
    setQuestState(next);
    setSkillCheckActive(false);

    const entries: string[] = [`[Fase ${state.currentPhaseIndex + 1}] "${phase.title}" — ${outcomeLabel(outcome)} (roll: ${rollNormalized}, ${event.success ? 'nella stella' : 'fuori dalla stella'})`];

    const trialRules = idleVillageConfig.globalRules?.trialOfFire;
    const phaseDeathRisk = (phase.riskProfile?.deathChance ?? 0) / 100;
    const { power } = resolvePhaseOutcome();
    for (const member of partyRef.current) {
      if (member.dead) continue;
      const consequence = power?.consequences.find((c: any) => c.residentId === member.id)?.consequence ?? 'none';
      if (consequence === 'dead') {
        member.dead = true;
        entries.push(`☠ ${member.name} è MORTO durante "${phase.title}".`);
        continue;
      }
      if (consequence === 'injured') {
        member.isInjured = true;
        entries.push(`🩸 ${member.name} è rimasto ferito.`);
      }
      member.survivalCount += 1;
      member.survivalScore += Math.round(phaseDeathRisk * 100);
      if (!member.isHero && trialRules) {
        const qualifiesByRisk = phaseDeathRisk >= (trialRules.highRiskThreshold ?? 0.25);
        const threshold = trialRules.heroSurvivalThreshold;
        const qualifiesByCount = typeof threshold === 'number' && member.survivalCount >= threshold;
        if (qualifiesByRisk || qualifiesByCount) {
          member.isHero = true;
          entries.push(`🔥 Prova del Fuoco: ${member.name} è sopravvissuto e viene promosso a EROE!`);
        }
      }
    }

    if (next.status === 'completed') {
      const xpFormula = idleVillageConfig.globalRules?.questXpFormula;
      const baseXpPerLevel = xpFormula && /^\d+$/.test(xpFormula.trim()) ? Number.parseInt(xpFormula.trim(), 10) : 10;
      const level = typeof activity?.level === 'number' ? activity.level : 1;
      const xpAwarded = Math.round(baseXpPerLevel * level * (power?.rewardMultiplier ?? 1));
      xpAwardedRef.current = xpAwarded;
      entries.push(`Quest "${blueprint.name}" COMPLETATA! +${xpAwarded} XP`);
      const rewards = activity?.rewards ?? blueprint.rewards?.resources ?? [];
      if (Array.isArray(rewards) && rewards.length > 0) {
        entries.push(
          `Ricompense: ${rewards.map((r: { resourceId: string; amountFormula?: string }) => `${r.resourceId} ×${r.amountFormula ?? '?'}`).join(', ')}`,
        );
      }
    }
    if (next.status === 'failed') entries.push(`Quest "${blueprint.name}" FALLITA.`);
    setLog((l) => [...l, ...entries]);
  }, [blueprint, resolvePhaseOutcome, idleVillageConfig, activity]);

  const chronicle = useMemo(
    () => buildQuestChroniclePhases({ blueprint, questState }),
    [blueprint, questState],
  );

  const activePhase = blueprint.phases[chronicle.activeIndex];
  const activePhaseProgress = activePhase ? ticksInPhase / Math.max(1, activePhase.durationValue) : 0;

  // Quest is done (completed/failed) — show bar at 100% for a beat before the splash.
  const [showOutcome, setShowOutcome] = useState(false);
  const questDone = questState?.status === 'completed' || questState?.status === 'failed';
  useEffect(() => {
    if (!questDone) { setShowOutcome(false); return; }
    const timer = setTimeout(() => setShowOutcome(true), 600);
    return () => clearTimeout(timer);
  }, [questDone]);

  const chronicleOutcome = questState && showOutcome
    ? buildChronicleOutcome(questState, lastOutcome, xpAwardedRef.current)
    : undefined;

  return (
    <SkinSystemProvider>
    <SandboxTimingProvider>
    <div data-testid="minimal-quest-detail-page" className="min-h-screen bg-slate-950 p-6 text-ivory">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · Quest Detail</p>
            <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">QUEST CHRONICLE TEST</h1>
            <p className="mt-1 text-sm text-slate-400">
              Blueprint: {blueprint.name} — {blueprint.phases.length} fasi
            </p>
          </div>
          <div className="flex gap-2">
            {!isRunning && (
              <button
                onClick={handleStart}
                className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-emerald-100 hover:bg-emerald-500/20"
              >
                Inizia Quest
              </button>
            )}
            <button
              onClick={handleReset}
              className="rounded-full border border-slate-500/60 bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-slate-200 hover:bg-slate-800/40"
            >
              Reset
            </button>
          </div>
        </header>

        {/* Quest Chronicle — existing cinematic component */}
        <QuestChronicle
          title={blueprint.name}
          summary={blueprint.narrative}
          phases={chronicle.phases}
          currentPhaseIndex={chronicle.activeIndex}
          activePhaseProgress={activePhaseProgress}
          outcome={chronicleOutcome}
          questDone={questDone}
        />

        {/* Skill Check V6 Asterism overlay */}
        {skillCheckActive && activePhase && (
          <div className="rounded-3xl border border-amber-400/30 bg-black/60 p-4">
            <p className="mb-2 text-center text-[9px] uppercase tracking-[0.4em] text-amber-200/60">
              Prova di Abilità — {activePhase.title}
            </p>
            <AltVisualsV6Asterism
              key={skillCheckKey}
              stats={FAKE_STATS}
              enablePerfectStarToggle={false}
              onOutcome={handleV6Outcome}
            />
          </div>
        )}

        {/* Quest outcome summary: resources, injured PGs, etc. */}
        {questDone && showOutcome && (
          <div className={`rounded-3xl border p-5 ${questState?.status === 'completed' ? 'border-emerald-400/40 bg-emerald-500/5' : 'border-rose-400/40 bg-rose-500/5'}`}>
            <h3 className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-3">
              {questState?.status === 'completed' ? 'Ricompense & Aggiornamenti' : 'Conseguenze'}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {questState?.status === 'completed' && (
                <>
                  <div className="rounded-2xl border border-emerald-800/60 bg-black/30 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-emerald-400/60">XP Guadagnati</p>
                    <p className="text-lg font-mono text-emerald-200">+{xpAwardedRef.current}</p>
                  </div>
                  {(activity?.rewards ?? blueprint.rewards?.resources ?? []).map((r: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-amber-800/60 bg-black/30 px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.3em] text-amber-400/60">{r.resourceId}</p>
                      <p className="text-lg font-mono text-amber-200">+{r.amountFormula ?? '?'}</p>
                    </div>
                  ))}
                </>
              )}
              {partyRef.current.filter(m => m.isInjured).map(m => (
                <div key={m.id} className="rounded-2xl border border-amber-800/60 bg-black/30 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-amber-400/60">Ferito</p>
                  <p className="text-sm text-amber-200">{m.name}</p>
                </div>
              ))}
              {partyRef.current.filter(m => m.dead).map(m => (
                <div key={m.id} className="rounded-2xl border border-rose-800/60 bg-black/30 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-rose-400/60">Morto</p>
                  <p className="text-sm text-rose-200">{m.name}</p>
                </div>
              ))}
              {partyRef.current.filter(m => m.isHero && !FAKE_PARTY.find(f => f.id === m.id)?.isHero).map(m => (
                <div key={m.id} className="rounded-2xl border border-fuchsia-800/60 bg-black/30 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-fuchsia-400/60">Promosso Eroe</p>
                  <p className="text-sm text-fuchsia-200">{m.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Log */}
        <div className="rounded-3xl border border-slate-800/60 bg-black/40 p-4">
          <h3 className="text-xs uppercase tracking-[0.35em] text-slate-400">Event Log ({log.length})</h3>
          <div className="mt-3 max-h-[260px] space-y-1 overflow-y-auto font-mono text-xs">
            {log.length === 0 && <div className="italic text-slate-600">Premi "Inizia Quest" per avviare la simulazione.</div>}
            {log.map((entry, i) => {
              const isDanger = entry.includes('Critico') || entry.includes('FALLITA') || entry.includes('MORTO');
              const isWarn = entry.includes('Fallimento') || entry.includes('Quasi') || entry.includes('ferito');
              const isGood = entry.includes('Win') || entry.includes('COMPLETATA') || entry.includes('EROE') || entry.includes('Ricompense');
              return (
                <div key={i} className={isDanger ? 'text-rose-300' : isWarn ? 'text-amber-300' : isGood ? 'text-emerald-300' : 'text-slate-400'}>
                  {entry}
                </div>
              );
            })}
          </div>
        </div>

        {/* Blueprint info */}
        <div className="space-y-1 rounded-3xl border border-slate-800/60 bg-black/40 p-4 font-mono text-xs text-slate-500">
          <div>Blueprint: {blueprint.id} · Difficulty: {blueprint.difficulty}</div>
          <div>Phases: {blueprint.phases.map(p => `${p.id} (${p.type}, ${p.durationValue} ${p.durationUnits})`).join(' → ')}</div>
          <div>Rewards: {JSON.stringify(blueprint.rewards?.resources)}</div>
        </div>
      </div>
    </div>
    </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}

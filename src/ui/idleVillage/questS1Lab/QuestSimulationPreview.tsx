/**
 * QuestSimulationPreview — Monte Carlo X-ray of the whole quest (R-082).
 *
 * The designer's counterfactual bench: every member row exposes what-if
 * edits (exclude, make leader, wound, stat ±10); every change rebuilds a
 * hypothetical state, re-seeds via FNV-1a hash of the sim inputs and re-runs
 * `simulateQuest` on the real engine — so adding a villager, swapping the
 * leader or weakening the party shows up immediately in the forecast.
 *
 * Deterministic: same inputs → same seed → same numbers, no flicker.
 * Consumables are ignored by the total sim (Director 2026-10-04): they live
 * in the per-check commitment surface instead.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestRunState, RuntimeMember } from './questRun';
import {
  CHECKPOINT_OPTIONS,
  choiceNodesFor,
  defaultStrategy,
  hashSimInput,
  questWhy,
  simulateQuest,
} from './questSimulation';
import type { QuestSimResult, SimStrategy } from './questSimulation';
import type { LabStat } from './questScenario';

const LAB_STATS: LabStat[] = ['str', 'con', 'agi', 'perc', 'int', 'cha'];
const STAT_LABEL: Record<LabStat, string> = {
  str: 'FOR',
  con: 'COS',
  agi: 'AGI',
  perc: 'PER',
  int: 'INT',
  cha: 'CAR',
};

interface MemberEdit {
  out?: boolean;
  wounded?: boolean;
  statDelta?: Partial<Record<LabStat, number>>;
}

const pct = (n: number) => `${Math.round(n * 10) / 10}`;

/** Apply the what-if edits to a shallow state copy — the sim clones
 *  internally, so this is only read by the forecast, never mutated. */
function editedParty(
  run: QuestRunState,
  edits: Record<string, MemberEdit>,
  leaderId: string | null,
): RuntimeMember[] {
  return run.party
    .filter((m) => !edits[m.id]?.out)
    .map((m) => {
      const e = edits[m.id];
      const stats = { ...m.stats };
      if (e?.statDelta) {
        for (const s of LAB_STATS) {
          stats[s] = Math.max(0, stats[s] + (e.statDelta[s] ?? 0));
        }
      }
      return {
        ...m,
        stats,
        wounded: e?.wounded ?? m.wounded,
        role: leaderId ? (m.id === leaderId ? 'leader' : m.role === 'leader' ? 'member' : m.role) : m.role,
      };
    });
}

/** Stacked outcome bar — reward / survived / fled / wipe. */
const OutcomeBar: React.FC<{ r: QuestSimResult }> = ({ r }) => {
  const { t } = useTranslation('idleVillage');
  const segs = [
    { key: 'reward', v: r.outcomePct.reward, cls: 'bg-emerald-500' },
    { key: 'survived', v: r.outcomePct.survived, cls: 'bg-amber-400' },
    { key: 'fled', v: r.outcomePct.fled, cls: 'bg-sky-500' },
    { key: 'wipe', v: r.outcomePct.wipe, cls: 'bg-red-800' },
  ] as const;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-800">
        {segs.map((s) => (
          <div key={s.key} className={s.cls} style={{ width: `${s.v}%` }} />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        {segs.map((s) =>
          s.v > 0 ? (
            <span key={s.key} className="text-[10px] text-slate-300">
              <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${s.cls}`} />
              {t(`questS1Lab.sim.outcome.${s.key}`)} {pct(s.v)}%
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
};

/** One member row: stacked healthy/wounded/dead bar + what-if controls. */
const MemberRow: React.FC<{
  run: QuestRunState;
  memberId: string;
  edit: MemberEdit;
  isLeader: boolean;
  sim?: { healthyPct: number; woundPct: number; deathPct: number; downtimeDays: number };
  onEdit: (id: string, patch: MemberEdit) => void;
  onLeader: (id: string) => void;
}> = ({ run, memberId, edit, isLeader, sim, onEdit, onLeader }) => {
  const { t } = useTranslation('idleVillage');
  const base = run.party.find((m) => m.id === memberId);
  if (!base) return null;
  const role = isLeader ? 'leader' : base.role === 'leader' ? 'member' : base.role;
  return (
    <div className={`rounded-lg border px-2 py-1 ${edit.out ? 'border-slate-700/50 opacity-40' : 'border-slate-700'}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(memberId, { out: !edit.out })}
          title={t('questS1Lab.sim.toggleIn')}
          className={`h-3.5 w-3.5 rounded-sm border text-[8px] leading-none ${
            edit.out ? 'border-slate-600 bg-transparent text-transparent' : 'border-emerald-400 bg-emerald-500/40 text-emerald-200'
          }`}
        >
          ✓
        </button>
        <span className="w-24 truncate text-[11px] font-semibold text-slate-200">{base.name}</span>
        <button
          type="button"
          onClick={() => onLeader(memberId)}
          title={t('questS1Lab.sim.makeLeader')}
          className={`text-[9px] uppercase tracking-wider ${role === 'leader' ? 'text-amber-300' : 'text-slate-500 hover:text-amber-200'}`}
        >
          {t(`questS1Lab.role.${role}`)}
        </button>
        <button
          type="button"
          onClick={() => onEdit(memberId, { wounded: !(edit.wounded ?? base.wounded) })}
          className={`text-[9px] uppercase tracking-wider ${
            (edit.wounded ?? base.wounded) ? 'text-red-300' : 'text-slate-500 hover:text-red-200'
          }`}
        >
          {(edit.wounded ?? base.wounded) ? t('questS1Lab.sim.woundedOn') : t('questS1Lab.sim.woundTest')}
        </button>
      </div>
      {!edit.out && (
        <>
          <div className="mt-1 flex items-center gap-1">
            {LAB_STATS.map((s) => (
              <span key={s} className="flex items-center gap-0.5 font-mono text-[9px] text-slate-400">
                <span className="text-slate-500">{STAT_LABEL[s]}</span>
                <button type="button" className="rounded px-0.5 text-slate-500 hover:bg-slate-700 hover:text-slate-200"
                  onClick={() =>
                    onEdit(memberId, {
                      statDelta: { ...edit.statDelta, [s]: (edit.statDelta?.[s] ?? 0) - 10 },
                    })
                  }>
                  −
                </button>
                <span className={edit.statDelta?.[s] ? 'text-sky-300' : ''}>
                  {base.stats[s] + (edit.statDelta?.[s] ?? 0)}
                </span>
                <button type="button" className="rounded px-0.5 text-slate-500 hover:bg-slate-700 hover:text-slate-200"
                  onClick={() =>
                    onEdit(memberId, {
                      statDelta: { ...edit.statDelta, [s]: (edit.statDelta?.[s] ?? 0) + 10 },
                    })
                  }>
                  +
                </button>
              </span>
            ))}
          </div>
          {sim && (
            <div className="mt-1">
              <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="bg-emerald-500" style={{ width: `${sim.healthyPct}%` }} />
                <div className="bg-amber-500" style={{ width: `${sim.woundPct}%` }} />
                <div className="bg-red-700" style={{ width: `${sim.deathPct}%` }} />
              </div>
              <div className="mt-0.5 flex gap-2 font-mono text-[9px]">
                <span className="text-emerald-300">{t('questS1Lab.sim.healthy')} {pct(sim.healthyPct)}%</span>
                <span className="text-amber-300">{t('questS1Lab.sim.wounded')} {pct(sim.woundPct)}%</span>
                <span className="text-red-300">{t('questS1Lab.sim.dead')} {pct(sim.deathPct)}%</span>
                {sim.downtimeDays > 0.2 && (
                  <span className="text-slate-400">{t('questS1Lab.sim.downtime', { days: pct(sim.downtimeDays) })}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export interface QuestSimulationPreviewProps {
  run: QuestRunState;
  /** Simulations per forecast — default 10.000 (spec §4). */
  runs?: number;
}

/**
 * The quest X-ray. Recomputes only when meaningful sim inputs change:
 * party edits, leader, strategy, quest state — each produces a new
 * deterministic seed.
 */
export const QuestSimulationPreview: React.FC<QuestSimulationPreviewProps> = ({ run, runs = 10000 }) => {
  const { t } = useTranslation('idleVillage');
  const [open, setOpen] = useState(false);
  const [edits, setEdits] = useState<Record<string, MemberEdit>>({});
  const [leaderId, setLeaderId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<SimStrategy>(() => defaultStrategy(run));

  // Reset what-if edits and strategy when a different quest/run starts.
  useEffect(() => {
    setEdits({});
    setLeaderId(null);
    setStrategy(defaultStrategy(run));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.questId]);

  const onEdit = (id: string, patch: MemberEdit) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  const onLeader = (id: string) => setLeaderId((prev) => (prev === id ? null : id));

  const simState = useMemo<QuestRunState>(
    () => ({ ...run, party: editedParty(run, edits, leaderId) }),
    [run, edits, leaderId],
  );

  const seed = useMemo(
    () =>
      hashSimInput({
        questId: simState.questId,
        nodeId: simState.nodeId,
        info: simState.info,
        flags: simState.flags,
        alarm: simState.alarm,
        gold: simState.gold,
        days: simState.days,
        objectiveDone: simState.objectiveDone,
        party: simState.party.map((m) => ({ id: m.id, role: m.role, stats: m.stats, wounded: m.wounded, dead: m.dead })),
        strategy,
        runs,
      }),
    [simState, strategy, runs],
  );

  const result = useMemo(
    () => (open ? simulateQuest(simState, strategy, { runs, seed }) : null),
    [open, simState, strategy, runs, seed],
  );

  // RETURN vs CONTINUE at the push-your-luck checkpoint (spec §18).
  const checkpoint = CHECKPOINT_OPTIONS[run.questId];
  const compare = useMemo(() => {
    if (!open || !checkpoint || !result) return null;
    const secure = simulateQuest(simState, { ...strategy, [checkpoint.nodeId]: checkpoint.secure }, { runs, seed });
    const push = simulateQuest(simState, { ...strategy, [checkpoint.nodeId]: checkpoint.push }, { runs, seed });
    return { secure, push };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, checkpoint?.nodeId, result]);

  const why = useMemo(() => (open ? questWhy(simState, strategy) : []), [open, simState, strategy]);
  const choices = useMemo(() => choiceNodesFor(run), [run]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-sky-400/30 bg-sky-950/20 px-3 py-2 text-left text-[11px] tracking-wider text-sky-200 transition hover:bg-sky-950/40"
      >
        {t('questS1Lab.sim.open')}
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-sky-400/30 bg-sky-950/20 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.3em] text-sky-300">
          {t('questS1Lab.sim.title')}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-slate-500">
            {t('questS1Lab.sim.runsLabel', { runs: result?.runs ?? runs })}
          </span>
          <button type="button" onClick={() => setOpen(false)} className="text-[10px] text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>
      </div>

      {/* WHY — cause before numbers (v23 design principle) */}
      {why.length > 0 && (
        <div className="space-y-0.5 text-[10px]">
          <div className="text-[9px] uppercase tracking-[0.25em] text-slate-500">
            {t('questS1Lab.sim.whyTitle')}
          </div>
          {why.slice(0, 6).map((w, i) => (
            <div key={i} className={w.tone === 'up' ? 'text-emerald-300/90' : w.tone === 'down' ? 'text-red-300/90' : 'text-slate-400'}>
              {w.tone === 'up' ? '+' : w.tone === 'down' ? '−' : '·'}{' '}
              {t(`questS1Lab.sim.why.${w.key}`, { ...w.params, stat: w.params?.stat ? STAT_LABEL[w.params.stat as LabStat] : undefined })}
            </div>
          ))}
        </div>
      )}

      {result && (
        <>
          <OutcomeBar r={result} />

          {/* Death / wound / leader / time / reward — compact stat grid */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-lg border border-slate-700 px-2 py-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-500">{t('questS1Lab.sim.deathsTitle')}</div>
              <div className="font-mono text-[11px] text-slate-200">
                {t('questS1Lab.sim.deathsDist', {
                  zero: pct(result.zeroDeathsPct),
                  one: pct(result.anyDeathPct - result.twoPlusDeathsPct),
                  twoPlus: pct(result.twoPlusDeathsPct),
                })}
              </div>
              <div className="font-mono text-[9px] text-slate-500">
                {t('questS1Lab.sim.avgDeathsOnReward', { n: pct(result.avgDeathsOnReward) })}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 px-2 py-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-500">{t('questS1Lab.sim.woundsTitle')}</div>
              <div className="font-mono text-[11px] text-amber-200">
                ≥1: {pct(result.anyWoundPct)}% · x̄ {pct(result.avgWounded)}
              </div>
              <div className="font-mono text-[9px] text-slate-500">
                {t('questS1Lab.sim.downtime', { days: pct(result.woundedDowntimeAvg) })}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 px-2 py-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-500">{t('questS1Lab.sim.leaderTitle')}</div>
              <div className="font-mono text-[11px] text-amber-200">
                {t('questS1Lab.sim.leaderLine', {
                  wound: pct(result.leaderWoundPct),
                  death: pct(result.leaderDeathPct),
                })}
              </div>
              <div className="font-mono text-[9px] text-slate-500">
                {t('questS1Lab.sim.downtime', { days: pct(result.leaderDowntimeDays) })}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 px-2 py-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-500">{t('questS1Lab.sim.timeTitle')}</div>
              <div className="font-mono text-[11px] text-sky-200">
                {t('questS1Lab.sim.daysLine', {
                  avg: pct(result.daysAvg),
                  min: result.daysMin,
                  max: result.daysMax,
                })}
              </div>
              <div className="font-mono text-[9px] text-slate-500">
                {t('questS1Lab.sim.humanDays', {
                  hd: pct(result.humanDaysAvg),
                  p50: result.daysP50,
                  p90: result.daysP90,
                })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 px-2 py-1">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">{t('questS1Lab.sim.rewardTitle')}</div>
            <div className="font-mono text-[11px] text-yellow-200">
              {t('questS1Lab.sim.rewardLine', {
                gold: Math.round(result.goldAvg),
                treasure: Math.round(result.treasureAvg),
                loot: pct(result.lootAvgCount),
              })}
            </div>
            <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[9px] text-slate-400">
              {result.optionalPct.relic > 0 && <span>{t('questS1Lab.sim.opt.relic')} {pct(result.optionalPct.relic)}%</span>}
              {result.optionalPct.guardLoot > 0 && <span>{t('questS1Lab.sim.opt.guardLoot')} {pct(result.optionalPct.guardLoot)}%</span>}
              {result.optionalPct.chestLoot > 0 && <span>{t('questS1Lab.sim.opt.chestLoot')} {pct(result.optionalPct.chestLoot)}%</span>}
              {result.optionalPct.viandanteHelped > 0 && <span>{t('questS1Lab.sim.opt.viandante')} {pct(result.optionalPct.viandanteHelped)}%</span>}
            </div>
          </div>

          {/* Simulated strategy — every choice node is declared, nothing is
              invented by an autonomous policy (spec §17). */}
          <div className="rounded-lg border border-slate-700 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              {t('questS1Lab.sim.strategyTitle')}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {choices.map((n) => (
                <label key={n.id} className="flex items-center gap-1 text-[10px] text-slate-300">
                  <span className="text-slate-500">{n.title}:</span>
                  <select
                    value={strategy[n.id] ?? n.options?.[0]?.id}
                    onChange={(e) => setStrategy((s) => ({ ...s, [n.id]: e.target.value }))}
                    className="rounded border border-slate-600 bg-slate-900 px-1 py-0 text-[10px] text-slate-200"
                  >
                    {n.options?.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          {/* Push-your-luck compare: secure the stake vs go deeper (§18). */}
          {checkpoint && compare && (
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'secure', r: compare.secure },
                  { key: 'push', r: compare.push },
                ] as const
              ).map(({ key, r }) => (
                <div key={key} className="rounded-lg border border-slate-700 px-2 py-1">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">
                    {t(`questS1Lab.sim.cp.${key}`)}
                  </div>
                  <div className="font-mono text-[10px] text-slate-300">
                    {t('questS1Lab.sim.cpLine', {
                      reward: pct(r.outcomePct.reward),
                      death: pct(r.anyDeathPct),
                      wound: pct(r.anyWoundPct),
                      days: pct(r.daysAvg),
                      treasure: Math.round(r.treasureAvg),
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* What-if party bench — edits are hypothetical, they never touch the run */}
      <div>
        <div className="mb-1 text-[9px] uppercase tracking-[0.25em] text-slate-500">
          {t('questS1Lab.sim.benchTitle')}
        </div>
        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
          {run.party.map((m) => (
            <MemberRow
              key={m.id}
              run={run}
              memberId={m.id}
              edit={edits[m.id] ?? {}}
              isLeader={(leaderId ?? run.party.find((x) => x.role === 'leader')?.id) === m.id}
              sim={result?.perMember.find((p) => p.id === m.id)}
              onEdit={onEdit}
              onLeader={onLeader}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestSimulationPreview;

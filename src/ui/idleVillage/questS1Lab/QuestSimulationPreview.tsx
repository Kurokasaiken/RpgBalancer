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
 *
 * Skin contract: canonical primitives only (SkinScope + Materic*).
 * This is a top-level panel → MatericSurface outside, MatericFrame for
 * internal sub-sections (primitive_composition_rules.md §1/§5).
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
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import {
  MatericBadge,
  MatericButton,
  MatericCloseButton,
  MatericField,
  MatericFieldGroup,
  MatericFrame,
  MatericRecordList,
  MatericSectionHeader,
  MatericStatBar,
  MatericSurface,
} from '@/ui/designSystem/primitives';
import type { StatBarVariant } from '@/ui/designSystem/primitives';

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

const OUTCOME_BAR: Record<'reward' | 'survived' | 'fled' | 'wipe', StatBarVariant> = {
  reward: 'hp',
  survived: 'stamina',
  fled: 'stamina',
  wipe: 'fatigue',
};

/** Outcome distribution — one canonical stat bar per outcome. */
const OutcomeBars: React.FC<{ r: QuestSimResult }> = ({ r }) => {
  const { t } = useTranslation('idleVillage');
  const segs = [
    { key: 'reward', v: r.outcomePct.reward },
    { key: 'survived', v: r.outcomePct.survived },
    { key: 'fled', v: r.outcomePct.fled },
    { key: 'wipe', v: r.outcomePct.wipe },
  ] as const;
  return (
    <div className="space-y-1">
      {segs.map((s) =>
        s.v > 0 ? (
          <MatericStatBar
            key={s.key}
            label={`${t(`questS1Lab.sim.outcome.${s.key}`)} — ${pct(s.v)}%`}
            value={s.v}
            maxValue={100}
            variant={OUTCOME_BAR[s.key]}
            size="xs"
            showValue={false}
          />
        ) : null,
      )}
    </div>
  );
};

/** One member row: stacked healthy/wounded/dead bar + what-if controls.
 *  The raw <button>s inherit the struck-bronze skin inside SkinScope. */
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
    <MatericFrame
      variant="molding"
      style={{ padding: 8, opacity: edit.out ? 0.4 : 1 }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(memberId, { out: !edit.out })}
          title={t('questS1Lab.sim.toggleIn')}
          className="!h-4 !w-4 !p-0 text-[8px] leading-none"
        >
          {edit.out ? '' : '✓'}
        </button>
        <span className="w-24 truncate text-[11px] font-semibold text-slate-200">{base.name}</span>
        <button
          type="button"
          onClick={() => onLeader(memberId)}
          title={t('questS1Lab.sim.makeLeader')}
          className={`!p-1 text-[9px] uppercase tracking-wider ${role === 'leader' ? 'text-amber-300' : ''}`}
        >
          {t(`questS1Lab.role.${role}`)}
        </button>
        <button
          type="button"
          onClick={() => onEdit(memberId, { wounded: !(edit.wounded ?? base.wounded) })}
          className={`!p-1 text-[9px] uppercase tracking-wider ${
            (edit.wounded ?? base.wounded) ? 'text-red-300' : ''
          }`}
        >
          {(edit.wounded ?? base.wounded) ? t('questS1Lab.sim.woundedOn') : t('questS1Lab.sim.woundTest')}
        </button>
      </div>
      {!edit.out && (
        <>
          <div className="mt-1 flex items-center gap-1" data-roster-controls="compact">
            {LAB_STATS.map((s) => (
              <span key={s} className="flex items-center gap-0.5 font-mono text-[9px] text-slate-400">
                <span className="text-slate-500">{STAT_LABEL[s]}</span>
                <button type="button"
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
                <button type="button"
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
    </MatericFrame>
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
      <SkinScope>
        <MatericButton variant="secondary" onClick={() => setOpen(true)} className="w-full">
          {t('questS1Lab.sim.open')}
        </MatericButton>
      </SkinScope>
    );
  }

  return (
    <SkinScope>
      <MatericSurface
        shape="panel"
        material="obsidian"
        style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div className="flex items-center justify-between">
          <MatericSectionHeader tier="primary" marginBottom="sm" style={{ marginBottom: 0 }}>
            {t('questS1Lab.sim.title')}
          </MatericSectionHeader>
          <div className="flex items-center gap-2">
            <MatericBadge>{t('questS1Lab.sim.runsLabel', { runs: result?.runs ?? runs })}</MatericBadge>
            <MatericCloseButton onClick={() => setOpen(false)} style={{ width: 22, height: 22 }} aria-label={t('questS1Lab.sim.close')} />
          </div>
        </div>

        {/* WHY — cause before numbers (v23 design principle) */}
        {why.length > 0 && (
          <MatericFrame variant="molding" style={{ padding: 8 }}>
            <MatericSectionHeader tier="tertiary" marginBottom="sm" style={{ fontSize: 9 }}>
              {t('questS1Lab.sim.whyTitle')}
            </MatericSectionHeader>
            <div className="space-y-0.5 text-[10px]">
              {why.slice(0, 6).map((w, i) => (
                <div key={i} className={w.tone === 'up' ? 'text-emerald-300/90' : w.tone === 'down' ? 'text-red-300/90' : 'text-slate-400'}>
                  {w.tone === 'up' ? '+' : w.tone === 'down' ? '−' : '·'}{' '}
                  {t(`questS1Lab.sim.why.${w.key}`, { ...w.params, stat: w.params?.stat ? STAT_LABEL[w.params.stat as LabStat] : undefined })}
                </div>
              ))}
            </div>
          </MatericFrame>
        )}

        {result && (
          <>
            <OutcomeBars r={result} />

            {/* Death / wound / leader / time — canonical field grid */}
            <MatericFieldGroup layout="grid" columns={4} density="compact" separators={false}>
              <MatericField
                tier="tertiary"
                label={t('questS1Lab.sim.deathsTitle')}
                value={t('questS1Lab.sim.deathsDist', {
                  zero: pct(result.zeroDeathsPct),
                  one: pct(result.anyDeathPct - result.twoPlusDeathsPct),
                  twoPlus: pct(result.twoPlusDeathsPct),
                })}
              />
              <MatericField
                tier="tertiary"
                label={t('questS1Lab.sim.woundsTitle')}
                value={`≥1: ${pct(result.anyWoundPct)}% · x̄ ${pct(result.avgWounded)}`}
              />
              <MatericField
                tier="tertiary"
                label={t('questS1Lab.sim.leaderTitle')}
                value={t('questS1Lab.sim.leaderLine', {
                  wound: pct(result.leaderWoundPct),
                  death: pct(result.leaderDeathPct),
                })}
              />
              <MatericField
                tier="tertiary"
                label={t('questS1Lab.sim.timeTitle')}
                value={t('questS1Lab.sim.daysLine', {
                  avg: pct(result.daysAvg),
                  min: result.daysMin,
                  max: result.daysMax,
                })}
              />
            </MatericFieldGroup>
            <div className="flex flex-wrap gap-x-3 font-mono text-[9px] text-slate-500">
              <span>{t('questS1Lab.sim.avgDeathsOnReward', { n: pct(result.avgDeathsOnReward) })}</span>
              <span>{t('questS1Lab.sim.downtime', { days: pct(result.woundedDowntimeAvg) })}</span>
              <span>{t('questS1Lab.sim.downtime', { days: pct(result.leaderDowntimeDays) })}</span>
              <span>{t('questS1Lab.sim.humanDays', { hd: pct(result.humanDaysAvg), p50: result.daysP50, p90: result.daysP90 })}</span>
            </div>

            <MatericFrame variant="molding" style={{ padding: 8 }}>
              <MatericField
                orientation="horizontal"
                tier="tertiary"
                label={t('questS1Lab.sim.rewardTitle')}
                value={t('questS1Lab.sim.rewardLine', {
                  gold: Math.round(result.goldAvg),
                  treasure: Math.round(result.treasureAvg),
                  loot: pct(result.lootAvgCount),
                })}
              />
              <div className="mt-1 flex flex-wrap gap-1.5">
                {result.optionalPct.relic > 0 && <MatericBadge>{t('questS1Lab.sim.opt.relic')} {pct(result.optionalPct.relic)}%</MatericBadge>}
                {result.optionalPct.guardLoot > 0 && <MatericBadge>{t('questS1Lab.sim.opt.guardLoot')} {pct(result.optionalPct.guardLoot)}%</MatericBadge>}
                {result.optionalPct.chestLoot > 0 && <MatericBadge>{t('questS1Lab.sim.opt.chestLoot')} {pct(result.optionalPct.chestLoot)}%</MatericBadge>}
                {result.optionalPct.viandanteHelped > 0 && <MatericBadge>{t('questS1Lab.sim.opt.viandante')} {pct(result.optionalPct.viandanteHelped)}%</MatericBadge>}
              </div>
            </MatericFrame>

            {/* Simulated strategy — every choice node is declared, nothing is
                invented by an autonomous policy (spec §17). */}
            <MatericFrame variant="molding" style={{ padding: 8 }} data-roster-controls="compact">
              <MatericSectionHeader tier="tertiary" marginBottom="sm" style={{ fontSize: 9 }}>
                {t('questS1Lab.sim.strategyTitle')}
              </MatericSectionHeader>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {choices.map((n) => (
                  <label key={n.id} className="flex items-center gap-1 text-[10px] text-slate-300">
                    <span className="text-slate-500">{n.title}:</span>
                    <select
                      value={strategy[n.id] ?? n.options?.[0]?.id}
                      onChange={(e) => setStrategy((s) => ({ ...s, [n.id]: e.target.value }))}
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
            </MatericFrame>

            {/* Push-your-luck compare: secure the stake vs go deeper (§18). */}
            {checkpoint && compare && (
              <MatericFrame variant="molding" style={{ padding: 8 }}>
                <MatericRecordList
                  density="compact"
                  columns={[
                    { width: '1fr', variant: 'label' },
                    { width: '6rem', variant: 'caption', align: 'right' },
                    { width: '6rem', variant: 'value', align: 'right' },
                  ]}
                  records={[
                    ['', t('questS1Lab.sim.cp.secure'), t('questS1Lab.sim.cp.push')],
                    ...(['reward', 'death', 'wound', 'days', 'treasure'] as const).map((k) => [
                      t(`questS1Lab.sim.cpRow.${k}`),
                      k === 'reward'
                        ? `${pct(compare.secure.outcomePct.reward)}%`
                        : k === 'death'
                          ? `${pct(compare.secure.anyDeathPct)}%`
                          : k === 'wound'
                            ? `${pct(compare.secure.anyWoundPct)}%`
                            : k === 'days'
                              ? pct(compare.secure.daysAvg)
                              : Math.round(compare.secure.treasureAvg),
                      k === 'reward'
                        ? `${pct(compare.push.outcomePct.reward)}%`
                        : k === 'death'
                          ? `${pct(compare.push.anyDeathPct)}%`
                          : k === 'wound'
                            ? `${pct(compare.push.anyWoundPct)}%`
                            : k === 'days'
                              ? pct(compare.push.daysAvg)
                              : Math.round(compare.push.treasureAvg),
                    ]),
                  ]}
                />
              </MatericFrame>
            )}
          </>
        )}

        {/* What-if party bench — edits are hypothetical, they never touch the run */}
        <div>
          <MatericSectionHeader tier="tertiary" marginBottom="sm" style={{ fontSize: 9 }}>
            {t('questS1Lab.sim.benchTitle')}
          </MatericSectionHeader>
          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2" data-roster-controls="compact">
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
      </MatericSurface>
    </SkinScope>
  );
};

export default QuestSimulationPreview;

/**
 * QuestCheckPreview — exact pre-check forecast for the S1 lab (R-082).
 *
 * Shown inside the commit surface before the player resolves a check.
 * Numbers are ANALYTIC (closed form of the engine's own band math via
 * `analyzeCheck`), so they match the resolver exactly — no Monte Carlo
 * noise on a surface where the exact answer exists (Director 2026-10-04).
 *
 * The consumable counterfactual (USE vs DON'T USE) is computed by running
 * the same analysis twice with the commit flag flipped — the preview is a
 * hypothetical: nothing is consumed until the player commits.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { nodesFor } from './questRun';
import type { QuestRunState, Verdict } from './questRun';
import { analyzeCheck } from './questSimulation';
import type { CheckAnalysis } from './questSimulation';
import type { QuestNode } from './questScenario';

const VERDICT_ORDER: Verdict[] = ['bigwin', 'win', 'almost', 'fail', 'epicfail'];

const VERDICT_STYLE: Record<Verdict, { bar: string; text: string }> = {
  bigwin: { bar: 'bg-emerald-400', text: 'text-emerald-300' },
  win: { bar: 'bg-emerald-600', text: 'text-emerald-200' },
  almost: { bar: 'bg-amber-400', text: 'text-amber-300' },
  fail: { bar: 'bg-red-600', text: 'text-red-300' },
  epicfail: { bar: 'bg-red-900', text: 'text-red-400' },
};

const pct = (n: number) => `${Math.round(n * 10) / 10}`;

const WhyLine: React.FC<{ tone: 'up' | 'down'; children: React.ReactNode }> = ({ tone, children }) => (
  <div className={tone === 'up' ? 'text-emerald-300/90' : 'text-red-300/90'}>
    {tone === 'up' ? '+' : '−'} {children}
  </div>
);

/** The five-verdict distribution as labeled bars. */
const VerdictBars: React.FC<{ analysis: CheckAnalysis }> = ({ analysis }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div className="space-y-0.5">
      {VERDICT_ORDER.map((v) => {
        const p = analysis.verdicts[v] * 100;
        if (p <= 0) return null;
        return (
          <div key={v} className="flex items-center gap-2">
            <span className={`w-20 text-[9px] uppercase tracking-wider ${VERDICT_STYLE[v].text}`}>
              {t(`questS1Lab.verdict.${v}`)}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
              <span className={`block h-full ${VERDICT_STYLE[v].bar}`} style={{ width: `${p}%` }} />
            </span>
            <span className={`w-10 text-right font-mono text-[10px] ${VERDICT_STYLE[v].text}`}>
              {pct(p)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** Aggregate harm consequences of the check. */
const ConsequenceRow: React.FC<{ a: CheckAnalysis }> = ({ a }) => {
  const { t } = useTranslation('idleVillage');
  const rows: { key: string; value: number; cls: string }[] = [
    { key: 'noHarm', value: a.noHarmPct, cls: 'text-slate-300' },
    { key: 'anyWound', value: a.anyWoundPct, cls: 'text-amber-300' },
    { key: 'anyDeath', value: a.anyDeathPct, cls: 'text-red-300' },
    { key: 'leaderWound', value: a.leaderWoundPct, cls: 'text-amber-200' },
    { key: 'leaderDeath', value: a.leaderDeathPct, cls: 'text-red-400' },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
      {rows.map((r) => (
        <div key={r.key} className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            {t(`questS1Lab.sim.consequence.${r.key}`)}
          </span>
          <span className={`font-mono text-[11px] ${r.cls}`}>{pct(r.value)}%</span>
        </div>
      ))}
    </div>
  );
};

/** Side-by-side WITHOUT / WITH consumable with signed deltas. */
const Counterfactual: React.FC<{ without: CheckAnalysis; with_: CheckAnalysis }> = ({
  without,
  with_,
}) => {
  const { t } = useTranslation('idleVillage');
  const rows: { key: string; a: number; b: number }[] = [
    { key: 'success', a: without.successPct, b: with_.successPct },
    { key: 'anyWound', a: without.anyWoundPct, b: with_.anyWoundPct },
    { key: 'anyDeath', a: without.anyDeathPct, b: with_.anyDeathPct },
  ];
  return (
    <div className="rounded-lg border border-teal-400/30 bg-teal-950/20 px-2.5 py-1.5">
      <div className="mb-1 grid grid-cols-[1fr_2.2rem_2.2rem_2.6rem] items-baseline gap-1 text-[9px] uppercase tracking-wider text-slate-500">
        <span>{with_.consumable?.label}</span>
        <span className="text-right">{t('questS1Lab.sim.without')}</span>
        <span className="text-right">{t('questS1Lab.sim.withC')}</span>
        <span className="text-right">Δ</span>
      </div>
      {rows.map((r) => {
        const delta = r.b - r.a;
        const good = r.key === 'success' ? delta > 0 : delta < 0;
        return (
          <div key={r.key} className="grid grid-cols-[1fr_2.2rem_2.2rem_2.6rem] items-baseline gap-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              {t(`questS1Lab.sim.cf.${r.key}`)}
            </span>
            <span className="text-right font-mono text-[10px] text-slate-300">{pct(r.a)}%</span>
            <span className="text-right font-mono text-[10px] text-teal-200">{pct(r.b)}%</span>
            <span
              className={`text-right font-mono text-[10px] ${delta === 0 ? 'text-slate-600' : good ? 'text-emerald-300' : 'text-red-300'}`}
            >
              {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${pct(delta)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export interface QuestCheckPreviewProps {
  run: QuestRunState;
  /** The choice option whose `CHECK:<id>` target is being previewed. */
  optionId: string;
  /** Commit state of the consumable toggle (hypothetical — not consumed). */
  useConsumable: boolean;
}

/**
 * Pre-check forecast for one option. Renders WHY (who carries the roll,
 * which bonuses apply), the verdict distribution, consequences, the
 * consumable counterfactual and per-member exposure.
 */
export const QuestCheckPreview: React.FC<QuestCheckPreviewProps> = ({
  run,
  optionId,
  useConsumable,
}) => {
  const { t } = useTranslation('idleVillage');
  const node: QuestNode | undefined = nodesFor(run)[run.nodeId];
  const option = node?.options?.find((o) => o.id === optionId);
  const checkNode =
    option?.next.startsWith('CHECK:') ? nodesFor(run)[option.next.slice(6)] : undefined;

  const analysis = useMemo(
    () =>
      checkNode
        ? analyzeCheck(run, checkNode, { useConsumable })
        : null,
    [run, checkNode, useConsumable],
  );
  const counterfactual = useMemo(
    () =>
      checkNode && analysis?.consumable
        ? analyzeCheck(run, checkNode, { useConsumable: !analysis.consumableApplied })
        : null,
    [run, checkNode, analysis],
  );

  if (!analysis) return null;

  return (
    <div className="space-y-2 rounded-xl border border-sky-400/30 bg-sky-950/20 p-3">
      {/* WHY — cause before numbers: who carries the roll and what bends it */}
      <div className="space-y-0.5 text-[10px]">
        <div className="text-[9px] uppercase tracking-[0.25em] text-slate-500">
          {t('questS1Lab.sim.whyTitle')}
        </div>
        {analysis.contributors.map((c) => (
          <WhyLine key={c.stat} tone={c.bestValue >= 60 ? 'up' : 'down'}>
            {t('questS1Lab.sim.whyCarrier', {
              name: c.bestName,
              stat: analysis.statLabels[c.stat],
              value: c.bestValue,
            })}
          </WhyLine>
        ))}
        {analysis.intel && (
          <WhyLine tone="up">{t('questS1Lab.sim.whyIntel', { label: analysis.intel.label, bonus: analysis.intel.bonus })}</WhyLine>
        )}
        {analysis.consumableApplied && analysis.consumable && (
          <WhyLine tone="up">{t('questS1Lab.sim.whyConsumable', { label: analysis.consumable.label, bonus: analysis.consumable.bonus })}</WhyLine>
        )}
        {analysis.alarm && <WhyLine tone="down">{t('questS1Lab.sim.whyAlarm')}</WhyLine>}
        {analysis.perMember.some((m) => m.alreadyWounded) && (
          <WhyLine tone="down">
            {t('questS1Lab.sim.whyWounded', {
              names: analysis.perMember.filter((m) => m.alreadyWounded).map((m) => m.name).join(', '),
            })}
          </WhyLine>
        )}
        {analysis.interceptorName && (
          <WhyLine tone="up">{t('questS1Lab.sim.whyCover', { name: analysis.interceptorName })}</WhyLine>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
          {analysis.checkTitle}
        </span>
        <span className="font-mono text-[11px] text-sky-200">
          {analysis.stats.map((s) => analysis.statLabels[s]).join(' + ')} · {t('questS1Lab.sim.bound', { value: Math.round(analysis.successBound) })}
        </span>
      </div>

      <VerdictBars analysis={analysis} />

      {analysis.failHint && (
        <div className="rounded-md border border-red-400/30 bg-red-950/20 px-2 py-0.5 text-[10px] text-red-300/90">
          {t('questS1Lab.onFail', { text: analysis.failHint })}
        </div>
      )}

      <ConsequenceRow a={analysis} />

      {counterfactual && analysis.consumable && (
        <Counterfactual
          without={analysis.consumableApplied ? counterfactual : analysis}
          with_={analysis.consumableApplied ? analysis : counterfactual}
        />
      )}

      {/* Per-member final state — who is actually exposed on this check */}
      <div className="flex flex-wrap gap-1.5">
        {analysis.perMember.map((m) => (
          <span
            key={m.id}
            className={[
              'rounded-md border px-2 py-0.5 text-[10px] tracking-wider',
              m.role === 'bodyguard'
                ? 'border-purple-400/50 bg-purple-950/40 text-purple-200'
                : m.alreadyWounded
                  ? 'border-red-400/50 bg-red-950/40 text-red-300'
                  : 'border-slate-500/40 bg-slate-900/50 text-slate-300',
            ].join(' ')}
          >
            {m.role === 'bodyguard' && '🛡 '}
            {t('questS1Lab.sim.memberOdds', {
              name: m.name,
              wound: Math.round(m.woundPct),
              death: Math.round(m.deathPct),
            })}
          </span>
        ))}
      </div>
    </div>
  );
};

export default QuestCheckPreview;

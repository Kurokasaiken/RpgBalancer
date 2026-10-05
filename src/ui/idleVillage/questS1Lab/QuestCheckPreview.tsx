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
 *
 * Skin contract: canonical primitives only (SkinScope + Materic*).
 * This panel lives INSIDE an option card, so the outer container is a
 * MatericFrame (frame-only), never a MatericSurface — see
 * primitive_composition_rules.md.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { nodesFor } from './questRun';
import type { QuestRunState, Verdict } from './questRun';
import { analyzeCheck } from './questSimulation';
import type { CheckAnalysis } from './questSimulation';
import type { QuestNode } from './questScenario';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import {
  MatericBadge,
  MatericField,
  MatericFieldGroup,
  MatericFrame,
  MatericRecordList,
  MatericSectionHeader,
  MatericStatBar,
} from '@/ui/designSystem/primitives';
import type { StatBarVariant } from '@/ui/designSystem/primitives';

const VERDICT_ORDER: Verdict[] = ['bigwin', 'win', 'almost', 'fail', 'epicfail'];

const VERDICT_BAR: Record<Verdict, StatBarVariant> = {
  bigwin: 'hp',
  win: 'hp',
  almost: 'stamina',
  fail: 'fatigue',
  epicfail: 'fatigue',
};

const pct = (n: number) => `${Math.round(n * 10) / 10}`;

const WhyLine: React.FC<{ tone: 'up' | 'down'; children: React.ReactNode }> = ({ tone, children }) => (
  <div className={tone === 'up' ? 'text-emerald-300/90' : 'text-red-300/90'}>
    {tone === 'up' ? '+' : '−'} {children}
  </div>
);

/** The five-verdict distribution as canonical stat bars. */
const VerdictBars: React.FC<{ analysis: CheckAnalysis }> = ({ analysis }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div className="space-y-1">
      {VERDICT_ORDER.map((v) => {
        const p = analysis.verdicts[v] * 100;
        if (p <= 0) return null;
        return (
          <MatericStatBar
            key={v}
            label={`${t(`questS1Lab.verdict.${v}`)} — ${pct(p)}%`}
            value={p}
            maxValue={100}
            variant={VERDICT_BAR[v]}
            size="xs"
            showValue={false}
          />
        );
      })}
    </div>
  );
};

/** Aggregate harm consequences of the check. */
const ConsequenceRow: React.FC<{ a: CheckAnalysis }> = ({ a }) => {
  const { t } = useTranslation('idleVillage');
  const rows: { key: string; value: number }[] = [
    { key: 'noHarm', value: a.noHarmPct },
    { key: 'anyWound', value: a.anyWoundPct },
    { key: 'anyDeath', value: a.anyDeathPct },
    { key: 'leaderWound', value: a.leaderWoundPct },
    { key: 'leaderDeath', value: a.leaderDeathPct },
  ];
  return (
    <MatericFieldGroup layout="grid" columns={2} density="compact" separators={false}>
      {rows.map((r) => (
        <MatericField
          key={r.key}
          orientation="horizontal"
          tier="tertiary"
          label={t(`questS1Lab.sim.consequence.${r.key}`)}
          value={`${pct(r.value)}%`}
        />
      ))}
    </MatericFieldGroup>
  );
};

/** Side-by-side WITHOUT / WITH consumable with signed deltas. */
const Counterfactual: React.FC<{ without: CheckAnalysis; withC: CheckAnalysis }> = ({
  without,
  withC,
}) => {
  const { t } = useTranslation('idleVillage');
  const rows: { key: string; a: number; b: number }[] = [
    { key: 'success', a: without.successPct, b: withC.successPct },
    { key: 'anyWound', a: without.anyWoundPct, b: withC.anyWoundPct },
    { key: 'anyDeath', a: without.anyDeathPct, b: withC.anyDeathPct },
  ];
  return (
    <MatericFrame variant="molding" style={{ padding: 8 }}>
      <MatericSectionHeader tier="tertiary" marginBottom="sm" style={{ fontSize: 9 }}>
        {withC.consumable?.label}
      </MatericSectionHeader>
      <MatericRecordList
        density="compact"
        columns={[
          { width: '1fr', variant: 'label' },
          { width: '2.6rem', variant: 'caption', align: 'right' },
          { width: '2.6rem', variant: 'value', align: 'right' },
          { width: '2.8rem', variant: 'caption', align: 'right' },
        ]}
        records={[
          ['', t('questS1Lab.sim.without'), t('questS1Lab.sim.withC'), 'Δ'],
          ...rows.map((r) => {
            const delta = r.b - r.a;
            const good = r.key === 'success' ? delta > 0 : delta < 0;
            return [
              t(`questS1Lab.sim.cf.${r.key}`),
              `${pct(r.a)}%`,
              `${pct(r.b)}%`,
              <span
                key={r.key}
                className={delta === 0 ? 'text-slate-600' : good ? 'text-emerald-300' : 'text-red-300'}
              >
                {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${pct(delta)}`}
              </span>,
            ];
          }),
        ]}
      />
    </MatericFrame>
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
    <SkinScope>
      <MatericFrame variant="molding" style={{ padding: 10 }} className="space-y-2">
        {/* WHY — cause before numbers: who carries the roll and what bends it */}
        <div className="space-y-0.5 text-[10px]">
          <MatericSectionHeader tier="tertiary" marginBottom="sm" style={{ fontSize: 9 }}>
            {t('questS1Lab.sim.whyTitle')}
          </MatericSectionHeader>
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

        <MatericField
          orientation="horizontal"
          tier="tertiary"
          label={analysis.checkTitle}
          value={`${analysis.stats.map((s) => analysis.statLabels[s]).join(' + ')} · ${t('questS1Lab.sim.bound', { value: Math.round(analysis.successBound) })}`}
        />

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
            withC={analysis.consumableApplied ? analysis : counterfactual}
          />
        )}

        {/* Per-member final state — who is actually exposed on this check */}
        <div className="flex flex-wrap gap-1.5">
          {analysis.perMember.map((m) => (
            <MatericBadge
              key={m.id}
              style={
                m.role === 'bodyguard'
                  ? { borderColor: 'rgba(192,132,252,0.5)', color: '#d8b4fe' }
                  : m.alreadyWounded
                    ? { borderColor: 'rgba(248,113,113,0.5)', color: '#fca5a5' }
                    : undefined
              }
            >
              {m.role === 'bodyguard' && '🛡 '}
              {t('questS1Lab.sim.memberOdds', {
                name: m.name,
                wound: Math.round(m.woundPct),
                death: Math.round(m.deathPct),
              })}
            </MatericBadge>
          ))}
        </div>
      </MatericFrame>
    </SkinScope>
  );
};

export default QuestCheckPreview;

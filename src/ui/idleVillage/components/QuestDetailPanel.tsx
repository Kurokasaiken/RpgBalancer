import React from 'react';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import { Tooltip } from '@/ui/components/Tooltip';
import { getQuestIndicators, formatSeconds } from '@/ui/idleVillage/questIndicators';

export interface QuestDetailPanelProps {
  summary: VerbSummary | null;
  activity?: ActivityDefinition;
  config?: IdleVillageConfig | null;
}

const RiskStripe: React.FC<{ injuryPct: number; deathPct: number }> = ({ injuryPct, deathPct }) => {
  const cappedDeath = Math.min(100, Math.max(0, deathPct));
  const cappedInjury = Math.min(100, Math.max(0, injuryPct));
  const injuryOnly = Math.max(0, cappedInjury - cappedDeath);

  return (
    <div className="relative flex h-20 w-3 flex-col overflow-hidden rounded-full border border-slate-800 bg-slate-950/70 shadow-inner">
      <div className="flex-1 bg-emerald-800/30" />
      {injuryOnly > 0 && (
        <div className="bg-warning/80" style={{ height: `${injuryOnly}%` }} aria-hidden />
      )}
      {cappedDeath > 0 && (
        <div className="bg-error/80" style={{ height: `${cappedDeath}%` }} aria-hidden />
      )}
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => {
  const content = (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2">
      <span className="text-[10px] uppercase tracking-[0.35em] text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-ivory">{value}</span>
      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </div>
  );

  return content;
};

export const QuestDetailPanel: React.FC<QuestDetailPanelProps> = ({ summary, activity, config }) => {
  if (!summary || !activity) {
    return (
      <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-4 text-center text-sm text-slate-400">
        Seleziona una quest o attività dalla mappa per vedere i dettagli.
      </div>
    );
  }

  const indicators = getQuestIndicators(activity, config ?? null);
  const rewardLabel =
    summary.rewardLabel ??
    (activity.rewards && activity.rewards.length > 0
      ? activity.rewards.map((delta) => `${delta.amountFormula} ${delta.resourceId}`).join(', ')
      : 'Nessuna ricompensa configurata');

  const durationTotal = formatSeconds(summary.totalDurationSeconds);
  const durationRemaining = formatSeconds(summary.remainingSeconds);
  const questLevel = activity.level ?? (typeof activity.metadata?.level === 'number' ? activity.metadata.level : '—');

  return (
    <section className="rounded-3xl border border-amber-400/40 bg-black/75 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">
            {summary.kindLabel}
          </div>
          <div className="flex items-center gap-2 text-lg font-semibold text-ivory">
            <span>{summary.icon}</span>
            <span>{summary.label}</span>
          </div>
          <div className="text-xs text-slate-400">
            Quest level {questLevel} · Slot {summary.slotId ?? 'N/A'}
          </div>
        </div>
        <div className="text-right text-[10px] uppercase tracking-[0.3em] text-slate-400">
          Stato: <span className="text-amber-200">{summary.source === 'scheduled' ? 'Attiva' : 'Offerta'}</span>
        </div>
      </header>

      <div className="mt-4 flex items-center gap-4">
        <RiskStripe injuryPct={summary.injuryPercentage} deathPct={summary.deathPercentage} />
        <div className="grid flex-1 grid-cols-2 gap-3 text-sm">
          <InfoRow
            label="Rischio Injury"
            value={`${summary.injuryPercentage}%`}
            hint="Rischio stimato basato sui metadata della quest."
          />
          <InfoRow
            label="Rischio Death"
            value={`${summary.deathPercentage}%`}
            hint="Usa il snapshot risk se disponibile durante il scheduling."
          />
          <InfoRow label="Durata totale" value={durationTotal} hint="Tempo previsto per completare la missione." />
          <InfoRow
            label="Tempo restante"
            value={durationRemaining}
            hint="Basato sull'orologio del scheduler attuale."
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-1">Ricompense</div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-sm text-ivory">
          {rewardLabel}
        </div>
      </div>

      {(indicators.difficulty || indicators.reward) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {indicators.difficulty && (
            <Tooltip content={indicators.difficulty.tooltip ?? 'Categoria di difficoltà della quest.'}>
              <span
                className={[
                  'rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]',
                  indicators.difficulty.colorClass ?? 'text-amber-200 border-amber-300/60',
                ].join(' ')}
              >
                Difficulty · {indicators.difficulty.label}
              </span>
            </Tooltip>
          )}
          {indicators.reward && (
            <Tooltip content={indicators.reward.tooltip ?? 'Categoria di ricompensa stimata.'}>
              <span
                className={[
                  'rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]',
                  indicators.reward.colorClass ?? 'text-emerald-200 border-emerald-300/60',
                ].join(' ')}
              >
                Reward · {indicators.reward.label}
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </section>
  );
};

export default QuestDetailPanel;

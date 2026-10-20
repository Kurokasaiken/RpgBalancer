import React from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { faseAt, type QuestFase } from '@/ui/idleVillage/quests/questJourney';
import { HudChip, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { EngravedIcon } from './engravedIcons';

const FONT = {
  display: 'var(--skin-font-display)',
} as const;

/** The three journey fasi in canonical order — the strip's cells. */
const JOURNEY_FASI: readonly QuestFase[] = ['andata', 'svolgimento', 'ritorno'];

/** Props for the journey phase strip inside the quest window footer. */
export interface QuestJourneyPhaseStripProps {
  run: QuestRunState;
  /** Normative POI `estimatedDurationTicks` — the soft denominator of the
   *  `svolgimento` bar (the `~Nd` label). Optional so harnesses can render
   *  the strip without a resolved POI. */
  svolgimentoEstimateTicks?: number;
}

/** One journey leg: phase label, authored (or estimated) day budget and a
 *  thin fill — `data-progress` exposes the exact fraction for tests. */
const JourneyFaseCell: React.FC<{
  fase: QuestFase;
  label: string;
  daysLabel: string;
  progress: number;
  current: boolean;
}> = ({ fase, label, daysLabel, progress, current }) => {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const tone = current ? 'var(--skin-title-color)' : TONE.secondary;
  return (
    <div
      data-testid="quest-journey-fase"
      data-fase={fase}
      data-current={current}
      data-progress={(pct / 100).toFixed(4)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={`${label} ${daysLabel}`}
      style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, fontFamily: FONT.display, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        <span style={{ color: tone, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ color: TONE.muted, flexShrink: 0 }}>{daysLabel}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 85%, transparent)', border: '1px solid color-mix(in srgb, var(--skin-surface-border) 40%, transparent)' }}>
        <div
          style={{
            height: '100%',
            transformOrigin: 'left center',
            transform: `scaleX(${pct / 100})`,
            transition: 'transform 600ms linear',
            background: current
              ? 'linear-gradient(90deg, color-mix(in srgb, var(--skin-title-color) 55%, transparent), var(--skin-title-color))'
              : 'color-mix(in srgb, var(--skin-title-color) 55%, transparent)',
          }}
        />
      </div>
    </div>
  );
};

/**
 * Journey detail strip (PLAN-053 T-006): three sub-bars — andata `Nd`
 * (authored), svolgimento `~Nd` (live POI estimate, emergent), ritorno `Nd`
 * (equal to andata by contract) — plus the parked «waiting for a decision»
 * chip and the encumbered-loot count chip on the return leg. All reads come
 * from the frozen snapshot + persisted journal via `faseAt`, so reload
 * reconstruction and the map marker share one truth. Renders nothing for
 * legacy (`fasi === null`) or terminal runs.
 */
export const QuestJourneyPhaseStrip: React.FC<QuestJourneyPhaseStripProps> = ({ run, svolgimentoEstimateTicks }) => {
  const { t } = useTranslation('idleVillage');
  const journey = run.journey;
  if (!journey || run.ended) return null;

  const { snapshot, journal } = journey;
  const view = faseAt(snapshot, journal);
  const order = JOURNEY_FASI.indexOf(view.fase);
  const estimateDays =
    svolgimentoEstimateTicks !== undefined && svolgimentoEstimateTicks > 0
      ? Math.max(1, Math.round(svolgimentoEstimateTicks / snapshot.ticksPerDay))
      : null;

  const faseProgress = (fase: QuestFase, i: number): number => {
    if (i < order) return 1;
    if (i > order) return 0;
    if (fase === 'svolgimento') {
      return svolgimentoEstimateTicks ? Math.min(1, view.faseElapsedTicks / svolgimentoEstimateTicks) : 0;
    }
    return view.faseProgress ?? 0;
  };

  return (
    <div
      data-testid="quest-journey-phases"
      data-fase={view.fase}
      data-parked={String(view.parked)}
      data-endpoint-resolving={String(view.endpointResolving)}
      style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        {JOURNEY_FASI.map((fase, i) => (
          <JourneyFaseCell
            key={fase}
            fase={fase}
            label={t(`gameFrame.questJourney.phase.${fase}`)}
            daysLabel={
              fase === 'svolgimento'
                ? estimateDays !== null
                  ? t('gameFrame.questJourney.daysEstimate', { days: estimateDays })
                  : ''
                : t('gameFrame.questJourney.days', { days: snapshot.travelDays })
            }
            progress={faseProgress(fase, i)}
            current={i === order}
          />
        ))}
      </div>
      {(view.parked || (view.fase === 'ritorno' && (run.loot?.length ?? 0) > 0)) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {view.parked && (
            <span data-testid="quest-journey-parked">
              <HudChip tone="warn" title={t('gameFrame.questJourney.awaitingDecision')}>
                {t('gameFrame.questJourney.awaitingDecision')}
              </HudChip>
            </span>
          )}
          {view.fase === 'ritorno' && (run.loot?.length ?? 0) > 0 && (
            <span data-testid="quest-journey-loot">
              <HudChip tone="label" title={t('gameFrame.questJourney.lootChip', { count: run.loot.length })}>
                <EngravedIcon id="ico-pouch" size={12} />
                {t('gameFrame.questJourney.lootChip', { count: run.loot.length })}
              </HudChip>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestJourneyPhaseStrip;

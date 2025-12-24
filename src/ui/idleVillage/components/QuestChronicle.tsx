import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { QuestPhase, QuestPhaseResult } from '@/balancing/config/idleVillage/types';
import idleVillagePanorama from '@/assets/ui/idleVillage/idle-village-map.jpg';

/**
 * Visual status for a quest phase indicator.
 */
export type PhaseVisualState = 'locked' | 'active' | 'success' | 'failure';

export interface QuestChroniclePhase {
  phase: QuestPhase;
  state: PhaseVisualState;
  result?: QuestPhaseResult;
}

export interface QuestChronicleProps {
  title: string;
  summary?: string;
  phases: QuestChroniclePhase[];
  currentPhaseIndex: number;
  onOpenTheater?: () => void;
  panoramaUrl?: string;
}

/**
 * QuestChronicle renders a cinematic quest overview with panorama art,
 * CTA to open the theater view, and VerbCard-style phase indicators.
 */
interface DerivedPhaseCard {
  key: string;
  phase: QuestPhase;
  icon: string;
  visualVariant: 'amethyst' | 'ember' | 'jade';
  progressFraction: number;
  injuryPercentage: number;
  deathPercentage: number;
  isCurrent: boolean;
  state: PhaseVisualState;
  result?: QuestPhaseResult;
}

const QuestChronicle: React.FC<QuestChronicleProps> = ({
  title,
  summary: _summary,
  phases,
  currentPhaseIndex,
  onOpenTheater,
  panoramaUrl,
}) => {
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(true);
  const derivedVerbCards: DerivedPhaseCard[] = useMemo(() => {
    return phases.map((entry, index) => {
      const phase = entry.phase;
      const isCurrent = index === currentPhaseIndex;
      const variantMap: Record<QuestPhase['type'], 'amethyst' | 'ember' | 'jade'> = {
        TRIAL: 'amethyst',
        COMBAT: 'ember',
        WORK: 'jade',
      };
      const injuryMap: Record<QuestPhase['type'], number> = {
        TRIAL: 18,
        COMBAT: 40,
        WORK: 8,
      };
      const deathMap: Record<QuestPhase['type'], number> = {
        TRIAL: 4,
        COMBAT: 15,
        WORK: 0,
      };
      const progressFraction =
        entry.state === 'success' ? 1 : entry.state === 'active' ? 0.45 : entry.state === 'failure' ? 0.15 : 0;
      return {
        key: phase.id,
        phase,
        icon: phase.icon ?? (phase.type === 'COMBAT' ? '⚔️' : phase.type === 'TRIAL' ? '🎲' : '🛠️'),
        visualVariant: variantMap[phase.type],
        progressFraction,
        injuryPercentage: injuryMap[phase.type],
        deathPercentage: deathMap[phase.type],
        isCurrent,
        state: entry.state,
        result: entry.result,
      };
    });
  }, [phases, currentPhaseIndex]);

  const latestResolved = useMemo(() => {
    const resolved = phases.filter((entry) => entry.result);
    return resolved[resolved.length - 1] ?? null;
  }, [phases]);

  const boardStatus = (() => {
    if (latestResolved?.result?.result === 'failure') return 'failure';
    if (latestResolved?.result?.result === 'success') return 'success';
    const anyFailure = phases.some((entry) => entry.state === 'failure');
    if (anyFailure) return 'failure';
    const allComplete = phases.every((entry) => entry.state === 'success');
    if (allComplete) return 'success';
    return 'pending';
  })();

  const boardLabel =
    boardStatus === 'success'
      ? 'Ultima prova superata'
      : boardStatus === 'failure'
        ? 'Prova fallita — prepara un piano di recupero'
        : 'In attesa di esito dalla pattuglia';

  const boardLabelClasses = clsx('text-xs uppercase tracking-[0.35em]', {
    'text-emerald-200': boardStatus === 'success',
    'text-rose-300': boardStatus === 'failure',
    'text-slate-200': boardStatus === 'pending',
  });

  const activeNarrative = derivedVerbCards[currentPhaseIndex]?.phase.narrative ?? null;
  const backgroundImage = panoramaUrl ?? idleVillagePanorama;

  return (
    <div
      className="relative overflow-hidden rounded-[36px] border border-amber-200/30 text-ivory shadow-[0_30px_80px_rgba(0,0,0,0.65)]"
      style={{ aspectRatio: '21 / 9' }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-linear-to-br from-black/80 via-black/50 to-black/85" aria-hidden="true" />
      <div className="relative z-10 grid h-full grid-rows-4 gap-6 px-8 py-6 pb-[25%]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Quest Chronicle</p>
            <h3 className="text-3xl font-semibold tracking-[0.25em] text-amber-100">{title}</h3>
          </div>
          {onOpenTheater && (
            <button
              type="button"
              className="rounded-full border border-amber-400/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.35em] text-amber-100 transition hover:bg-amber-400/20"
              onClick={onOpenTheater}
            >
              Apri Teatro
            </button>
          )}
        </div>

        <div className="flex flex-col rounded-3xl border border-amber-100/30 bg-black/25 px-5 py-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-100/80">
              Diario di pattuglia
            </p>
            <button
              type="button"
              className="text-xs uppercase tracking-[0.3em] text-amber-200 hover:text-amber-100"
              onClick={() => setIsNarrativeExpanded((prev) => !prev)}
            >
              {isNarrativeExpanded ? 'Collassa' : 'Espandi'}
            </button>
          </div>
          <div
            className={clsx(
              'transition-all duration-300 ease-out',
              isNarrativeExpanded ? 'mt-1 max-h-40 opacity-100' : 'max-h-0 overflow-hidden opacity-0',
            )}
          >
            {isNarrativeExpanded && (
              <p className="text-base text-amber-50/90">
                {activeNarrative ?? 'In attesa di istruzioni dalla pattuglia.'}
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className={clsx(boardLabelClasses, 'text-right')}>{boardLabel}</p>
            {latestResolved?.result?.result && (
              <span
                className={clsx(
                  'rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em]',
                  latestResolved.result.result === 'success'
                    ? 'border border-emerald-400/60 text-emerald-200'
                    : 'border border-rose-500/60 text-rose-200',
                )}
              >
                {latestResolved.result.result === 'success' ? 'Successo' : 'Fallimento'}
              </span>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 flex h-1/4 flex-col justify-end gap-3 bg-black/30 px-8 pb-3 pt-4">
          <div className="flex items-end gap-4">
            {derivedVerbCards.map((card) => (
              <QuestPhaseSlot key={card.key} card={card} />
            ))}
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-900/70">
            <div className="absolute inset-0 flex h-full">
              {derivedVerbCards.map((card, index) => (
                <PhaseProgressSegment key={`segment_${card.key}`} card={card} isLast={index === derivedVerbCards.length - 1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QuestPhaseSlotProps {
  card: DerivedPhaseCard;
}

const QuestPhaseSlot: React.FC<QuestPhaseSlotProps> = ({ card }) => {
  const rimClass =
    card.state === 'success'
      ? 'border-emerald-400/70 shadow-[0_0_22px_rgba(16,185,129,0.45)]'
      : card.state === 'failure'
        ? 'border-rose-500/70 shadow-[0_0_22px_rgba(244,63,94,0.45)]'
        : card.state === 'active'
          ? 'border-amber-300/80 shadow-[0_0_28px_rgba(251,191,36,0.55)]'
          : 'border-slate-600/70 shadow-[0_0_18px_rgba(15,23,42,0.55)]';

  const icon = card.icon ?? (card.phase.type === 'COMBAT' ? '⚔️' : card.phase.type === 'TRIAL' ? '🎲' : '🛠️');

  return (
    <div className="flex flex-1 flex-col items-center gap-1 pb-1">
      <div
        className={clsx(
          'relative flex h-20 w-20 items-center justify-center rounded-full border-2 bg-slate-950/80 text-2xl text-amber-100 transition-all duration-200',
          rimClass,
        )}
      >
        <span className="drop-shadow-[0_0_14px_rgba(251,191,36,0.55)]">{icon}</span>
        <div className="absolute inset-y-4 right-3 w-1 overflow-hidden rounded-full bg-slate-900/70">
          <div
            className="absolute bottom-0 left-0 right-0 bg-warning/80"
            style={{ height: `${Math.min(100, card.injuryPercentage)}%` }}
          />
          {card.deathPercentage > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-error/80"
              style={{ height: `${Math.min(100, card.deathPercentage)}%` }}
            />
          )}
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-200">{card.phase.label}</div>
    </div>
  );
};

const variantFillMap: Record<'amethyst' | 'ember' | 'jade', string> = {
  amethyst: 'from-fuchsia-400 via-purple-500 to-fuchsia-300',
  ember: 'from-amber-300 via-orange-500 to-rose-400',
  jade: 'from-emerald-300 via-teal-400 to-emerald-200',
};

interface PhaseProgressSegmentProps {
  card: DerivedPhaseCard;
  isLast: boolean;
}

const PhaseProgressSegment: React.FC<PhaseProgressSegmentProps> = ({ card, isLast }) => {
  const fillClass = variantFillMap[card.visualVariant] ?? 'from-amber-200 via-amber-400 to-amber-200';

  return (
    <div className={clsx('relative flex-1 border-r border-slate-800/60', isLast && '!border-r-0')}>
      <div
        className={clsx('absolute inset-y-0 left-0 rounded-r-full bg-gradient-to-r shadow-[0_0_15px_rgba(251,191,36,0.35)]', fillClass)}
        style={{ width: `${card.progressFraction * 100}%` }}
      />
    </div>
  );
};

export default QuestChronicle;

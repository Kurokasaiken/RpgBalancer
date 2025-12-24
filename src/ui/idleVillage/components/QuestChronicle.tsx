import React from 'react';
import clsx from 'clsx';
import type { QuestPhase, QuestPhaseResult } from '@/balancing/config/idleVillage/types';

/**
 * Visual status for a quest phase indicator.
 */
type PhaseVisualState = 'locked' | 'active' | 'success' | 'failure';

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
}

/**
 * QuestChronicle renders a compact “Frontier Scroll” style card that visualizes
 * the phase progression for a quest blueprint.
 */
const QuestChronicle: React.FC<QuestChronicleProps> = ({
  title,
  summary,
  phases,
  currentPhaseIndex,
  onOpenTheater,
}) => {
  return (
    <div className="rounded-3xl border border-amber-200/40 bg-slate-950/70 p-4 text-ivory shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Quest Chronicle</p>
          <h3 className="text-lg font-semibold tracking-[0.2em] text-amber-100">{title}</h3>
          {summary && <p className="mt-1 text-xs text-slate-300">{summary}</p>}
        </div>
        {onOpenTheater && (
          <button
            type="button"
            className="rounded-full border border-amber-400/60 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-amber-200 hover:bg-amber-500/20 transition-colors"
            onClick={onOpenTheater}
          >
            Apri Teatro
          </button>
        )}
      </div>
      <div className="mt-4 flex gap-3">
        <div className="flex flex-col items-center gap-4">
          {phases.map((entry, index) => {
            const isActive = index === currentPhaseIndex;
            return (
              <div key={entry.phase.id} className="flex flex-col items-center gap-1">
                <div
                  className={clsx(
                    'grid h-10 w-10 place-items-center rounded-full border-2 text-lg transition-all',
                    {
                      'border-amber-300 bg-amber-400/20 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.6)]':
                        entry.state === 'active',
                      'border-emerald-400 bg-emerald-500/20 text-emerald-100': entry.state === 'success',
                      'border-rose-500 bg-rose-700/30 text-rose-100': entry.state === 'failure',
                      'border-slate-700 bg-slate-800 text-slate-500': entry.state === 'locked',
                    },
                  )}
                >
                  {entry.phase.icon ?? (entry.state === 'success' ? '✔' : entry.state === 'failure' ? '✖' : '◎')}
                </div>
                <div className="text-center text-[10px] uppercase tracking-[0.3em] text-slate-200">
                  {entry.phase.label}
                </div>
                {entry.state === 'success' && (
                  <div className="text-[9px] text-emerald-300">{entry.result?.notes ?? 'Completata'}</div>
                )}
                {entry.state === 'failure' && (
                  <div className="text-[9px] text-rose-300">{entry.result?.notes ?? 'Fallita'}</div>
                )}
                {isActive && (
                  <div className="text-[9px] text-amber-300">
                    {entry.phase.narrative ?? 'In corso…'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestChronicle;

import type { FC } from 'react';
import type { QuestAssignmentPreviewResult } from '@/ui/idleVillage/hooks/useQuestAssignmentPreview';

export interface QuestAssignmentPreviewProps {
  preview: QuestAssignmentPreviewResult;
}

const formatPercent = (value: number): string => `${value.toFixed(0)}%`;

/**
 * Live, deterministic preview of a quest's projected odds while the player
 * assigns residents/items. Updates on every assignment change — no rng.
 */
export const QuestAssignmentPreview: FC<QuestAssignmentPreviewProps> = ({ preview }) => {
  const {
    powerRatio,
    projectedDeathChance,
    projectedInjuryChance,
    projectedRewardMultiplier,
    canEmbark,
    blockingReasons,
  } = preview;

  return (
    <div
      data-testid="quest-assignment-preview"
      className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-4 space-y-3"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
        Preview Assegnazione
      </h3>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Rischio Morte</p>
          <p className="text-lg font-semibold text-rose-300">{formatPercent(projectedDeathChance)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Rischio Ferita</p>
          <p className="text-lg font-semibold text-amber-300">{formatPercent(projectedInjuryChance)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Moltiplicatore Reward</p>
          <p className="text-lg font-semibold text-emerald-300">{projectedRewardMultiplier.toFixed(2)}×</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Power ratio: <span className="text-slate-300">{powerRatio.toFixed(2)}</span>
      </p>

      {!canEmbark && blockingReasons.length > 0 && (
        <ul className="space-y-1 rounded border border-rose-700/40 bg-rose-950/30 p-2 text-[11px] text-rose-300">
          {blockingReasons.map((reason) => (
            <li key={reason}>⚠ {reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QuestAssignmentPreview;

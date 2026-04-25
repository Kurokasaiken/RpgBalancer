import ActionCardBase from '../ActionCardBase';
import ActionProgressBar from '../ActionProgressBar';
import ActionHalo from '../ActionHalo';
import type { ActionCardProps } from '../ActionCard';
import { formatMiniCardCountdown } from '../cardFormatting';
import { buildTimeMetrics, resolveMetrics } from './shared';

export interface TrainingCardProps extends Omit<
  ActionCardProps,
  | 'variant'
  | 'showStats'
  | 'hideHeader'
  | 'showStatusLabel'
  | 'countdownFontSizePx'
  | 'countdownFormatter'
  | 'chromeless'
> {
  /** Describes the stat or mastery gain (e.g., "+5 Discipline"). */
  statGainLabel?: string;
  statGainValue?: string;
  /** Describes the fatigue or cost impact of the drill. */
  fatigueCostLabel?: string;
  fatigueCostValue?: string;
}

/**
 * Training wrapper tuned for drills that boost resident mastery with minimal risk.
 */
export function TrainingCard({
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  metrics,
  assignees,
  assigneeDisplayLimit,
  statusLabel,
  dataTestId,
  pillar,
  dropState,
  _onStatusChange,
  _onCollect,
  _collectLabel,
  _collectDisabled,
  statGainLabel,
  statGainValue,
  fatigueCostLabel,
  fatigueCostValue,
  ...rest
}: TrainingCardProps) {
  const timeMetrics = buildTimeMetrics(progressFraction, elapsedSeconds, totalDurationSeconds);
  const customMetrics = [
    statGainLabel && statGainValue ? { label: statGainLabel, value: statGainValue } : null,
    fatigueCostLabel && fatigueCostValue ? { label: fatigueCostLabel, value: fatigueCostValue } : null,
  ];

  return (
    <ActionCardBase
      label={rest.label}
      icon={rest.icon}
      subtitle={rest.subtitle}
      helperText={rest.helperText}
      assignees={assignees}
      assigneeDisplayLimit={assigneeDisplayLimit}
      statusLabel={statusLabel}
      metrics={resolveMetrics(metrics, [...customMetrics, ...timeMetrics])}
      dataTestId={dataTestId ?? 'training-action-card'}
      pillar={pillar}
      dropState={dropState}
    >
      {/* Progress ring */}
      <ActionProgressBar
        progressFraction={progressFraction}
        elapsedSeconds={elapsedSeconds}
        totalDurationSeconds={totalDurationSeconds}
        variant="azure"
        countdownFormatter={formatMiniCardCountdown}
        countdownFontSizePx={9}
        pillar={pillar}
      />
      
      {/* Halo for map POI */}
      <ActionHalo
        iconText="TRAIN"
        size={32}
        ringWidth={4}
        pillar={pillar}
        enableBloom={true}
      />
    </ActionCardBase>
  );
}

export default TrainingCard;

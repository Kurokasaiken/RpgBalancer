import ActionCardBase from '../ActionCardBase';
import ActionProgressBar from '../ActionProgressBar';
import ActionHalo from '../ActionHalo';
import type { ActionCardProps } from '../ActionCard';
import { formatMiniCardCountdown } from '../cardFormatting';

export type JobCardProps = Omit<
  ActionCardProps,
  | 'variant'
  | 'showStats'
  | 'hideHeader'
  | 'showStatusLabel'
  | 'showHaloTrail'
  | 'showHaloGlowFill'
  | 'showHaloOrbit'
  | 'countdownFontSizePx'
  | 'countdownFormatter'
  | 'chromeless'
  | 'enableHaloBloom'
>;

/**
 * Job wrapper that composes ActionCardBase + ActionProgressBar + ActionHalo.
 * Applies job-specific defaults and maintains semantic-only props.
 */
export function JobCard({
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
  ...rest
}: JobCardProps) {
  return (
    <ActionCardBase
      dataTestId="job-card"
      label={rest.label}
      icon={rest.icon}
      subtitle={rest.subtitle}
      helperText={rest.helperText}
      assignees={assignees}
      assigneeDisplayLimit={assigneeDisplayLimit}
      statusLabel={statusLabel}
      metrics={metrics}
      dataTestId={dataTestId ?? 'job-action-card'}
      pillar={pillar}
      dropState={dropState}
    >
      {/* Progress ring */}
      <ActionProgressBar
        progressFraction={progressFraction}
        elapsedSeconds={elapsedSeconds}
        totalDurationSeconds={totalDurationSeconds}
        variant="jade"
        countdownFormatter={formatMiniCardCountdown}
        countdownFontSizePx={9}
        pillar={pillar}
      />
      
      {/* Halo for map POI */}
      <ActionHalo
        iconText="JOB"
        size={32}
        ringWidth={4}
        pillar={pillar}
        enableBloom={true}
      />
    </ActionCardBase>
  );
}

export default JobCard;

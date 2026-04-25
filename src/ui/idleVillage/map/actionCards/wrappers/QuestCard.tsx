import ActionCardBase from '../ActionCardBase';
import ActionProgressBar from '../ActionProgressBar';
import ActionHalo from '../ActionHalo';
import type { ActionCardProps } from '../ActionCard';
import { formatMiniCardCountdown } from '../cardFormatting';
import { buildTimeMetrics, resolveMetrics } from './shared';

export type QuestCardProps = Omit<
  ActionCardProps,
  | 'variant'
  | 'showStats'
  | 'hideHeader'
  | 'showStatusLabel'
  | 'countdownFontSizePx'
  | 'countdownFormatter'
  | 'chromeless'
  | 'injuryPercentage'
  | 'deathPercentage'
>;

/**
 * Quest wrapper that composes ActionCardBase + ActionProgressBar + ActionHalo.
 * Enables risk stripes, collect CTA, and telemetry forwarding.
 */
export function QuestCard({
  progressFraction,
  elapsedSeconds,
  totalDurationSeconds,
  injuryPercentage = 0,
  deathPercentage = 0,
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
}: QuestCardProps) {
  const fallbackMetrics = buildTimeMetrics(progressFraction, elapsedSeconds, totalDurationSeconds);

  return (
    <ActionCardBase
      label={rest.label}
      icon={rest.icon}
      subtitle={rest.subtitle}
      helperText={rest.helperText}
      assignees={assignees}
      assigneeDisplayLimit={assigneeDisplayLimit}
      statusLabel={statusLabel}
      metrics={resolveMetrics(metrics, fallbackMetrics)}
      dataTestId={dataTestId ?? 'quest-action-card'}
      pillar={pillar}
      dropState={dropState}
    >
      {/* Progress ring */}
      <ActionProgressBar
        progressFraction={progressFraction}
        elapsedSeconds={elapsedSeconds}
        totalDurationSeconds={totalDurationSeconds}
        variant="amethyst"
        countdownFormatter={formatMiniCardCountdown}
        countdownFontSizePx={9}
        pillar={pillar}
      />
      
      {/* Halo for map POI */}
      <ActionHalo
        iconText="QUEST"
        size={32}
        ringWidth={4}
        pillar={pillar}
        enableBloom={true}
      />
      
      {/* Risk stripes overlay */}
      {(injuryPercentage > 0 || deathPercentage > 0) && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '4px',
            display: 'flex',
            borderRadius: '0 0 4px 4px',
            overflow: 'hidden',
          }}
        >
          {injuryPercentage > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.8)',
                height: '100%',
                width: `${injuryPercentage}%`,
              }}
            />
          )}
          {deathPercentage > 0 && injuryPercentage > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                height: '100%',
                width: `${deathPercentage}%`,
              }}
            />
          )}
          {deathPercentage > 0 && injuryPercentage === 0 && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                height: '100%',
                width: `${deathPercentage}%`,
              }}
            />
          )}
        </div>
      )}
    </ActionCardBase>
  );
}

export default QuestCard;
